import React, { useState, useEffect } from 'react';
import { callGemini, callGeminiStream } from '../../utils/gemini';
import { FB_FS, FB_KEY } from '../../utils/firebase';

function AITab({ assignments, classes }) {
  const [aiMode, setAiMode] = useState('chat');
  
  // Chat mode state
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hi! I\'m your AI study assistant. Ask me anything about studying! 🎓' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Homework helper state
  const [homeworkMessages, setHomeworkMessages] = useState([]);
  const [homeworkInput, setHomeworkInput] = useState('');
  const [homeworkLoading, setHomeworkLoading] = useState(false);
  const [uploadId, setUploadId] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [checkingUploads, setCheckingUploads] = useState(false);
  const [hasUploadedPhoto, setHasUploadedPhoto] = useState(false);
  
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

  // Markdown renderer
  const renderMarkdown = (text) => {
    return text
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code style="background: var(--bg3); padding: 2px 4px; border-radius: 4px; font-family: monospace;">$1</code>')
      .replace(/###\s(.*?)$/gm, '<h3 style="font-size: 1.1rem; font-weight: 700; margin: 16px 0 8px 0; color: var(--text);">$1</h3>')
      .replace(/##\s(.*?)$/gm, '<h2 style="font-size: 1.2rem; font-weight: 700; margin: 20px 0 10px 0; color: var(--text);">$1</h2>')
      .replace(/^-\s(.*)$/gm, '<li style="margin: 4px 0;">$1</li>')
      .replace(/(<li.*<\/li>)/s, '<ul style="margin: 8px 0; padding-left: 20px;">$1</ul>')
      .replace(/^\d+\.\s(.*)$/gm, '<li style="margin: 4px 0;">$1</li>')
      .replace(/(<li.*<\/li>)/s, '<ol style="margin: 8px 0; padding-left: 20px;">$1</ol>');
  };
  // Chat functionality
  const handleChatSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    // Add empty AI message that will be updated with streaming
    const aiMessageIndex = messages.length + 1;
    setMessages(prev => [...prev, { role: 'ai', text: '' }]);

    try {
      const context = `You are a helpful AI study assistant. Help with general study questions, learning strategies, and academic advice.
      
Current student context:
- Has ${assignments.length} assignments
- Taking ${classes.length} classes: ${classes.map(c => c.name).join(', ')}

Provide helpful, encouraging responses about studying and academics. Use markdown formatting for better readability.`;
      
      const history = messages.slice(-6);
      
      await callGeminiStream(
        userMessage,
        context,
        (streamedText) => {
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[aiMessageIndex] = { role: 'ai', text: streamedText };
            return newMessages;
          });
          // Auto-scroll to bottom during streaming
          setTimeout(() => {
            const chatContainer = document.querySelector('.chat-container');
            if (chatContainer) {
              chatContainer.scrollTop = chatContainer.scrollHeight;
            }
          }, 50);
        },
        history
      );
    } catch (error) {
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[aiMessageIndex] = { role: 'ai', text: 'Sorry, I encountered an error. Please try again.' };
        return newMessages;
      });
    }
    
    setLoading(false);
  };

  // Homework helper functionality
  const handleHomeworkSend = async () => {
    if (!homeworkInput.trim() || homeworkLoading || !hasUploadedPhoto) return;
    
    const userMessage = homeworkInput.trim();
    setHomeworkInput('');
    setHomeworkMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setHomeworkLoading(true);

    // Add empty AI message that will be updated with streaming
    const aiMessageIndex = homeworkMessages.length + 1;
    setHomeworkMessages(prev => [...prev, { role: 'ai', text: '' }]);

    try {
      const context = `You are a homework helper AI. Help students understand concepts, solve problems, and learn effectively. 
      
Current student context:
- Has ${assignments.length} assignments
- Taking ${classes.length} classes: ${classes.map(c => c.name).join(', ')}
- Recent assignments: ${assignments.slice(0, 3).map(a => `${a.title} (${a.subject})`).join(', ')}
- Student has uploaded a homework image for reference

Provide detailed, educational help that guides the student to understand the concepts rather than just giving answers. Use markdown formatting for better readability.`;
      
      const history = homeworkMessages.slice(-6);
      
      await callGeminiStream(
        userMessage,
        context,
        (streamedText) => {
          setHomeworkMessages(prev => {
            const newMessages = [...prev];
            newMessages[aiMessageIndex] = { role: 'ai', text: streamedText };
            return newMessages;
          });
          // Auto-scroll to bottom during streaming
          setTimeout(() => {
            const homeworkChatContainer = document.querySelector('.homework-chat-container');
            if (homeworkChatContainer) {
              homeworkChatContainer.scrollTop = homeworkChatContainer.scrollHeight;
            }
          }, 50);
        },
        history
      );
    } catch (error) {
      setHomeworkMessages(prev => {
        const newMessages = [...prev];
        newMessages[aiMessageIndex] = { role: 'ai', text: 'Sorry, I encountered an error. Please try again.' };
        return newMessages;
      });
    }
    
    setHomeworkLoading(false);
  };
  // Phone upload functionality
  const generateUploadId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handlePhoneUpload = () => {
    const id = generateUploadId();
    setUploadId(id);
    setShowQR(true);
    setCheckingUploads(true);
  };

  // Check for uploaded images from phone
  useEffect(() => {
    if (!uploadId || !checkingUploads) return;
    
    const checkInterval = setInterval(async () => {
      try {
        const response = await fetch(`${FB_FS}/uploads/${uploadId}?key=${FB_KEY}`);
        if (response.ok) {
          const data = await response.json();
          const imageData = data.fields?.image?.stringValue;
          if (imageData) {
            setUploadedImage(imageData);
            setCheckingUploads(false);
            setShowQR(false);
            setHasUploadedPhoto(true);
            
            setHomeworkMessages([
              { role: 'ai', text: 'Great! I can see your homework image. What questions do you have about this homework?' }
            ]);
            
            setTimeout(() => {
              fetch(`${FB_FS}/uploads/${uploadId}?key=${FB_KEY}`, { method: 'DELETE' }).catch(() => {});
            }, 5000);
          }
        }
      } catch (error) {
        console.log('Checking for upload...', error.message);
      }
    }, 2000);

    const timeout = setTimeout(() => {
      setCheckingUploads(false);
      clearInterval(checkInterval);
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(checkInterval);
      clearTimeout(timeout);
    };
  }, [uploadId, checkingUploads]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setHomeworkLoading(true);
    
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const imageData = event.target.result;
        setUploadedImage(imageData);
        setHasUploadedPhoto(true);
        
        setHomeworkMessages([
          { role: 'ai', text: 'Perfect! I can see your homework image. What questions do you have about this homework? I\'ll help you understand the concepts step by step.' }
        ]);
        setHomeworkLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setHomeworkMessages([{ role: 'ai', text: 'Sorry, I had trouble processing your image. Please try again.' }]);
      setHomeworkLoading(false);
    }
  };
  // Flashcards functionality
  const generateFlashcards = async () => {
    if (!flashcardTopic.trim() || flashcardLoading) return;
    
    setFlashcardLoading(true);
    setFlashcards([]);
    setFlippedCards(new Set());
    
    try {
      const context = `Create exactly 6 study flashcards for: ${flashcardTopic}

You are an expert educator creating flashcards. Make questions that test understanding, not just memorization.

For each flashcard, create:
- A clear, specific question
- A complete, educational answer

Format as JSON array:
[
  {"question": "What is the quadratic formula?", "answer": "The quadratic formula is x = (-b ± √(b²-4ac)) / 2a, used to solve equations of the form ax² + bx + c = 0"},
  {"question": "How do you complete the square for x² + 6x + 5?", "answer": "Take half of the coefficient of x (6/2 = 3), square it (9), then rewrite as (x + 3)² - 9 + 5 = (x + 3)² - 4"}
]

Return ONLY the JSON array with exactly 6 flashcards. No other text.`;
      
      const response = await callGemini(context);
      
      // Try to parse JSON first
      let cards = [];
      try {
        const cleanResponse = response.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
        const parsed = JSON.parse(cleanResponse);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cards = parsed.slice(0, 6); // Ensure max 6 cards
        }
      } catch (parseError) {
        console.log('JSON parsing failed, trying fallback parsing');
      }
      
      // Fallback parsing if JSON fails
      if (cards.length === 0) {
        const lines = response.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        let currentCard = {};
        
        for (const line of lines) {
          // Look for question patterns
          if (line.match(/^(\d+\.|\*|\-|Q:|Question:)/i) || line.includes('?')) {
            if (currentCard.question && currentCard.answer) {
              cards.push(currentCard);
              currentCard = {};
            }
            currentCard.question = line.replace(/^(\d+\.|\*|\-|Q:|Question:)\s*/i, '').trim();
          }
          // Look for answer patterns
          else if (line.match(/^(A:|Answer:)/i) || (currentCard.question && !currentCard.answer && line.length > 10)) {
            currentCard.answer = line.replace(/^(A:|Answer:)\s*/i, '').trim();
          }
        }
        
        // Add the last card if complete
        if (currentCard.question && currentCard.answer) {
          cards.push(currentCard);
        }
      }
      
      // If still no cards, create some basic ones
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
      
      // Ensure we have at least some cards
      setFlashcards(cards.slice(0, 6));
      
    } catch (error) {
      console.error('Flashcard generation error:', error);
      setFlashcards([{
        question: `Study topic: ${flashcardTopic}`,
        answer: 'Sorry, I couldn\'t generate flashcards right now. Please try again or check your internet connection.'
      }]);
    }
    
    setFlashcardLoading(false);
    setFlashcardTopic('');
  };

  const toggleFlashcard = (index) => {
    const newFlipped = new Set(flippedCards);
    if (newFlipped.has(index)) {
      newFlipped.delete(index);
    } else {
      newFlipped.add(index);
    }
    setFlippedCards(newFlipped);
  };
  // Writing feedback functionality
  const analyzeWriting = async () => {
    if (!writingText.trim() || writingLoading) return;
    
    setWritingLoading(true);
    setWritingFeedback('');
    
    try {
      const context = `Please provide detailed feedback on this writing. Focus on:
1. Grammar and mechanics (spelling, punctuation, sentence structure)
2. Clarity and organization (flow, transitions, paragraph structure)
3. Content and arguments (strength of ideas, evidence, logic)
4. Style and tone (appropriate for audience, engaging)
5. Specific suggestions for improvement

Be constructive and encouraging while providing actionable feedback. Use markdown formatting for better readability.`;
      
      await callGeminiStream(
        `Writing to review:\n${writingText}`,
        context,
        (streamedText) => {
          setWritingFeedback(streamedText);
        }
      );
    } catch (error) {
      setWritingFeedback('Sorry, I couldn\'t analyze your writing right now. Please try again.');
    }
    
    setWritingLoading(false);
  };

  // Insights functionality
  const generateInsights = async () => {
    if (insightsLoading) return;
    setInsightsLoading(true);
    setInsights('');
    
    try {
      const assignmentSummary = assignments.map(a => `${a.title} (${a.subject}) - Due: ${a.dueDate || 'No date'} - Progress: ${a.progress}%`).join('\n');
      const graded = assignments.filter(a => a.grade != null);
      const avgGrade = graded.length > 0 ? Math.round(graded.reduce((sum, a) => sum + a.grade, 0) / graded.length) : null;
      const overdue = assignments.filter(a => a.progress < 100 && a.dueDate && new Date(a.dueDate) < new Date());
      const completed = assignments.filter(a => a.progress >= 100);
      
      const context = `Analyze this student's academic performance and provide insights:

ASSIGNMENTS (${assignments.length} total):
${assignmentSummary}

PERFORMANCE METRICS:
- Completed: ${completed.length}/${assignments.length} assignments (${Math.round(completed.length/assignments.length*100)}%)
- Overdue: ${overdue.length} assignments
- Graded assignments: ${graded.length} with average: ${avgGrade || 'N/A'}%
- Classes: ${classes.length} total (${classes.map(c => c.name).join(', ')})

Provide specific insights about:
1. Study patterns and time management (based on completion rates and overdue items)
2. Subject performance analysis (if grades available)
3. Areas for improvement (specific, actionable advice)
4. Strengths to build on
5. Recommended next steps

Be encouraging and provide practical, actionable recommendations. Use markdown formatting for better readability.`;
      
      await callGeminiStream(
        'Please analyze my academic performance and provide insights.',
        context,
        (streamedText) => {
          setInsights(streamedText);
        }
      );
    } catch (error) {
      setInsights('Sorry, I couldn\'t generate insights right now. Please try again.');
    }
    
    setInsightsLoading(false);
  };

  // Generate QR code URL
  const getQRCodeUrl = (text) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
  };
  // Chat message component
  const ChatMessage = ({ msg, isUser }) => (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 16,
      width: '100%'
    }}>
      <div style={{
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        maxWidth: '80%',
        flexDirection: isUser ? 'row-reverse' : 'row'
      }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: isUser ? 'var(--accent)' : '#6366f1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '.8rem',
          fontWeight: 700,
          flexShrink: 0
        }}>
          {isUser ? '👤' : '🤖'}
        </div>
        <div style={{
          background: isUser ? 'var(--accent)' : 'var(--card)',
          color: isUser ? '#fff' : 'var(--text)',
          padding: '12px 16px',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          border: isUser ? 'none' : '1.5px solid var(--border)',
          fontSize: '.85rem',
          lineHeight: 1.6,
          fontFamily: "'Plus Jakarta Sans', sans-serif"
        }}>
          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }} />
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="sec-hd">
        <div className="sec-t">🤖 AI Study Assistant</div>
        <span style={{fontSize:".75rem",color:"var(--text3)",fontWeight:600}}>
          Powered by Gemini AI
        </span>
      </div>

      {/* AI Mode Tabs */}
      <div className="ai-modes" style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
        {[
          ['chat', '💬 Chat'],
          ['homework', '📝 Homework Helper'],
          ['flashcards', '🃏 Flashcards'],
          ['writing', '✍️ Writing'],
          ['insights', '📊 Insights']
        ].map(([mode, label]) => (
          <button
            key={mode}
            className={`btn btn-sm ${aiMode === mode ? 'btn-p' : 'btn-g'}`}
            onClick={() => setAiMode(mode)}
          >
            {label}
          </button>
        ))}
      </div>
      {/* CHAT MODE */}
      {aiMode === 'chat' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="chat-container" style={{
            flex: 1,
            background: 'var(--card)',
            border: '1.5px solid var(--border)',
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ flex: 1 }}>
              {messages.map((msg, i) => (
                <ChatMessage key={i} msg={msg} isUser={msg.role === 'user'} />
              ))}
              {loading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', background: '#6366f1',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: '.8rem', fontWeight: 700
                    }}>🤖</div>
                    <div style={{
                      background: 'var(--card)', padding: '12px 16px',
                      borderRadius: '16px 16px 16px 4px', border: '1.5px solid var(--border)',
                      fontSize: '.85rem', color: 'var(--text3)'
                    }}>Thinking...</div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div style={{display:"flex",gap:8}}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
              placeholder="Ask me anything about studying, learning strategies, or academics..."
              style={{flex:1,padding:"12px 16px",border:"1.5px solid var(--border)",borderRadius:12,background:"var(--card)",color:"var(--text)",fontSize:".85rem",outline:"none",fontFamily:"'Plus Jakarta Sans', sans-serif"}}
            />
            <button
              onClick={handleChatSend}
              disabled={!input.trim() || loading}
              style={{padding:"12px 20px",border:"none",borderRadius:12,background:!input.trim()||loading?"var(--border)":"var(--accent)",color:"#fff",fontWeight:600,cursor:!input.trim()||loading?"not-allowed":"pointer",fontFamily:"'Plus Jakarta Sans', sans-serif"}}
            >
              Send
            </button>
          </div>
        </div>
      )}
      {/* HOMEWORK HELPER MODE */}
      {aiMode === 'homework' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {!hasUploadedPhoto ? (
            <div style={{background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:16,padding:20,textAlign:"center"}}>
              <div style={{fontSize:"2rem",marginBottom:16}}>📸</div>
              <div style={{fontWeight:600,marginBottom:12,color:"var(--text)"}}>Upload Your Homework First</div>
              <div style={{fontSize:".85rem",color:"var(--text3)",marginBottom:20,lineHeight:1.5}}>
                Please upload a photo of your homework before we can start helping you with it.
              </div>
              <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{display:"none"}}
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="btn btn-p">
                  📁 Upload File
                </label>
                <button className="btn btn-p" onClick={() => document.getElementById('camera-upload').click()}>
                  📷 Take Picture
                </button>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  style={{display:"none"}}
                  id="camera-upload"
                />
                <button className="btn btn-p" onClick={handlePhoneUpload}>
                  📱 Use Phone
                </button>
              </div>
              
              {showQR && uploadId && (
                <div style={{marginTop:20,padding:16,background:"var(--bg3)",borderRadius:12}}>
                  <div style={{fontWeight:600,marginBottom:8}}>📱 Scan with your phone:</div>
                  <div style={{marginBottom:12}}>
                    <img 
                      src={getQRCodeUrl(`${window.location.origin}/upload/${uploadId}`)} 
                      alt="QR Code"
                      style={{borderRadius:8,background:"#fff",padding:8}}
                    />
                  </div>
                  <div style={{fontSize:".8rem",color:"var(--text3)",marginBottom:8}}>
                    Or visit: {window.location.origin}/upload/{uploadId}
                  </div>
                  {checkingUploads && (
                    <div style={{fontSize:".8rem",color:"var(--accent)",fontWeight:600,marginBottom:8}}>
                      ⏳ Waiting for upload...
                    </div>
                  )}
                  <button className="btn btn-g btn-sm" onClick={() => {setShowQR(false); setCheckingUploads(false);}}>
                    Close
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Show uploaded image */}
              {uploadedImage && (
                <div style={{background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:16,padding:16,marginBottom:16}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                    <div style={{fontWeight:600,color:"var(--text)"}}>📸 Your Homework</div>
                    <div style={{display:"flex",gap:8}}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        style={{display:"none"}}
                        id="reupload-file"
                      />
                      <label htmlFor="reupload-file" className="btn btn-g btn-sm">
                        📁 Upload New
                      </label>
                      <button className="btn btn-g btn-sm" onClick={() => document.getElementById('reupload-camera').click()}>
                        📷 Take New
                      </button>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileUpload}
                        style={{display:"none"}}
                        id="reupload-camera"
                      />
                      <button className="btn btn-g btn-sm" onClick={handlePhoneUpload}>
                        📱 Phone
                      </button>
                    </div>
                  </div>
                  <img 
                    src={uploadedImage} 
                    alt="Uploaded homework" 
                    style={{width:"100%",maxWidth:600,borderRadius:8,border:"1px solid var(--border)"}}
                  />
                </div>
              )}
              {/* Homework Chat */}
              <div className="homework-chat-container" style={{
                flex: 1,
                background: 'var(--card)',
                border: '1.5px solid var(--border)',
                borderRadius: 16,
                padding: 20,
                marginBottom: 16,
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ flex: 1 }}>
                  {homeworkMessages.map((msg, i) => (
                    <ChatMessage key={i} msg={msg} isUser={msg.role === 'user'} />
                  ))}
                  {homeworkLoading && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 16 }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%', background: '#6366f1',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: '.8rem', fontWeight: 700
                        }}>🤖</div>
                        <div style={{
                          background: 'var(--card)', padding: '12px 16px',
                          borderRadius: '16px 16px 16px 4px', border: '1.5px solid var(--border)',
                          fontSize: '.85rem', color: 'var(--text3)'
                        }}>Thinking...</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{display:"flex",gap:8}}>
                <input
                  type="text"
                  value={homeworkInput}
                  onChange={(e) => setHomeworkInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleHomeworkSend()}
                  placeholder="Ask me about your homework..."
                  style={{flex:1,padding:"12px 16px",border:"1.5px solid var(--border)",borderRadius:12,background:"var(--card)",color:"var(--text)",fontSize:".85rem",outline:"none",fontFamily:"'Plus Jakarta Sans', sans-serif"}}
                />
                <button
                  onClick={handleHomeworkSend}
                  disabled={!homeworkInput.trim() || homeworkLoading}
                  style={{padding:"12px 20px",border:"none",borderRadius:12,background:!homeworkInput.trim()||homeworkLoading?"var(--border)":"var(--accent)",color:"#fff",fontWeight:600,cursor:!homeworkInput.trim()||homeworkLoading?"not-allowed":"pointer",fontFamily:"'Plus Jakarta Sans', sans-serif"}}
                >
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      )}
      {/* FLASHCARDS MODE */}
      {aiMode === 'flashcards' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:16,padding:20,marginBottom:16}}>
            <div style={{fontWeight:600,marginBottom:12,color:"var(--text)"}}>🃏 Create Flashcards</div>
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              <input
                type="text"
                value={flashcardTopic}
                onChange={(e) => setFlashcardTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && generateFlashcards()}
                placeholder="Enter topic (e.g., 'Biology Chapter 5', 'Spanish Vocabulary')..."
                style={{flex:1,padding:"10px 12px",border:"1.5px solid var(--border)",borderRadius:8,background:"var(--bg2)",color:"var(--text)",fontSize:".85rem",outline:"none",fontFamily:"'Plus Jakarta Sans', sans-serif"}}
              />
              <button
                className="btn btn-p"
                onClick={generateFlashcards}
                disabled={!flashcardTopic.trim() || flashcardLoading}
              >
                {flashcardLoading ? 'Creating...' : 'Generate'}
              </button>
            </div>
            <div style={{fontSize:".8rem",color:"var(--text3)"}}>
              💡 Tip: Be specific with your topic for better flashcards
            </div>
          </div>

          {flashcards.length > 0 && (
            <div style={{ flex: 1 }}>
              <div style={{fontSize:".9rem",fontWeight:600,color:"var(--text)",marginBottom:16}}>
                📚 Your Flashcards ({flashcards.length}) - Click to flip!
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))",gap:16,marginBottom:16}}>
                {flashcards.map((card, index) => {
                  const isFlipped = flippedCards.has(index);
                  return (
                    <div
                      key={index}
                      onClick={() => toggleFlashcard(index)}
                      style={{
                        background: "var(--card)",
                        border: "1.5px solid var(--border)",
                        borderRadius: 12,
                        minHeight: 200,
                        maxHeight: 250,
                        cursor: "pointer",
                        position: "relative",
                        transformStyle: "preserve-3d",
                        transition: "transform 0.6s",
                        transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                        overflow: "hidden"
                      }}
                    >
                      {/* Front side (Question) */}
                      <div style={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        backfaceVisibility: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        padding: 20,
                        borderRadius: 12,
                        boxSizing: "border-box",
                        overflow: "hidden"
                      }}>
                        <div style={{fontSize:".8rem",color:"var(--accent)",fontWeight:600,marginBottom:12,textAlign:"center"}}>QUESTION</div>
                        <div style={{
                          fontSize:".85rem",
                          color:"var(--text)",
                          lineHeight:1.4,
                          textAlign:"center",
                          flex:1,
                          display:"flex",
                          alignItems:"center",
                          justifyContent:"center",
                          wordWrap:"break-word",
                          overflowWrap:"break-word",
                          hyphens:"auto",
                          padding:"0 4px"
                        }}>{card.question}</div>
                        <div style={{fontSize:".75rem",color:"var(--text4)",textAlign:"center",marginTop:12}}>Click to reveal answer</div>
                      </div>
                      
                      {/* Back side (Answer) */}
                      <div style={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        padding: 20,
                        borderRadius: 12,
                        background: "var(--card)",
                        boxSizing: "border-box",
                        overflow: "hidden"
                      }}>
                        <div style={{fontSize:".8rem",color:"#16a34a",fontWeight:600,marginBottom:12,textAlign:"center"}}>ANSWER</div>
                        <div style={{
                          fontSize:".85rem",
                          color:"var(--text)",
                          lineHeight:1.4,
                          textAlign:"center",
                          flex:1,
                          display:"flex",
                          alignItems:"center",
                          justifyContent:"center",
                          wordWrap:"break-word",
                          overflowWrap:"break-word",
                          hyphens:"auto",
                          padding:"0 4px",
                          overflowY:"auto"
                        }}>{card.answer}</div>
                        <div style={{fontSize:".75rem",color:"var(--text4)",textAlign:"center",marginTop:12}}>Click to see question</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div style={{textAlign:"center"}}>
                <button 
                  className="btn btn-g"
                  onClick={() => {setFlashcards([]); setFlippedCards(new Set());}}
                  style={{marginRight:8}}
                >
                  Clear Cards
                </button>
                <button 
                  className="btn btn-g"
                  onClick={() => setFlippedCards(new Set())}
                >
                  Reset All
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {/* WRITING MODE */}
      {aiMode === 'writing' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:16,padding:20,marginBottom:16}}>
            <div style={{fontWeight:600,marginBottom:12,color:"var(--text)"}}>✍️ Writing Feedback</div>
            <textarea
              value={writingText}
              onChange={(e) => setWritingText(e.target.value)}
              placeholder="Paste your writing here for detailed feedback on grammar, structure, and content..."
              style={{width:"100%",minHeight:150,padding:"12px",border:"1.5px solid var(--border)",borderRadius:8,background:"var(--bg2)",color:"var(--text)",fontSize:".85rem",outline:"none",resize:"vertical",fontFamily:"'Plus Jakarta Sans', sans-serif",marginBottom:12}}
            />
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:".8rem",color:"var(--text3)"}}>
                {writingText.length} characters
              </div>
              <button
                className="btn btn-p"
                onClick={analyzeWriting}
                disabled={!writingText.trim() || writingLoading}
              >
                {writingLoading ? 'Analyzing...' : 'Get Feedback'}
              </button>
            </div>
          </div>

          {writingFeedback && (
            <div style={{flex:1,background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:16,padding:20,overflow:"auto"}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:"#6366f1",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:".8rem",fontWeight:700}}>🤖</div>
                <div style={{fontWeight:600,color:"var(--text)"}}>Writing Feedback</div>
              </div>
              <div style={{fontSize:".85rem",lineHeight:1.6,color:"var(--text)",fontFamily:"'Plus Jakarta Sans', sans-serif"}}>
                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(writingFeedback) }} />
              </div>
              <div style={{marginTop:16,textAlign:"center"}}>
                <button 
                  className="btn btn-g btn-sm"
                  onClick={() => setWritingFeedback('')}
                >
                  Clear Feedback
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {/* INSIGHTS MODE */}
      {aiMode === 'insights' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:16,padding:20,marginBottom:16}}>
            <div style={{fontWeight:600,marginBottom:12,color:"var(--text)"}}>📊 Study Insights</div>
            <div style={{fontSize:".85rem",color:"var(--text2)",marginBottom:16,lineHeight:1.5}}>
              Get personalized insights based on your {assignments.length} assignments and {classes.length} classes. 
              I'll analyze your study patterns, performance, and provide actionable recommendations.
            </div>
            <button
              className="btn btn-p"
              onClick={generateInsights}
              disabled={insightsLoading || assignments.length === 0}
            >
              {insightsLoading ? 'Analyzing...' : 'Generate Insights'}
            </button>
            {assignments.length === 0 && (
              <div style={{fontSize:".8rem",color:"var(--text4)",marginTop:8}}>
                Add some assignments first to get personalized insights!
              </div>
            )}
          </div>

          {insights && (
            <div style={{flex:1,background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:16,padding:20,overflow:"auto"}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:"#6366f1",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:".8rem",fontWeight:700}}>🤖</div>
                <div style={{fontWeight:600,color:"var(--text)"}}>Your Study Insights</div>
              </div>
              <div style={{fontSize:".85rem",lineHeight:1.6,color:"var(--text)",fontFamily:"'Plus Jakarta Sans', sans-serif"}}>
                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(insights) }} />
              </div>
              <div style={{marginTop:16,textAlign:"center"}}>
                <button 
                  className="btn btn-g btn-sm"
                  onClick={() => setInsights('')}
                >
                  Clear Insights
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AITab;