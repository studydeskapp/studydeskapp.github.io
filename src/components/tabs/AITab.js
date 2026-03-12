import React, { useState } from 'react';
import { callGemini } from '../../utils/gemini';

function AITab({ assignments, classes }) {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hi! I\'m your AI study assistant. Ask me anything about your assignments, study tips, or homework help! 🎓' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const context = `You are a helpful AI study assistant. The student has ${assignments.length} assignments and ${classes.length} classes. Help them with study tips, homework questions, and academic guidance.`;
      const response = await callGemini(context + '\n\nStudent: ' + userMessage);
      setMessages(prev => [...prev, { role: 'ai', text: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I encountered an error. Please try again.' }]);
    }
    
    setLoading(false);
  };

  return (
    <div>
      <div className="sec-hd">
        <div className="sec-t">🤖 AI Study Assistant</div>
      </div>
      
      <div className="ai-chat" style={{background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:16,padding:20,marginBottom:16,minHeight:400,maxHeight:500,overflow:"auto"}}>
        {messages.map((msg, i) => (
          <div key={i} className={`ai-message ${msg.role}`} style={{marginBottom:16,display:"flex",gap:12,alignItems:"flex-start"}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:msg.role==="ai"?"#6366f1":"var(--accent)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:".8rem",fontWeight:700,flexShrink:0}}>
              {msg.role === 'ai' ? '🤖' : '👤'}
            </div>
            <div style={{flex:1,fontSize:".85rem",lineHeight:1.6,color:"var(--text)"}}>{msg.text}</div>
          </div>
        ))}
        {loading && (
          <div className="ai-message ai" style={{marginBottom:16,display:"flex",gap:12,alignItems:"flex-start"}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:"#6366f1",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:".8rem",fontWeight:700}}>🤖</div>
            <div style={{flex:1,fontSize:".85rem",color:"var(--text3)"}}>Thinking...</div>
          </div>
        )}
      </div>

      <div style={{display:"flex",gap:8}}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask me anything about studying, homework, or assignments..."
          style={{flex:1,padding:"12px 16px",border:"1.5px solid var(--border)",borderRadius:12,background:"var(--card)",color:"var(--text)",fontSize:".85rem",outline:"none"}}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          style={{padding:"12px 20px",border:"none",borderRadius:12,background:!input.trim()||loading?"var(--border)":"var(--accent)",color:"#fff",fontWeight:600,cursor:!input.trim()||loading?"not-allowed":"pointer"}}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default AITab;