import React, { useState, useEffect } from 'react';
import { callGemini, callGeminiStream } from '../../utils/gemini';
import { FB_FS, FB_KEY } from '../../utils/firebase';

const GEMINI_KEY = process.env.REACT_APP_GEMINI_KEY;

function AITab({ assignments, classes }) {
  const [aiMode, setAiMode] = useState('chat');

  // Chat mode state
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hi! I'm your AI study assistant. Ask me anything about studying! 🎓" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Homework helper state
  const [homeworkStep, setHomeworkStep] = useState('upload'); // 'upload' | 'analyzing' | 'explanation' | 'check' | 'checking' | 'done'
  const [hasUploadedPhoto, setHasUploadedPhoto] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);       // base64 of question image
  const [homeworkExplanation, setHomeworkExplanation] = useState(''); // AI explanation of how to do it
  const [answerImage, setAnswerImage] = useState(null);            // base64 of student's answer
  const [answerFeedback, setAnswerFeedback] = useState('');        // AI feedback on answer
  const [homeworkMessages, setHomeworkMessages] = useState([]);    // follow-up chat
  const [homeworkInput, setHomeworkInput] = useState('');
  const [homeworkLoading, setHomeworkLoading] = useState(false);

  // Phone upload state
  const [uploadId, setUploadId] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [checkingUploads, setCheckingUploads] = useState(false);
  // which upload slot is the QR for: 'question' | 'answer'
  const [qrSlot, setQrSlot] = useState('question');

  // Flashcards state
  const [flashcardTopic, setFlashcardTopic] = useState('');
  const [flashcards, setFlashcards] = useState([]);
  const [flashcardLoading, setFlashcardLoading] = useState(false);
  const [flippedCards, setFlippedCards] = useState(new Set());

  // Writing state
  const [writingText, setWritingText] = useState('');
  const [writingFeedback, setWritingFeedback] = useState('');
  const [writingLoading, setWritingLoading] = useState(false);

  // Insights state
  const [insights, setInsights] = useState('');
  const [insightsLoading, setInsightsLoading] = useState(false);

  // ── Markdown + KaTeX renderer ─────────────────────────────────────────────────
  const renderMarkdown = (text) => {
    if (!text) return '';

    // Protect code blocks
    const codeBlocks = [];
    let p = text.replace(/```[\s\S]*?```/g, (m) => { codeBlocks.push(m); return `%%CB${codeBlocks.length - 1}%%`; });

    // Display math $$...$$
    p = p.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
      try { return `<div style="text-align:center;margin:12px 0;overflow-x:auto;">${window.katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>`; }
      catch { return `<code>$$${math}$$</code>`; }
    });

    // Inline math $...$
    p = p.replace(/\$([^\n$]+?)\$/g, (_, math) => {
      try { return window.katex.renderToString(math.trim(), { displayMode: false, throwOnError: false }); }
      catch { return `<code>$${math}$</code>`; }
    });

    // Standard markdown
    p = p
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code style="background:var(--bg3);padding:2px 4px;border-radius:4px;font-family:monospace;font-size:.85em;">$1</code>')
      .replace(/^####\s(.*)$/gm, '<h4 style="font-size:1rem;font-weight:700;margin:12px 0 6px;color:var(--text);">$1</h4>')
      .replace(/^###\s(.*)$/gm,  '<h3 style="font-size:1.1rem;font-weight:700;margin:16px 0 8px;color:var(--text);">$1</h3>')
      .replace(/^##\s(.*)$/gm,   '<h2 style="font-size:1.2rem;font-weight:700;margin:20px 0 10px;color:var(--text);">$1</h2>')
      .replace(/^#\s(.*)$/gm,    '<h1 style="font-size:1.3rem;font-weight:700;margin:20px 0 10px;color:var(--text);">$1</h1>')
      .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid var(--border);margin:16px 0;">')
      .replace(/^[-*]\s(.*)$/gm, '<li style="margin:4px 0;margin-left:8px;">$1</li>')
      .replace(/^\d+\.\s(.*)$/gm, '<li style="margin:4px 0;margin-left:8px;">$1</li>')
      .replace(/\n\n/g, '</p><p style="margin:8px 0;">')
      .replace(/\n/g, '<br/>');

    // Wrap <li> runs in <ul>
    p = p.replace(/(<li[^>]*>[\s\S]*?<\/li>(<br\/>)?)+/g, (m) => {
      const clean = m.replace(/<br\/>/g, '');
      return `<ul style="margin:8px 0;padding-left:20px;">${clean}</ul>`;
    });

    // Restore code blocks
    p = p.replace(/%%CB(\d+)%%/g, (_, i) => {
      const code = codeBlocks[parseInt(i)].replace(/^```\w*\n?/, '').replace(/```$/, '');
      return `<pre style="background:var(--bg3);padding:12px;border-radius:8px;overflow-x:auto;font-family:monospace;font-size:.82rem;margin:8px 0;"><code>${code}</code></pre>`;
    });

    return `<span>${p}</span>`;
  };

  // ── Gemini vision streaming call ─────────────────────────────────────────────
  const callGeminiWithImageStream = async (prompt, base64Image, onChunk) => {
    const b64 = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const mimeMatch = base64Image.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: b64 } }] }],
          generationConfig: { maxOutputTokens: 4096 }
        })
      }
    );
    if (!res.ok) throw new Error(`Gemini vision error: ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value, { stream: true }).split('\n');
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') break;
        try {
          const piece = JSON.parse(data).candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (piece) { accumulated += piece; onChunk(accumulated); }
        } catch (_) {}
      }
    }
    return accumulated;
  };




  // ── Reset homework helper ────────────────────────────────────────────────────
  const resetHomework = () => {
    setHomeworkStep('upload');
    setHasUploadedPhoto(false);
    setUploadedImage(null);
    setHomeworkExplanation('');
    setAnswerImage(null);
    setAnswerFeedback('');
    setHomeworkMessages([]);
    setHomeworkInput('');
    setHomeworkLoading(false);
    setShowQR(false);
    setCheckingUploads(false);
  };

  // ── Step 1: Handle question image upload → auto-analyze (streaming) ───────────
  const processQuestionImage = async (imageData) => {
    setUploadedImage(imageData);
    setHasUploadedPhoto(true);
    setHomeworkStep('analyzing');
    setHomeworkExplanation('');

    try {
      // Move to explanation step immediately so streaming text shows as it arrives
      setHomeworkStep('explanation');
      await callGeminiWithImageStream(
        `You are a helpful homework tutor. Look at this homework image carefully.

1. Identify exactly what type of homework this is (subject, assignment type).
2. Explain clearly and step-by-step HOW to do this homework / solve these problems.
3. Give helpful tips or strategies the student should use.
4. Do NOT give the direct answers — teach the student how to approach it.

Use clear markdown formatting with headers, numbered steps, and math notation where relevant.`,
        imageData,
        (streamedText) => {
          setHomeworkExplanation(streamedText);
          setTimeout(() => {
            const el = document.querySelector('.hw-explanation-scroll');
            if (el) el.scrollTop = el.scrollHeight;
          }, 50);
        }
      );
    } catch (err) {
      setHomeworkExplanation('Sorry, I had trouble analyzing your homework image. Please try again.');
    }
  };

  const handleQuestionFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => processQuestionImage(ev.target.result);
    reader.readAsDataURL(file);
  };

  // ── Step 2: Handle answer image upload → check answer (streaming) ─────────────
  const processAnswerImage = async (imageData) => {
    setAnswerImage(imageData);
    setHomeworkStep('checking');
    setAnswerFeedback('');

    try {
      // Move to done immediately so streaming feedback shows as it arrives
      setHomeworkStep('done');
      setHomeworkMessages([
        { role: 'ai', text: "I've reviewed your work above! Feel free to ask me any follow-up questions. 💬" }
      ]);
      await callGeminiWithImageStream(
        `You are a helpful homework tutor. The student has submitted their completed work.

Look at this image carefully and provide:
1. **Overall Assessment** — Is the work correct, partially correct, or needs revision?
2. **What's correct** — Point out specific things they got right.
3. **What needs fixing** — Point out specific errors or gaps, with explanations.
4. **How to improve** — Give concrete next steps to fix any mistakes.

Be encouraging, specific, and educational. Use markdown formatting and math notation where relevant.`,
        imageData,
        (streamedText) => {
          setAnswerFeedback(streamedText);
          setTimeout(() => {
            const el = document.querySelector('.hw-feedback-scroll');
            if (el) el.scrollTop = el.scrollHeight;
          }, 50);
        }
      );
    } catch (err) {
      setAnswerFeedback('Sorry, I had trouble reviewing your answer. Please try again.');
    }
  };

  const handleAnswerFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => processAnswerImage(ev.target.result);
    reader.readAsDataURL(file);
  };

  // ── Phone QR upload ──────────────────────────────────────────────────────────
  const generateUploadId = () =>
    Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  const handlePhoneUpload = (slot) => {
    const id = generateUploadId();
    setUploadId(id);
    setQrSlot(slot);
    setShowQR(true);
    setCheckingUploads(true);
  };

  useEffect(() => {
    if (!uploadId || !checkingUploads) return;

    const checkInterval = setInterval(async () => {
      try {
        const response = await fetch(`${FB_FS}/uploads/${uploadId}?key=${FB_KEY}`);
        if (response.ok) {
          const data = await response.json();
          const imageData = data.fields?.image?.stringValue;
          if (imageData) {
            setCheckingUploads(false);
            setShowQR(false);
            if (qrSlot === 'question') {
              processQuestionImage(imageData);
            } else {
              processAnswerImage(imageData);
            }
            setTimeout(() => {
              fetch(`${FB_FS}/uploads/${uploadId}?key=${FB_KEY}`, { method: 'DELETE' }).catch(() => {});
            }, 5000);
          }
        }
      } catch (err) {
        console.log('Checking for upload...', err.message);
      }
    }, 2000);

    const timeout = setTimeout(() => {
      setCheckingUploads(false);
      clearInterval(checkInterval);
    }, 5 * 60 * 1000);

    return () => { clearInterval(checkInterval); clearTimeout(timeout); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadId, checkingUploads]);

  const getQRCodeUrl = (text) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;

  // ── Follow-up chat ───────────────────────────────────────────────────────────
  const handleHomeworkSend = async () => {
    if (!homeworkInput.trim() || homeworkLoading) return;

    const userMessage = homeworkInput.trim();
    setHomeworkInput('');
    setHomeworkMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setHomeworkLoading(true);

    const aiMessageIndex = homeworkMessages.length + 1;
    setHomeworkMessages(prev => [...prev, { role: 'ai', text: '' }]);

    try {
      const context = `You are a homework tutor. The student has already received an explanation of their homework and feedback on their answer. 
Help them with any remaining questions. Be educational, specific, and encouraging.
Use markdown formatting.`;

      const history = homeworkMessages.slice(-6);

      await callGeminiStream(userMessage, context,
        (streamedText) => {
          setHomeworkMessages(prev => {
            const msgs = [...prev];
            msgs[aiMessageIndex] = { role: 'ai', text: streamedText };
            return msgs;
          });
          setTimeout(() => {
            const el = document.querySelector('.hw-followup-chat');
            if (el) el.scrollTop = el.scrollHeight;
          }, 50);
        },
        history
      );
    } catch (err) {
      setHomeworkMessages(prev => {
        const msgs = [...prev];
        msgs[aiMessageIndex] = { role: 'ai', text: 'Sorry, I encountered an error. Please try again.' };
        return msgs;
      });
    }

    setHomeworkLoading(false);
  };

  // ── Chat ─────────────────────────────────────────────────────────────────────
  const handleChatSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    const aiMessageIndex = messages.length + 1;
    setMessages(prev => [...prev, { role: 'ai', text: '' }]);

    try {
      const context = `You are a helpful AI study assistant. Help with general study questions, learning strategies, and academic advice.

Current student context:
- Has ${assignments.length} assignments
- Taking ${classes.length} classes: ${classes.map(c => c.name).join(', ')}

Provide helpful, encouraging responses about studying and academics. Use markdown formatting for better readability.`;

      const history = messages.slice(-6);

      await callGeminiStream(userMessage, context,
        (streamedText) => {
          setMessages(prev => {
            const msgs = [...prev];
            msgs[aiMessageIndex] = { role: 'ai', text: streamedText };
            return msgs;
          });
          setTimeout(() => {
            const el = document.querySelector('.chat-container');
            if (el) el.scrollTop = el.scrollHeight;
          }, 50);
        },
        history
      );
    } catch (err) {
      setMessages(prev => {
        const msgs = [...prev];
        msgs[aiMessageIndex] = { role: 'ai', text: 'Sorry, I encountered an error. Please try again.' };
        return msgs;
      });
    }

    setLoading(false);
  };

  // ── Flashcards ───────────────────────────────────────────────────────────────
  const generateFlashcards = async () => {
    if (!flashcardTopic.trim() || flashcardLoading) return;
    setFlashcardLoading(true);
    setFlashcards([]);
    setFlippedCards(new Set());

    try {
      const context = `Create exactly 6 study flashcards for: ${flashcardTopic}

You are an expert educator. Make questions that test understanding, not just memorization.

Format as JSON array:
[
  {"question": "What is the quadratic formula?", "answer": "x = (-b ± √(b²-4ac)) / 2a"},
  ...
]

Return ONLY the JSON array with exactly 6 flashcards. No other text.`;

      const response = await callGemini(context);
      let cards = [];

      try {
        const clean = response.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
        const parsed = JSON.parse(clean);
        if (Array.isArray(parsed) && parsed.length > 0) cards = parsed.slice(0, 6);
      } catch (_) {}

      // Fallback parsing if JSON fails
      if (cards.length === 0) {
        const lines = response.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        let currentCard = {};

        for (const line of lines) {
          if (line.match(/^(\d+\.|\*|\-|Q:|Question:)/i) || line.includes('?')) {
            if (currentCard.question && currentCard.answer) {
              cards.push(currentCard);
              currentCard = {};
            }
            currentCard.question = line.replace(/^(\d+\.|\*|\-|Q:|Question:)\s*/i, '').trim();
          } else if (line.match(/^(A:|Answer:)/i) || (currentCard.question && !currentCard.answer && line.length > 10)) {
            currentCard.answer = line.replace(/^(A:|Answer:)\s*/i, '').trim();
          }
        }
        if (currentCard.question && currentCard.answer) {
          cards.push(currentCard);
        }
      }

      // If still no cards, create topic-specific fallbacks
      if (cards.length === 0) {
        const topic = flashcardTopic.toLowerCase();
        if (topic.includes('algebra')) {
          cards = [
            {question: `What are the key concepts in ${flashcardTopic}?`, answer: 'Key concepts include quadratic equations, polynomials, functions, graphing, and systems of equations.'},
            {question: 'What is the quadratic formula?', answer: 'x = (-b ± √(b²-4ac)) / 2a'},
            {question: 'How do you factor a quadratic expression?', answer: 'Look for two numbers that multiply to give ac and add to give b, then use grouping or the quadratic formula.'},
            {question: 'What is the vertex form of a parabola?', answer: 'y = a(x - h)² + k, where (h, k) is the vertex'},
            {question: 'How do you solve a system of equations?', answer: 'Use substitution, elimination, or graphing methods to find where the equations intersect.'},
            {question: 'What is the difference between a function and a relation?', answer: 'A function has exactly one output for each input, while a relation can have multiple outputs for one input.'}
          ];
        } else {
          cards = [
            {question: `What is ${flashcardTopic}?`, answer: `${flashcardTopic} is an important topic that requires study and understanding.`},
            {question: `Why is ${flashcardTopic} important?`, answer: `Understanding ${flashcardTopic} helps build foundational knowledge in this subject area.`},
            {question: `What are the main concepts in ${flashcardTopic}?`, answer: `The main concepts include key definitions, principles, and applications related to ${flashcardTopic}.`}
          ];
        }
      }

      setFlashcards(cards.slice(0, 6));
    } catch (err) {
      setFlashcards([{ question: `Study topic: ${flashcardTopic}`, answer: "Sorry, couldn't generate flashcards right now. Please try again." }]);
    }

    setFlashcardLoading(false);
    setFlashcardTopic('');
  };

  const toggleFlashcard = (index) => {
    const next = new Set(flippedCards);
    next.has(index) ? next.delete(index) : next.add(index);
    setFlippedCards(next);
  };

  // ── Writing ──────────────────────────────────────────────────────────────────
  const analyzeWriting = async () => {
    if (!writingText.trim() || writingLoading) return;
    setWritingLoading(true);
    setWritingFeedback('');

    try {
      const context = `Please provide detailed feedback on this writing. Focus on:
1. Grammar and mechanics
2. Clarity and organization
3. Content and arguments
4. Style and tone
5. Specific suggestions for improvement

Be constructive and encouraging. Use markdown formatting.`;

      await callGeminiStream(`Writing to review:\n${writingText}`, context,
        (streamedText) => setWritingFeedback(streamedText)
      );
    } catch (err) {
      setWritingFeedback("Sorry, I couldn't analyze your writing right now. Please try again.");
    }

    setWritingLoading(false);
  };

  // ── Insights ─────────────────────────────────────────────────────────────────
  const generateInsights = async () => {
    if (insightsLoading) return;
    setInsightsLoading(true);
    setInsights('');

    try {
      const summary = assignments.map(a =>
        `${a.title} (${a.subject}) - Due: ${a.dueDate || 'No date'} - Progress: ${a.progress}%`
      ).join('\n');
      const graded = assignments.filter(a => a.grade != null);
      const avgGrade = graded.length > 0
        ? Math.round(graded.reduce((s, a) => s + a.grade, 0) / graded.length) : null;
      const overdue = assignments.filter(a => a.progress < 100 && a.dueDate && new Date(a.dueDate) < new Date());
      const completed = assignments.filter(a => a.progress >= 100);

      const context = `Analyze this student's academic performance:

ASSIGNMENTS (${assignments.length} total):
${summary}

METRICS:
- Completed: ${completed.length}/${assignments.length}
- Overdue: ${overdue.length}
- Avg grade: ${avgGrade || 'N/A'}%
- Classes: ${classes.map(c => c.name).join(', ')}

Provide insights on study patterns, subject performance, areas to improve, and next steps. Use markdown.`;

      await callGeminiStream('Please analyze my academic performance.', context,
        (streamedText) => setInsights(streamedText)
      );
    } catch (err) {
      setInsights("Sorry, I couldn't generate insights right now. Please try again.");
    }

    setInsightsLoading(false);
  };

  // ── Shared UI components ─────────────────────────────────────────────────────
  const ChatMessage = ({ msg, isUser }) => (
    <div style={{ display:'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 16, width:'100%' }}>
      <div style={{ display:'flex', gap:12, alignItems:'flex-start', maxWidth:'80%', flexDirection: isUser ? 'row-reverse' : 'row' }}>
        <div style={{ width:32, height:32, borderRadius:'50%', background: isUser ? 'var(--accent)' : '#6366f1',
          display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'.8rem', fontWeight:700, flexShrink:0 }}>
          {isUser ? '👤' : '🤖'}
        </div>
        <div style={{ background: isUser ? 'var(--accent)' : 'var(--card)', color: isUser ? '#fff' : 'var(--text)',
          padding:'12px 16px', borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          border: isUser ? 'none' : '1.5px solid var(--border)', fontSize:'.85rem', lineHeight:1.6,
          fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }} />
        </div>
      </div>
    </div>
  );

  const ThinkingBubble = () => (
    <div style={{ display:'flex', justifyContent:'flex-start', marginBottom:16 }}>
      <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
        <div style={{ width:32, height:32, borderRadius:'50%', background:'#6366f1', display:'flex',
          alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'.8rem', fontWeight:700 }}>🤖</div>
        <div style={{ background:'var(--card)', padding:'12px 16px', borderRadius:'16px 16px 16px 4px',
          border:'1.5px solid var(--border)', fontSize:'.85rem', color:'var(--text3)' }}>Thinking...</div>
      </div>
    </div>
  );

  const UploadButtons = ({ slot, onFile, onCamera, onPhone }) => (
    <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center' }}>
      <input type="file" accept="image/*" onChange={onFile} style={{ display:'none' }} id={`file-${slot}`} />
      <label htmlFor={`file-${slot}`} className="btn btn-p">📁 Upload File</label>
      <input type="file" accept="image/*" capture="environment" onChange={onCamera} style={{ display:'none' }} id={`cam-${slot}`} />
      <button className="btn btn-p" onClick={() => document.getElementById(`cam-${slot}`).click()}>📷 Take Photo</button>
      <button className="btn btn-p" onClick={onPhone}>📱 Use Phone</button>
    </div>
  );

  const QRModal = () => (
    showQR && uploadId ? (
      <div style={{ marginTop:20, padding:16, background:'var(--bg3)', borderRadius:12, textAlign:'center' }}>
        <div style={{ fontWeight:600, marginBottom:8 }}>📱 Scan with your phone:</div>
        <img src={getQRCodeUrl(`${window.location.origin}/upload/${uploadId}`)} alt="QR Code"
          style={{ borderRadius:8, background:'#fff', padding:8 }} />
        <div style={{ fontSize:'.8rem', color:'var(--text3)', margin:'8px 0' }}>
          Or visit: {window.location.origin}/upload/{uploadId}
        </div>
        {checkingUploads && (
          <div style={{ fontSize:'.8rem', color:'var(--accent)', fontWeight:600, marginBottom:8 }}>⏳ Waiting for upload...</div>
        )}
        <button className="btn btn-g btn-sm" onClick={() => { setShowQR(false); setCheckingUploads(false); }}>Close</button>
      </div>
    ) : null
  );

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column' }}>
      <div className="sec-hd">
        <div className="sec-t">🤖 AI Study Assistant</div>
        <span style={{ fontSize:'.75rem', color:'var(--text3)', fontWeight:600 }}>Powered by Gemini AI</span>
      </div>

      {/* Mode tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
        {[['chat','💬 Chat'],['homework','📝 Homework Helper'],['flashcards','🃏 Flashcards'],['writing','✍️ Writing'],['insights','📊 Insights']]
          .map(([mode, label]) => (
            <button key={mode} className={`btn btn-sm ${aiMode === mode ? 'btn-p' : 'btn-g'}`}
              onClick={() => setAiMode(mode)}>{label}</button>
          ))}
      </div>

      {/* ── CHAT ── */}
      {aiMode === 'chat' && (
        <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
          <div className="chat-container" style={{ flex:1, background:'var(--card)', border:'1.5px solid var(--border)',
            borderRadius:16, padding:20, marginBottom:16, overflow:'auto', display:'flex', flexDirection:'column' }}>
            {messages.map((msg, i) => <ChatMessage key={i} msg={msg} isUser={msg.role === 'user'} />)}
            {loading && <ThinkingBubble />}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <input type="text" value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleChatSend()}
              placeholder="Ask me anything about studying, learning strategies, or academics..."
              style={{ flex:1, padding:'12px 16px', border:'1.5px solid var(--border)', borderRadius:12,
                background:'var(--card)', color:'var(--text)', fontSize:'.85rem', outline:'none',
                fontFamily:"'Plus Jakarta Sans', sans-serif" }} />
            <button onClick={handleChatSend} disabled={!input.trim() || loading}
              style={{ padding:'12px 20px', border:'none', borderRadius:12,
                background: !input.trim() || loading ? 'var(--border)' : 'var(--accent)',
                color:'#fff', fontWeight:600, cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
                fontFamily:"'Plus Jakarta Sans', sans-serif" }}>Send</button>
          </div>
        </div>
      )}

      {/* ── HOMEWORK HELPER ── */}
      {aiMode === 'homework' && (
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:16, overflow:'auto' }}>

          {/* ── Step 1: Upload question ── */}
          {homeworkStep === 'upload' && (
            <div style={{ background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:16, padding:24, textAlign:'center' }}>
              <div style={{ fontSize:'2.5rem', marginBottom:12 }}>📸</div>
              <div style={{ fontWeight:700, fontSize:'1.1rem', marginBottom:8, color:'var(--text)' }}>Upload Your Homework</div>
              <div style={{ fontSize:'.85rem', color:'var(--text3)', marginBottom:20, lineHeight:1.6 }}>
                Take a photo of your homework or worksheet and I'll explain exactly how to do it — step by step.
              </div>
              <UploadButtons
                slot="question"
                onFile={handleQuestionFileUpload}
                onCamera={handleQuestionFileUpload}
                onPhone={() => handlePhoneUpload('question')}
              />
              <QRModal />
            </div>
          )}

          {/* ── Step 1b: Analyzing ── */}
          {homeworkStep === 'analyzing' && (
            <div style={{ background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:16, padding:24, textAlign:'center' }}>
              {uploadedImage && (
                <img src={uploadedImage} alt="Your homework"
                  style={{ width:'100%', maxWidth:400, borderRadius:8, border:'1px solid var(--border)', marginBottom:16 }} />
              )}
              <div style={{ fontSize:'1.5rem', marginBottom:8 }}>🔍</div>
              <div style={{ fontWeight:600, color:'var(--text)', marginBottom:4 }}>Analyzing your homework...</div>
              <div style={{ fontSize:'.8rem', color:'var(--text3)' }}>Gemini is reading your image and preparing an explanation.</div>
            </div>
          )}

          {/* ── Step 2: Show explanation ── */}
          {(homeworkStep === 'explanation' || homeworkStep === 'check' || homeworkStep === 'checking' || homeworkStep === 'done') && (
            <>
              {/* Homework image + re-upload */}
              <div style={{ background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:16, padding:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <div style={{ fontWeight:600, color:'var(--text)', fontSize:'.9rem' }}>📄 Your Homework</div>
                  <button className="btn btn-g btn-sm" onClick={resetHomework}>↩ Start Over</button>
                </div>
                {uploadedImage && (
                  <img src={uploadedImage} alt="Your homework"
                    style={{ width:'100%', maxWidth:500, borderRadius:8, border:'1px solid var(--border)' }} />
                )}
              </div>

              {/* AI explanation card */}
              <div style={{ background:'var(--card)', border:'2px solid #6366f1', borderRadius:16, padding:20 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:'#6366f1', display:'flex',
                    alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'1rem', flexShrink:0 }}>🤖</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, color:'var(--text)', fontSize:'.95rem' }}>How To Do This Homework</div>
                    <div style={{ fontSize:'.75rem', color:'var(--text3)' }}>
                      {homeworkExplanation ? 'Follow these steps to complete your assignment' : 'Analyzing your homework...'}
                    </div>
                  </div>
                  {!homeworkExplanation && (
                    <div style={{ width:16, height:16, border:'2px solid #6366f1', borderTopColor:'transparent',
                      borderRadius:'50%', animation:'spin 0.8s linear infinite', flexShrink:0 }} />
                  )}
                </div>
                <div className="hw-explanation-scroll"
                  style={{ fontSize:'.85rem', lineHeight:1.7, color:'var(--text)', fontFamily:"'Plus Jakarta Sans', sans-serif",
                    maxHeight:500, overflowY:'auto' }}>
                  <div dangerouslySetInnerHTML={{ __html: renderMarkdown(homeworkExplanation) }} />
                  {!homeworkExplanation && (
                    <div style={{ color:'var(--text3)', fontStyle:'italic' }}>Reading your homework image...</div>
                  )}
                </div>
              </div>

              {/* ── Check Your Answer section ── */}
              {homeworkStep === 'explanation' && (
                <div style={{ background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:16, padding:20 }}>
                  <div style={{ fontWeight:700, fontSize:'.95rem', color:'var(--text)', marginBottom:6 }}>✅ Check Your Answer</div>
                  <div style={{ fontSize:'.85rem', color:'var(--text3)', marginBottom:16, lineHeight:1.5 }}>
                    Done with your homework? Upload a photo of your completed work and I'll tell you if it's correct.
                  </div>
                  <UploadButtons
                    slot="answer"
                    onFile={handleAnswerFileUpload}
                    onCamera={handleAnswerFileUpload}
                    onPhone={() => handlePhoneUpload('answer')}
                  />
                  <QRModal />
                </div>
              )}

              {/* Checking answer spinner */}
              {homeworkStep === 'checking' && (
                <div style={{ background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:16, padding:24, textAlign:'center' }}>
                  {answerImage && (
                    <img src={answerImage} alt="Your answer"
                      style={{ width:'100%', maxWidth:400, borderRadius:8, border:'1px solid var(--border)', marginBottom:16 }} />
                  )}
                  <div style={{ fontSize:'1.5rem', marginBottom:8 }}>🔎</div>
                  <div style={{ fontWeight:600, color:'var(--text)', marginBottom:4 }}>Reviewing your work...</div>
                  <div style={{ fontSize:'.8rem', color:'var(--text3)' }}>Checking your answers against what's expected.</div>
                </div>
              )}

              {/* Answer feedback */}
              {homeworkStep === 'done' && answerFeedback && (
                <>
                  {/* Student's answer image */}
                  <div style={{ background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:16, padding:16 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                      <div style={{ fontWeight:600, color:'var(--text)', fontSize:'.9rem' }}>📝 Your Answer</div>
                      <div style={{ display:'flex', gap:8 }}>
                        <input type="file" accept="image/*" onChange={handleAnswerFileUpload} style={{ display:'none' }} id="re-answer-file" />
                        <label htmlFor="re-answer-file" className="btn btn-g btn-sm">📁 Re-upload</label>
                        <input type="file" accept="image/*" capture="environment" onChange={handleAnswerFileUpload} style={{ display:'none' }} id="re-answer-cam" />
                        <button className="btn btn-g btn-sm" onClick={() => document.getElementById('re-answer-cam').click()}>📷 Retake</button>
                      </div>
                    </div>
                    {answerImage && (
                      <img src={answerImage} alt="Your answer"
                        style={{ width:'100%', maxWidth:500, borderRadius:8, border:'1px solid var(--border)' }} />
                    )}
                  </div>

                  {/* Feedback card */}
                  <div style={{ background:'var(--card)', border:'2px solid #16a34a', borderRadius:16, padding:20 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                      <div style={{ width:36, height:36, borderRadius:'50%', background:'#16a34a', display:'flex',
                        alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'1rem', flexShrink:0 }}>✅</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, color:'var(--text)', fontSize:'.95rem' }}>Answer Feedback</div>
                        <div style={{ fontSize:'.75rem', color:'var(--text3)' }}>
                          {answerFeedback ? 'Here\'s how you did' : 'Reviewing your work...'}
                        </div>
                      </div>
                      {!answerFeedback && (
                        <div style={{ width:16, height:16, border:'2px solid #16a34a', borderTopColor:'transparent',
                          borderRadius:'50%', animation:'spin 0.8s linear infinite', flexShrink:0 }} />
                      )}
                    </div>
                    <div className="hw-feedback-scroll"
                      style={{ fontSize:'.85rem', lineHeight:1.7, color:'var(--text)', fontFamily:"'Plus Jakarta Sans', sans-serif",
                        maxHeight:500, overflowY:'auto' }}>
                      <div dangerouslySetInnerHTML={{ __html: renderMarkdown(answerFeedback) }} />
                      {!answerFeedback && (
                        <div style={{ color:'var(--text3)', fontStyle:'italic' }}>Checking your answers...</div>
                      )}
                    </div>
                  </div>

                  {/* Follow-up chat */}
                  <div style={{ background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:16, padding:20 }}>
                    <div style={{ fontWeight:700, fontSize:'.95rem', color:'var(--text)', marginBottom:12 }}>💬 Follow-up Questions</div>
                    <div className="hw-followup-chat" style={{ maxHeight:300, overflow:'auto', marginBottom:12 }}>
                      {homeworkMessages.map((msg, i) => <ChatMessage key={i} msg={msg} isUser={msg.role === 'user'} />)}
                      {homeworkLoading && <ThinkingBubble />}
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      <input type="text" value={homeworkInput} onChange={e => setHomeworkInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleHomeworkSend()}
                        placeholder="Ask a follow-up question..."
                        style={{ flex:1, padding:'10px 14px', border:'1.5px solid var(--border)', borderRadius:10,
                          background:'var(--bg2)', color:'var(--text)', fontSize:'.85rem', outline:'none',
                          fontFamily:"'Plus Jakarta Sans', sans-serif" }} />
                      <button onClick={handleHomeworkSend} disabled={!homeworkInput.trim() || homeworkLoading}
                        style={{ padding:'10px 18px', border:'none', borderRadius:10,
                          background: !homeworkInput.trim() || homeworkLoading ? 'var(--border)' : 'var(--accent)',
                          color:'#fff', fontWeight:600, cursor: !homeworkInput.trim() || homeworkLoading ? 'not-allowed' : 'pointer',
                          fontFamily:"'Plus Jakarta Sans', sans-serif" }}>Send</button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ── FLASHCARDS ── */}
      {aiMode === 'flashcards' && (
        <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
          <div style={{ background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:16, padding:20, marginBottom:16 }}>
            <div style={{ fontWeight:600, marginBottom:12, color:'var(--text)' }}>🃏 Create Flashcards</div>
            <div style={{ display:'flex', gap:8, marginBottom:12 }}>
              <input type="text" value={flashcardTopic} onChange={e => setFlashcardTopic(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && generateFlashcards()}
                placeholder="Enter topic (e.g., 'Biology Chapter 5', 'Spanish Vocabulary')..."
                style={{ flex:1, padding:'10px 12px', border:'1.5px solid var(--border)', borderRadius:8,
                  background:'var(--bg2)', color:'var(--text)', fontSize:'.85rem', outline:'none',
                  fontFamily:"'Plus Jakarta Sans', sans-serif" }} />
              <button className="btn btn-p" onClick={generateFlashcards} disabled={!flashcardTopic.trim() || flashcardLoading}>
                {flashcardLoading ? 'Creating...' : 'Generate'}
              </button>
            </div>
            <div style={{ fontSize:'.8rem', color:'var(--text3)' }}>💡 Tip: Be specific for better flashcards</div>
          </div>

          {flashcards.length > 0 && (
            <div style={{ flex:1 }}>
              <div style={{ fontSize:'.9rem', fontWeight:600, color:'var(--text)', marginBottom:16 }}>
                📚 Your Flashcards ({flashcards.length}) — Click to flip!
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:16, marginBottom:16 }}>
                {flashcards.map((card, index) => {
                  const isFlipped = flippedCards.has(index);
                  return (
                    <div key={index} onClick={() => toggleFlashcard(index)}
                      style={{ background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:12,
                        minHeight:200, maxHeight:250, cursor:'pointer', position:'relative',
                        transformStyle:'preserve-3d', transition:'transform 0.6s',
                        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)', overflow:'hidden' }}>
                      {/* Front */}
                      <div style={{ position:'absolute', width:'100%', height:'100%', backfaceVisibility:'hidden',
                        display:'flex', flexDirection:'column', justifyContent:'center', padding:20,
                        borderRadius:12, boxSizing:'border-box' }}>
                        <div style={{ fontSize:'.8rem', color:'var(--accent)', fontWeight:600, marginBottom:12, textAlign:'center' }}>QUESTION</div>
                        <div style={{ fontSize:'.85rem', color:'var(--text)', lineHeight:1.4, textAlign:'center',
                          flex:1, display:'flex', alignItems:'center', justifyContent:'center',
                          wordWrap:'break-word', overflowWrap:'break-word', hyphens:'auto', padding:'0 4px' }}>
                          {card.question}
                        </div>
                        <div style={{ fontSize:'.75rem', color:'var(--text4)', textAlign:'center', marginTop:12 }}>Click to reveal answer</div>
                      </div>
                      {/* Back */}
                      <div style={{ position:'absolute', width:'100%', height:'100%', backfaceVisibility:'hidden',
                        transform:'rotateY(180deg)', display:'flex', flexDirection:'column', justifyContent:'center',
                        padding:20, borderRadius:12, background:'var(--card)', boxSizing:'border-box' }}>
                        <div style={{ fontSize:'.8rem', color:'#16a34a', fontWeight:600, marginBottom:12, textAlign:'center' }}>ANSWER</div>
                        <div style={{ fontSize:'.85rem', color:'var(--text)', lineHeight:1.4, textAlign:'center',
                          flex:1, display:'flex', alignItems:'center', justifyContent:'center',
                          wordWrap:'break-word', overflowWrap:'break-word', hyphens:'auto', padding:'0 4px', overflowY:'auto' }}>
                          {card.answer}
                        </div>
                        <div style={{ fontSize:'.75rem', color:'var(--text4)', textAlign:'center', marginTop:12 }}>Click to see question</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ textAlign:'center' }}>
                <button className="btn btn-g" onClick={() => { setFlashcards([]); setFlippedCards(new Set()); }} style={{ marginRight:8 }}>Clear Cards</button>
                <button className="btn btn-g" onClick={() => setFlippedCards(new Set())}>Reset All</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── WRITING ── */}
      {aiMode === 'writing' && (
        <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
          <div style={{ background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:16, padding:20, marginBottom:16 }}>
            <div style={{ fontWeight:600, marginBottom:12, color:'var(--text)' }}>✍️ Writing Feedback</div>
            <textarea value={writingText} onChange={e => setWritingText(e.target.value)}
              placeholder="Paste your writing here for detailed feedback on grammar, structure, and content..."
              style={{ width:'100%', minHeight:150, padding:12, border:'1.5px solid var(--border)', borderRadius:8,
                background:'var(--bg2)', color:'var(--text)', fontSize:'.85rem', outline:'none', resize:'vertical',
                fontFamily:"'Plus Jakarta Sans', sans-serif", marginBottom:12 }} />
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontSize:'.8rem', color:'var(--text3)' }}>{writingText.length} characters</div>
              <button className="btn btn-p" onClick={analyzeWriting} disabled={!writingText.trim() || writingLoading}>
                {writingLoading ? 'Analyzing...' : 'Get Feedback'}
              </button>
            </div>
          </div>
          {writingFeedback && (
            <div style={{ flex:1, background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:16, padding:20, overflow:'auto' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background:'#6366f1', display:'flex',
                  alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'.8rem', fontWeight:700 }}>🤖</div>
                <div style={{ fontWeight:600, color:'var(--text)' }}>Writing Feedback</div>
              </div>
              <div style={{ fontSize:'.85rem', lineHeight:1.6, color:'var(--text)', fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(writingFeedback) }} />
              </div>
              <div style={{ marginTop:16, textAlign:'center' }}>
                <button className="btn btn-g btn-sm" onClick={() => setWritingFeedback('')}>Clear Feedback</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── INSIGHTS ── */}
      {aiMode === 'insights' && (
        <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
          <div style={{ background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:16, padding:20, marginBottom:16 }}>
            <div style={{ fontWeight:600, marginBottom:12, color:'var(--text)' }}>📊 Study Insights</div>
            <div style={{ fontSize:'.85rem', color:'var(--text2)', marginBottom:16, lineHeight:1.5 }}>
              Get personalized insights based on your {assignments.length} assignments and {classes.length} classes.
            </div>
            <button className="btn btn-p" onClick={generateInsights} disabled={insightsLoading || assignments.length === 0}>
              {insightsLoading ? 'Analyzing...' : 'Generate Insights'}
            </button>
            {assignments.length === 0 && (
              <div style={{ fontSize:'.8rem', color:'var(--text4)', marginTop:8 }}>Add some assignments first to get personalized insights!</div>
            )}
          </div>
          {insights && (
            <div style={{ flex:1, background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:16, padding:20, overflow:'auto' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background:'#6366f1', display:'flex',
                  alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'.8rem', fontWeight:700 }}>🤖</div>
                <div style={{ fontWeight:600, color:'var(--text)' }}>Your Study Insights</div>
              </div>
              <div style={{ fontSize:'.85rem', lineHeight:1.6, color:'var(--text)', fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(insights) }} />
              </div>
              <div style={{ marginTop:16, textAlign:'center' }}>
                <button className="btn btn-g btn-sm" onClick={() => setInsights('')}>Clear Insights</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AITab;