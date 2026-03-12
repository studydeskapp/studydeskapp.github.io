import React from 'react';

function TimerTab({ 
  timerMode, 
  setTimerMode, 
  timerSeconds, 
  timerRunning, 
  startTimer, 
  resetTimer, 
  fmtTimer,
  customFocus,
  customShort,
  customLong,
  showCustomTimer,
  setShowCustomTimer
}) {
  const MODES = [
    {id:"pomodoro", label:"🍅 Focus", secs:customFocus*60},
    {id:"short", label:"☕ Short Break", secs:customShort*60},
    {id:"long", label:"🌴 Long Break", secs:customLong*60},
    {id:"custom", label:"⚙️ Custom", secs:25*60}
  ];

  return (
    <div>
      <div className="sec-hd">
        <div className="sec-t">⏰ Study Timer</div>
        <button className="btn btn-g btn-sm" onClick={()=>setShowCustomTimer(!showCustomTimer)}>
          ⚙️ Settings
        </button>
      </div>
      
      <div className="timer-shell" style={{background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:20,padding:32,textAlign:"center",marginBottom:20}}>
        <div className="timer-display" style={{fontSize:"3rem",fontWeight:800,color:"var(--accent)",marginBottom:20,fontFamily:"monospace"}}>
          {fmtTimer(timerSeconds)}
        </div>
        
        <div className="timer-modes" style={{display:"flex",gap:8,justifyContent:"center",marginBottom:20,flexWrap:"wrap"}}>
          {MODES.map(mode => (
            <button 
              key={mode.id}
              className={`btn btn-sm ${timerMode === mode.id ? 'btn-p' : 'btn-g'}`}
              onClick={() => setTimerMode(mode.id)}
              style={{minWidth:100}}
            >
              {mode.label}
            </button>
          ))}
        </div>
        
        <div style={{display:"flex",gap:12,justifyContent:"center"}}>
          <button 
            className={`btn ${timerRunning ? 'btn-r' : 'btn-p'}`}
            onClick={startTimer}
            style={{minWidth:100}}
          >
            {timerRunning ? '⏸️ Pause' : '▶️ Start'}
          </button>
          <button 
            className="btn btn-g"
            onClick={resetTimer}
            style={{minWidth:100}}
          >
            🔄 Reset
          </button>
        </div>
      </div>
      
      <div className="timer-tips" style={{background:"var(--bg2)",border:"1.5px solid var(--border2)",borderRadius:12,padding:16}}>
        <div style={{fontWeight:600,marginBottom:8,color:"var(--text)"}}>🎯 Pomodoro Technique</div>
        <div style={{fontSize:".85rem",color:"var(--text3)",lineHeight:1.6}}>
          1. Work for 25 minutes<br/>
          2. Take a 5-minute break<br/>
          3. Repeat 3-4 times<br/>
          4. Take a longer 15-30 minute break
        </div>
      </div>
    </div>
  );
}

export default TimerTab;