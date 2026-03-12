import React from 'react';

function TimerTab({ 
  timerMode, 
  setTimerMode, 
  timerSeconds, 
  timerRunning, 
  timerSessions,
  timerDone,
  setTimerDone,
  startTimer, 
  resetTimer, 
  fmtTimer,
  customFocus,
  setCustomFocus,
  customShort,
  setCustomShort,
  customLong,
  setCustomLong,
  customRounds,
  setCustomRounds,
  autoStartBreaks,
  setAutoStartBreaks,
  sessionCount,
  showCustomTimer,
  setShowCustomTimer
}) {
  const MODES = [
    {id:"pomodoro", label:"🍅 Focus", secs:customFocus*60},
    {id:"short", label:"☕ Short Break", secs:customShort*60},
    {id:"long", label:"🌴 Long Break", secs:customLong*60},
    {id:"custom", label:"⚙️ Custom", secs:25*60}
  ];

  const currentMode = MODES.find(m => m.id === timerMode) || MODES[0];

  return (
    <div>
      <div className="sec-hd">
        <div className="sec-t">⏰ Study Timer</div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <span style={{fontSize:".75rem",color:"var(--text3)",fontWeight:600}}>
            {timerSessions} session{timerSessions !== 1 ? 's' : ''} today
          </span>
          <button className="btn btn-g btn-sm" onClick={()=>setShowCustomTimer(!showCustomTimer)}>
            ⚙️ Settings
          </button>
        </div>
      </div>
      
      {/* Timer completion banner */}
      {timerDone && (
        <div style={{
          background:"linear-gradient(135deg, #16a34a, #22c55e)",
          color:"#fff",
          padding:"16px 20px",
          borderRadius:16,
          marginBottom:20,
          textAlign:"center",
          position:"relative",
          overflow:"hidden"
        }}>
          <div style={{fontSize:"1.1rem",fontWeight:700,marginBottom:4}}>🎉 Session Complete!</div>
          <div style={{fontSize:".85rem",opacity:.9}}>Great work! You earned 10 points.</div>
          <button 
            onClick={() => setTimerDone(false)}
            style={{
              position:"absolute",
              top:8,
              right:12,
              background:"none",
              border:"none",
              color:"#fff",
              fontSize:"1.2rem",
              cursor:"pointer",
              opacity:.7
            }}
          >
            ✕
          </button>
        </div>
      )}
      
      <div className="timer-shell" style={{background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:20,padding:32,textAlign:"center",marginBottom:20}}>
        <div className="timer-display" style={{fontSize:"3rem",fontWeight:800,color:"var(--accent)",marginBottom:20,fontFamily:"monospace"}}>
          {fmtTimer(timerSeconds)}
        </div>
        
        <div style={{fontSize:".85rem",color:"var(--text3)",marginBottom:20}}>
          {currentMode.label} • {Math.floor(currentMode.secs / 60)} minutes
        </div>
        
        <div className="timer-modes" style={{display:"flex",gap:8,justifyContent:"center",marginBottom:20,flexWrap:"wrap"}}>
          {MODES.map(mode => (
            <button 
              key={mode.id}
              className={`btn btn-sm ${timerMode === mode.id ? 'btn-p' : 'btn-g'}`}
              onClick={() => {
                setTimerMode(mode.id);
                if (!timerRunning) {
                  resetTimer(mode.secs);
                }
              }}
              style={{minWidth:100}}
            >
              {mode.label}
            </button>
          ))}
        </div>
        
        <div style={{display:"flex",gap:12,justifyContent:"center"}}>
          <button 
            className={`btn ${timerRunning ? 'btn-r' : 'btn-p'}`}
            onClick={() => startTimer(timerSeconds)}
            style={{minWidth:100}}
          >
            {timerRunning ? '⏸️ Pause' : '▶️ Start'}
          </button>
          <button 
            className="btn btn-g"
            onClick={() => resetTimer(currentMode.secs)}
            style={{minWidth:100}}
          >
            🔄 Reset
          </button>
        </div>
      </div>
      
      {/* Custom Timer Settings */}
      {showCustomTimer && (
        <div style={{background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:16,padding:20,marginBottom:20}}>
          <div style={{fontWeight:600,marginBottom:16,color:"var(--text)"}}>⚙️ Timer Settings</div>
          
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))",gap:16,marginBottom:16}}>
            <div>
              <label style={{display:"block",fontSize:".8rem",fontWeight:600,color:"var(--text3)",marginBottom:6}}>Focus Time (minutes)</label>
              <input 
                type="number" 
                min="1" 
                max="120" 
                value={customFocus} 
                onChange={(e) => setCustomFocus(Math.max(1, parseInt(e.target.value) || 25))}
                style={{width:"100%",padding:"8px 12px",border:"1.5px solid var(--border)",borderRadius:8,background:"var(--bg2)",color:"var(--text)",fontSize:".85rem"}}
              />
            </div>
            
            <div>
              <label style={{display:"block",fontSize:".8rem",fontWeight:600,color:"var(--text3)",marginBottom:6}}>Short Break (minutes)</label>
              <input 
                type="number" 
                min="1" 
                max="30" 
                value={customShort} 
                onChange={(e) => setCustomShort(Math.max(1, parseInt(e.target.value) || 5))}
                style={{width:"100%",padding:"8px 12px",border:"1.5px solid var(--border)",borderRadius:8,background:"var(--bg2)",color:"var(--text)",fontSize:".85rem"}}
              />
            </div>
            
            <div>
              <label style={{display:"block",fontSize:".8rem",fontWeight:600,color:"var(--text3)",marginBottom:6}}>Long Break (minutes)</label>
              <input 
                type="number" 
                min="1" 
                max="60" 
                value={customLong} 
                onChange={(e) => setCustomLong(Math.max(1, parseInt(e.target.value) || 15))}
                style={{width:"100%",padding:"8px 12px",border:"1.5px solid var(--border)",borderRadius:8,background:"var(--bg2)",color:"var(--text)",fontSize:".85rem"}}
              />
            </div>
            
            <div>
              <label style={{display:"block",fontSize:".8rem",fontWeight:600,color:"var(--text3)",marginBottom:6}}>Rounds until Long Break</label>
              <input 
                type="number" 
                min="2" 
                max="10" 
                value={customRounds} 
                onChange={(e) => setCustomRounds(Math.max(2, parseInt(e.target.value) || 4))}
                style={{width:"100%",padding:"8px 12px",border:"1.5px solid var(--border)",borderRadius:8,background:"var(--bg2)",color:"var(--text)",fontSize:".85rem"}}
              />
            </div>
          </div>
          
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <input 
              type="checkbox" 
              id="auto-breaks" 
              checked={autoStartBreaks} 
              onChange={(e) => setAutoStartBreaks(e.target.checked)}
              style={{width:16,height:16}}
            />
            <label htmlFor="auto-breaks" style={{fontSize:".85rem",color:"var(--text2)",cursor:"pointer"}}>
              Auto-start breaks (automatically begin break timers)
            </label>
          </div>
          
          <div style={{fontSize:".75rem",color:"var(--text4)",lineHeight:1.5}}>
            💡 Tip: The classic Pomodoro Technique uses 25-minute focus sessions with 5-minute breaks, 
            and a longer 15-30 minute break every 4 sessions.
          </div>
        </div>
      )}
      
      <div className="timer-tips" style={{background:"var(--bg2)",border:"1.5px solid var(--border2)",borderRadius:12,padding:16}}>
        <div style={{fontWeight:600,marginBottom:8,color:"var(--text)"}}>🎯 Pomodoro Technique</div>
        <div style={{fontSize:".85rem",color:"var(--text3)",lineHeight:1.6}}>
          1. Work for {customFocus} minutes<br/>
          2. Take a {customShort}-minute break<br/>
          3. Repeat {customRounds} times<br/>
          4. Take a longer {customLong}-minute break
        </div>
        {sessionCount > 0 && (
          <div style={{marginTop:12,fontSize:".8rem",color:"var(--accent)",fontWeight:600}}>
            Progress: {sessionCount % customRounds}/{customRounds} rounds 
            {sessionCount % customRounds === 0 && sessionCount > 0 && " (Long break time!)"}
          </div>
        )}
      </div>
    </div>
  );
}

export default TimerTab;