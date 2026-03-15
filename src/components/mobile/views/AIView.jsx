import React, { useState } from 'react';
import { callGemini, callGeminiStream, getGeminiKey } from '../../../utils/gemini';

// ── Markdown + KaTeX renderer ─────────────────────────────────────────────────
const renderMarkdown = (text) => {
  if (!text) return '';
  const codeBlocks = [];
  let p = text.replace(/```[\s\S]*?```/g, (m) => { codeBlocks.push(m); return `%%CB${codeBlocks.length - 1}%%`; });
  
  // Render math with KaTeX if available
  p = p.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    try { 
      if (window.katex) {
        return `<div style="text-align:center;margin:12px 0;overflow-x:auto;">${window.katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>`;
      }
      return `<div style="text-align:center;margin:12px 0;font-family:monospace;background:var(--bg3);padding:8px;border-radius:6px;">$$${math}$$</div>`;
    }
    catch { return `<code>$$${math}$$</code>`; }
  });
  p = p.replace(/\$([^\n$]+?)\$/g, (_, math) => {
    try { 
      if (window.katex) {
        return window.katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
      }
      return `<code style="font-family:monospace;background:var(--bg3);padding:2px 4px;border-radius:4px;">$${math}$</code>`;
    }
    catch { return `<code>$${math}$</code>`; }
  });
  
  // Markdown formatting
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
  
  // Wrap lists
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

/**
 * AI View - Mobile AI assistant with multiple modes
 * Modes: Chat, Homework Helper, Flashcards, Writing, Insights
 */
function AIView({ 
  assignments = [], 
  classes = []
}) {
  const [mode, setMode] = useState('chat');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Homework state
  const [hwStep, setHwStep] = useState('upload');
  const [hwImage, setHwImage] = useState(null);
  const [hwExplanation, setHwExplanation] = useState('');
  const [hwAnswerImage, setHwAnswerImage] = useState(null);
  const [hwFeedback, setHwFeedback] = useState('');

  // Flashcards state
  const [flashcardTopic, setFlashcardTopic] = useState('');
  const [flashcards, setFlashcards] = useState([]);
  const [flippedCards, setFlippedCards] = useState(new Set());
  const [flashcardLoading, setFlashcardLoading] = useState(false);

  // Writing state
  const [writingText, setWritingText] = useState('');
  const [writingFeedback, setWritingFeedback] = useState('');
  const [writingLoading, setWritingLoading] = useState(false);

  // Questions state
  const [questionsImage, setQuestionsImage] = useState(null);
  const [questionsText, setQuestionsText] = useState('');
  const [questionsData, setQuestionsData] = useState(null);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [checkedAnswers, setCheckedAnswers] = useState({});

  // Note Analyzer state
  const [noteFiles, setNoteFiles] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [showNoteTextInput, setShowNoteTextInput] = useState(false);
  const [noteAnalysis, setNoteAnalysis] = useState('');
  const [noteAnalyzing, setNoteAnalyzing] = useState(false);

  // Insights state
  const [insights, setInsights] = useState('');
  const [insightsLoading, setInsightsLoading] = useState(false);

  const modes = [
    { id: 'chat', label: 'Chat' },
    { id: 'homework', label: 'Homework' },
    { id: 'flashcards', label: 'Cards' },
    { id: 'writing', label: 'Writing' },
    { id: 'questions', label: 'Questions' },
    { id: 'notes', label: 'Notes' },
    { id: 'insights', label: 'Insights' }
  ];

  // ── Chat ─────────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
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
      await callGeminiStream(userMsg, context,
        (streamedText) => {
          setMessages(prev => {
            const msgs = [...prev];
            msgs[aiMessageIndex] = { role: 'ai', text: streamedText };
            return msgs;
          });
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

  // ── Homework Helper ──────────────────────────────────────────────────────────
  const callGeminiWithImageStream = async (prompt, base64Image, onChunk) => {
    const b64 = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const mimeMatch = base64Image.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${getGeminiKey()}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: b64 } }] }],
          generationConfig: { maxOutputTokens: 8192 }
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
          const parsed = JSON.parse(data);
          const piece = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (piece) { accumulated += piece; onChunk(accumulated); }
        } catch (_) {}
      }
    }
    return accumulated;
  };

  const handleHwImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const imageData = ev.target.result;
      setHwImage(imageData);
      setHwStep('analyzing');
      setHwExplanation('');

      try {
        await callGeminiWithImageStream(
          `You are a helpful homework tutor. Look at this homework image carefully.

1. Identify exactly what type of homework this is (subject, assignment type).
2. Explain clearly and step-by-step HOW to do this homework / solve these problems.
3. Give helpful tips or strategies the student should use.
4. Do NOT give the direct answers — teach the student how to approach it.

Use clear markdown formatting with headers, numbered steps, and math notation where relevant.`,
          imageData,
          (streamedText) => {
            setHwExplanation(streamedText);
            setHwStep('explanation');
          }
        );
      } catch (err) {
        setHwExplanation('Sorry, I had trouble analyzing your homework image. Please try again.');
        setHwStep('explanation');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAnswerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const imageData = ev.target.result;
      setHwAnswerImage(imageData);
      setHwStep('checking');
      setHwFeedback('');

      try {
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
            setHwFeedback(streamedText);
            setHwStep('done');
          }
        );
      } catch (err) {
        setHwFeedback('Sorry, I had trouble reviewing your answer. Please try again.');
        setHwStep('done');
      }
    };
    reader.readAsDataURL(file);
  };

  const resetHomework = () => {
    setHwStep('upload');
    setHwImage(null);
    setHwExplanation('');
    setHwAnswerImage(null);
    setHwFeedback('');
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
      } catch (_) {
        // Fallback parsing
        const lines = response.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        let currentCard = {};
        for (const line of lines) {
          if (line.match(/^(\d+\.|\*|\-|Q:|Question:)/i) || line.includes('?')) {
            if (currentCard.question && currentCard.answer) { cards.push(currentCard); currentCard = {}; }
            currentCard.question = line.replace(/^(\d+\.|\*|\-|Q:|Question:)\s*/i, '').trim();
          } else if (line.match(/^(A:|Answer:)/i) || (currentCard.question && !currentCard.answer && line.length > 10)) {
            currentCard.answer = line.replace(/^(A:|Answer:)\s*/i, '').trim();
          }
        }
        if (currentCard.question && currentCard.answer) cards.push(currentCard);
      }

      if (cards.length === 0) {
        cards = [
          {question: `What is ${flashcardTopic}?`, answer: `${flashcardTopic} is an important topic that requires study and understanding.`},
          {question: `Why is ${flashcardTopic} important?`, answer: `Understanding ${flashcardTopic} helps build foundational knowledge in this subject area.`},
          {question: `What are the main concepts in ${flashcardTopic}?`, answer: `The main concepts include key definitions, principles, and applications related to ${flashcardTopic}.`}
        ];
      }
      setFlashcards(cards.slice(0, 6));
    } catch (err) {
      setFlashcards([{ question: `Study topic: ${flashcardTopic}`, answer: "Sorry, couldn't generate flashcards right now. Please try again." }]);
    }
    setFlashcardLoading(false);
    setFlashcardTopic('');
  };

  const toggleCard = (index) => {
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

  // ── Questions ────────────────────────────────────────────────────────────────
  const generateQuestions = async () => {
    if ((!questionsText.trim() && !questionsImage) || questionsLoading) return;
    setQuestionsLoading(true);
    setQuestionsData(null);
    setUserAnswers({});
    setCheckedAnswers({});

    try {
      let content = questionsText;
      
      // If image, extract text first
      if (questionsImage) {
        const imagePrompt = "Extract all text content from this image.";
        const b64 = questionsImage.replace(/^data:image\/\w+;base64,/, '');
        const mimeMatch = questionsImage.match(/^data:(image\/\w+);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${getGeminiKey()}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: imagePrompt }, { inline_data: { mime_type: mimeType, data: b64 } }] }]
            })
          }
        );
        const data = await res.json();
        const extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        content = extractedText + '\n\n' + content;
      }

      const questions = await generateQuestionsFromContent(content, callGemini);
      setQuestionsData(questions.length > 0 ? questions : [
        { text: "What are the main concepts covered?", type: "short_answer", answer: "Review the key topics and themes." }
      ]);
    } catch (err) {
      setQuestionsData([{ text: "Error generating questions. Please try again.", type: "short_answer", answer: "" }]);
    }
    setQuestionsLoading(false);
  };

  // ── Note Analyzer ────────────────────────────────────────────────────────────
  const analyzeNotes = async () => {
    if ((noteFiles.length === 0 && !noteText.trim()) || noteAnalyzing) return;
    setNoteAnalyzing(true);
    setNoteAnalysis('');

    try {
      let content = noteText;
      
      // If files, extract text from images
      if (noteFiles.length > 0) {
        for (const file of noteFiles) {
          if (file.data.startsWith('data:image')) {
            const imagePrompt = "Extract all text content from this image.";
            const b64 = file.data.replace(/^data:image\/\w+;base64,/, '');
            const mimeMatch = file.data.match(/^data:(image\/\w+);base64,/);
            const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
            
            const res = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${getGeminiKey()}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: imagePrompt }, { inline_data: { mime_type: mimeType, data: b64 } }] }]
                })
              }
            );
            const data = await res.json();
            const extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            content += '\n\n' + extractedText;
          }
        }
      }

      const analysisPrompt = `Analyze these study notes comprehensively. Provide:

1. **Key Concepts** - Main ideas and topics covered
2. **Important Details** - Critical facts, definitions, formulas
3. **Connections** - How concepts relate to each other
4. **Study Recommendations** - What to focus on, potential gaps
5. **Study Plan** - Suggested approach to master this material

Notes:
${content}

Use clear markdown formatting with headers, bullet points, and emphasis.`;

      await callGeminiStream(analysisPrompt, '',
        (streamedText) => setNoteAnalysis(streamedText)
      );
    } catch (err) {
      setNoteAnalysis("Sorry, I couldn't analyze your notes right now. Please try again.");
    }
    setNoteAnalyzing(false);
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

  return (
    <div className="mobile-view ai-view-mobile">
      <h1 className="ai-title-mobile">AI Assistant</h1>

      {/* Mode selector */}
      <div className="ai-mode-selector">
        {modes.map(m => (
          <button
            key={m.id}
            className={`ai-mode-btn ${mode === m.id ? 'active' : ''}`}
            onClick={() => setMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Chat Mode */}
      {mode === 'chat' && (
        <div className="ai-chat-container">
          {messages.length === 0 ? (
            <div className="ai-empty-state">
              <div className="ai-empty-icon">🤖</div>
              <div className="ai-empty-title">Ask me anything!</div>
              <div className="ai-empty-text">
                I can help with studying, homework, or answer questions.
              </div>
            </div>
          ) : (
            <div className="ai-messages-mobile">
              {messages.map((msg, idx) => (
                <div key={idx} className={`ai-message-mobile ${msg.role}`}>
                  {msg.role === 'ai' && <div className="ai-avatar">🤖</div>}
                  <div className="ai-message-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }} />
                </div>
              ))}
              {loading && (
                <div className="ai-message-mobile ai">
                  <div className="ai-avatar">🤖</div>
                  <div className="ai-message-content">
                    <div className="ai-typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="ai-input-container-mobile">
            <input
              className="ai-input-mobile"
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button className="ai-send-btn-mobile" onClick={handleSend} disabled={!input.trim() || loading}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Homework Mode */}
      {mode === 'homework' && (
        <div className="ai-homework-container">
          {hwStep === 'upload' && (
            <div className="hw-upload-card">
              <div className="hw-icon">📸</div>
              <div className="hw-title">Upload Your Homework</div>
              <div className="hw-desc">Take a photo and I'll explain how to solve it</div>
              <input type="file" accept="image/*" onChange={handleHwImageUpload} style={{ display: 'none' }} id="hw-upload" />
              <label htmlFor="hw-upload" className="btn-primary">Choose Photo</label>
            </div>
          )}

          {hwStep === 'analyzing' && (
            <div className="hw-analyzing-card">
              {hwImage && <img src={hwImage} alt="Homework" className="hw-image" />}
              <div className="hw-spinner"></div>
              <div className="hw-status">Analyzing your homework...</div>
            </div>
          )}

          {(hwStep === 'explanation' || hwStep === 'checking' || hwStep === 'done') && (
            <>
              <div className="hw-image-card">
                <div className="hw-card-header">
                  <span>Your Homework</span>
                  <button className="btn-reset" onClick={resetHomework}>↩ Reset</button>
                </div>
                {hwImage && <img src={hwImage} alt="Homework" className="hw-image" />}
              </div>

              <div className="hw-explanation-card">
                <div className="hw-card-title">How To Solve This</div>
                <div className="hw-explanation-text" dangerouslySetInnerHTML={{ __html: renderMarkdown(hwExplanation || 'Analyzing...') }} />
              </div>

              {hwStep === 'explanation' && (
                <div className="hw-answer-upload-card">
                  <div className="hw-card-title">Check Your Answer</div>
                  <div className="hw-desc">Upload your completed work for feedback</div>
                  <input type="file" accept="image/*" onChange={handleAnswerUpload} style={{ display: 'none' }} id="answer-upload" />
                  <label htmlFor="answer-upload" className="btn-primary">Upload Answer</label>
                </div>
              )}

              {hwStep === 'checking' && (
                <div className="hw-checking-card">
                  <div className="hw-spinner"></div>
                  <div className="hw-status">Checking your work...</div>
                </div>
              )}

              {hwStep === 'done' && hwAnswerImage && (
                <>
                  <div className="hw-image-card">
                    <div className="hw-card-header">
                      <span>Your Answer</span>
                    </div>
                    <img src={hwAnswerImage} alt="Answer" className="hw-image" />
                  </div>

                  <div className="hw-feedback-card">
                    <div className="hw-card-title">✅ Feedback</div>
                    <div className="hw-feedback-text" dangerouslySetInnerHTML={{ __html: renderMarkdown(hwFeedback || 'Analyzing...') }} />
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Flashcards Mode */}
      {mode === 'flashcards' && (
        <div className="ai-flashcards-container">
          <div className="flashcard-input-card">
            <div className="flashcard-title">Create Flashcards</div>
            <input
              className="flashcard-input"
              placeholder="Enter topic (e.g., 'Biology Chapter 5')..."
              value={flashcardTopic}
              onChange={(e) => setFlashcardTopic(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && generateFlashcards()}
            />
            <button className="btn-primary" onClick={generateFlashcards} disabled={!flashcardTopic.trim() || flashcardLoading}>
              {flashcardLoading ? 'Generating...' : 'Generate Cards'}
            </button>
          </div>

          {flashcards.length > 0 && (
            <div className="flashcards-grid">
              {flashcards.map((card, idx) => {
                const isFlipped = flippedCards.has(idx);
                return (
                  <div key={idx} className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={() => toggleCard(idx)}>
                    <div className="flashcard-front">
                      <div className="flashcard-label">QUESTION</div>
                      <div className="flashcard-text">{card.question}</div>
                      <div className="flashcard-hint">Tap to reveal</div>
                    </div>
                    <div className="flashcard-back">
                      <div className="flashcard-label">ANSWER</div>
                      <div className="flashcard-text">{card.answer}</div>
                      <div className="flashcard-hint">Tap to flip</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Writing Mode */}
      {mode === 'writing' && (
        <div className="ai-writing-container">
          <div className="writing-input-card">
            <div className="writing-title">Writing Feedback</div>
            <textarea
              className="writing-textarea"
              placeholder="Paste your writing here for feedback..."
              value={writingText}
              onChange={(e) => setWritingText(e.target.value)}
              rows={8}
            />
            <button 
              className="btn-primary" 
              onClick={analyzeWriting}
              disabled={!writingText.trim() || writingLoading}
            >
              {writingLoading ? 'Analyzing...' : 'Analyze Writing'}
            </button>
          </div>

          {writingFeedback && (
            <div className="writing-feedback-card">
              <div className="writing-feedback-title">📝 Feedback</div>
              <div className="writing-feedback-text" dangerouslySetInnerHTML={{ __html: renderMarkdown(writingFeedback) }} />
            </div>
          )}
        </div>
      )}

      {/* Insights Mode */}
      {mode === 'insights' && (
        <div className="ai-insights-container">
          <div className="insights-card">
            <div className="insights-icon">📊</div>
            <div className="insights-title">Academic Insights</div>
            <div className="insights-desc">
              Get AI-powered analysis of your study patterns and performance
            </div>
            <button 
              className="btn-primary" 
              onClick={generateInsights}
              disabled={insightsLoading}
            >
              {insightsLoading ? 'Generating...' : 'Generate Insights'}
            </button>
          </div>

          {insights && (
            <div className="insights-result-card">
              <div className="insights-result-title">Your Insights</div>
              <div className="insights-result-text" dangerouslySetInnerHTML={{ __html: renderMarkdown(insights) }} />
            </div>
          )}
        </div>
      )}

      {/* Questions Mode */}
      {mode === 'questions' && (
        <div className="ai-questions-container">
          <div className="questions-input-card">
            <div className="questions-title">Generate Practice Questions</div>
            <div className="questions-desc">Enter text or upload content to generate practice questions</div>
            
            <textarea
              className="questions-textarea"
              placeholder="Paste your notes or study material here..."
              value={questionsText}
              onChange={(e) => setQuestionsText(e.target.value)}
              rows={6}
            />

            <div className="questions-upload-btns">
              <input 
                type="file" 
                accept="image/*" 
                capture="environment"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => setQuestionsImage(ev.target.result);
                    reader.readAsDataURL(file);
                  }
                }}
                style={{ display: 'none' }} 
                id="questions-camera" 
              />
              <label htmlFor="questions-camera" className="btn-secondary">
                📷 Take Picture
              </label>
            </div>

            {questionsImage && (
              <div className="questions-image-preview">
                <img src={questionsImage} alt="Uploaded" />
                <button className="questions-remove-image" onClick={() => setQuestionsImage(null)}>×</button>
              </div>
            )}

            <button 
              className="btn-primary" 
              onClick={generateQuestions}
              disabled={(!questionsText.trim() && !questionsImage) || questionsLoading}
            >
              {questionsLoading ? 'Generating...' : 'Generate Questions'}
            </button>
          </div>

          {questionsData && questionsData.length > 0 && (
            <div className="questions-list-card">
              <div className="questions-list-title">Practice Questions</div>
              {questionsData.map((q, idx) => (
                <div key={idx} className="question-item">
                  <div className="question-text" dangerouslySetInnerHTML={{ __html: renderMarkdown(`${idx + 1}. ${q.text}`) }} />

                  {/* Multiple Choice */}
                  {q.options && q.options.length > 0 && (
                    <div className="question-options">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = userAnswers[idx] === opt.letter;
                        const isCorrect = opt.letter === q.correct;
                        const showResult = checkedAnswers[idx];

                        return (
                          <div
                            key={optIdx}
                            className={`question-option ${isSelected ? 'selected' : ''} ${showResult && isCorrect ? 'correct' : ''} ${showResult && isSelected && !isCorrect ? 'incorrect' : ''}`}
                            onClick={() => !showResult && setUserAnswers({...userAnswers, [idx]: opt.letter})}
                          >
                            <div className="option-letter">{opt.letter}</div>
                            <div className="option-text" dangerouslySetInnerHTML={{ __html: renderMarkdown(opt.text) }} />
                            {showResult && isCorrect && <span className="option-icon">✓</span>}
                            {showResult && isSelected && !isCorrect && <span className="option-icon">✗</span>}
                          </div>
                        );
                      })}
                      {!checkedAnswers[idx] && userAnswers[idx] && (
                        <button 
                          className="btn-check-answer"
                          onClick={() => setCheckedAnswers({...checkedAnswers, [idx]: true})}
                        >
                          Check Answer
                        </button>
                      )}
                      {checkedAnswers[idx] && q.explanation && (
                        <div className="question-explanation" dangerouslySetInnerHTML={{ __html: renderMarkdown(`**💡 Explanation:** ${q.explanation}`) }} />
                      )}
                    </div>
                  )}

                  {/* Text Answer */}
                  {(!q.options || q.options.length === 0) && (
                    <div className="question-text-answer">
                      <textarea
                        className="answer-textarea"
                        placeholder="Type your answer here..."
                        value={userAnswers[idx] || ''}
                        onChange={(e) => setUserAnswers({...userAnswers, [idx]: e.target.value})}
                        rows={4}
                      />
                      {q.answer && (
                        <div className="model-answer">
                          <strong>Model Answer:</strong> {q.answer}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notes Analyzer Mode */}
      {mode === 'notes' && (
        <div className="ai-notes-container">
          <div className="notes-analyzer-card">
            <div className="notes-analyzer-title">Analyze Your Notes</div>
            <div className="notes-analyzer-desc">Upload files, enter text, or take a picture to analyze</div>

            {/* Text Input Toggle */}
            <button 
              className="btn-secondary"
              onClick={() => setShowNoteTextInput(!showNoteTextInput)}
              style={{ marginBottom: 12 }}
            >
              {showNoteTextInput ? '📁 Upload File Instead' : '✏️ Text Entry'}
            </button>

            {showNoteTextInput ? (
              <textarea
                className="notes-analyzer-textarea"
                placeholder="Paste or type your notes here..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={8}
              />
            ) : (
              <>
                <div className="notes-upload-btns">
                  <input 
                    type="file" 
                    accept="image/*,.pdf,.txt,.doc,.docx" 
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      files.forEach(file => {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setNoteFiles(prev => [...prev, { name: file.name, data: ev.target.result }]);
                        };
                        reader.readAsDataURL(file);
                      });
                    }}
                    style={{ display: 'none' }} 
                    id="notes-file" 
                  />
                  <label htmlFor="notes-file" className="btn-secondary">
                    📁 Choose Files
                  </label>

                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setNoteFiles(prev => [...prev, { name: file.name, data: ev.target.result }]);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    style={{ display: 'none' }} 
                    id="notes-camera" 
                  />
                  <label htmlFor="notes-camera" className="btn-secondary">
                    📷 Take Picture
                  </label>
                </div>

                {noteFiles.length > 0 && (
                  <div className="notes-files-list">
                    {noteFiles.map((file, idx) => (
                      <div key={idx} className="notes-file-item">
                        <span>{file.name}</span>
                        <button onClick={() => setNoteFiles(prev => prev.filter((_, i) => i !== idx))}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            <button 
              className="btn-primary" 
              onClick={analyzeNotes}
              disabled={(noteFiles.length === 0 && !noteText.trim()) || noteAnalyzing}
            >
              {noteAnalyzing ? 'Analyzing...' : 'Analyze Notes'}
            </button>
          </div>

          {noteAnalysis && (
            <div className="notes-analysis-card">
              <div className="notes-analysis-title">📚 Analysis</div>
              <div className="notes-analysis-text" dangerouslySetInnerHTML={{ __html: renderMarkdown(noteAnalysis) }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper function to generate questions
async function generateQuestionsFromContent(content, callGemini) {
  const prompt = `Generate 5 practice questions from this content. Include a mix of multiple choice (with 4 options A-D) and short answer questions.

Content:
${content}

Return ONLY a JSON array in this exact format:
[
  {
    "text": "Question text here?",
    "type": "multiple_choice",
    "options": [
      {"letter": "A", "text": "Option A"},
      {"letter": "B", "text": "Option B"},
      {"letter": "C", "text": "Option C"},
      {"letter": "D", "text": "Option D"}
    ],
    "correct": "A",
    "explanation": "Why A is correct"
  },
  {
    "text": "Short answer question?",
    "type": "short_answer",
    "answer": "Expected answer"
  }
]`;

  const response = await callGemini(prompt);
  try {
    const clean = response.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
    return JSON.parse(clean);
  } catch {
    return [];
  }
}

export default AIView;
