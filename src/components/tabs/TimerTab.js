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
  const [showCustomModal, setShowCustomModal] = React.useState(false);
  const [customWorkTime, setCustomWorkTime] = React.useState(25);
  const [customWorkSessions, setCustomWorkSessions] = React.useState(1);
  const [customBreakTime, setCustomBreakTime] = React.useState(5);
  const [customBreakCount, setCustomBreakCount] = React.useState(0);
  const [customLongBreakTime, setCustomLongBreakTime] = React.useState(15);
  const [customAutoStart, setCustomAutoStart] = React.useState(false);

  const MODES = [
    {id:"pomodoro", label:"🍅 Focus", secs:customFocus*60},
    {id:"short", label:"☕ Short Break", secs:customShort*60},
    {id:"long", label:"🌴 Long Break", secs:customLong*60},
    {id:"custom", label:"⚙️ Custom", secs:customWorkTime*60}
  ];

  const currentMode = MODES.find(m => m.id === timerMode) || MODES[0];

  const startCustomSession = () => {
    setTimerMode("custom");
    resetTimer(customWorkTime * 60);
    setShowCustomModal(false);
    if (customAutoStart) {
      setTimeout(() => startTimer(customWorkTime * 60), 100);
    }
  };

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
          {MODES.filter(m => m.id !== 'custom').map(mode => (
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
          <button 
            className={`btn btn-sm ${timerMode === 'custom' ? 'btn-p' : 'btn-g'}`}
            onClick={() => setShowCustomModal(true)}
            style={{minWidth:100}}
          >
            ⚙️ Custom
          </button>
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
        <div style={{fontWeight:600,marginBottom:8,color:"var(--text)"}}>Pomodoro Technique</div>
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

      {/* Custom Timer Modal */}
      {showCustomModal && (
        <div className="overlay" onClick={() => setShowCustomModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-t">⚙️ Custom Timer Session</div>
            
            <div style={{marginBottom:16}}>
              <label style={{display:"block",fontSize:".8rem",fontWeight:600,color:"var(--text3)",marginBottom:6}}>
                Work Time (minutes)
              </label>
              <input 
                type="number" 
                min="1" 
                max="180" 
                value={customWorkTime} 
                onChange={(e) => setCustomWorkTime(Math.max(1, parseInt(e.target.value) || 25))}
                className="finp"
              />
              <div style={{fontSize:".72rem",color:"var(--text4)",marginTop:4}}>
                How long do you want to focus?
              </div>
            </div>

            <div style={{marginBottom:16}}>
              <label style={{display:"block",fontSize:".8rem",fontWeight:600,color:"var(--text3)",marginBottom:6}}>
                Number of Work Sessions
              </label>
              <input 
                type="number" 
                min="1" 
                max="20" 
                value={customWorkSessions} 
                onChange={(e) => setCustomWorkSessions(Math.max(1, parseInt(e.target.value) || 1))}
                className="finp"
              />
              <div style={{fontSize:".72rem",color:"var(--text4)",marginTop:4}}>
                How many work sessions in a row?
              </div>
            </div>

            <div style={{marginBottom:16}}>
              <label style={{display:"block",fontSize:".8rem",fontWeight:600,color:"var(--text3)",marginBottom:6}}>
                Break Time (minutes)
              </label>
              <input 
                type="number" 
                min="0" 
                max="60" 
                value={customBreakTime} 
                onChange={(e) => setCustomBreakTime(Math.max(0, parseInt(e.target.value) || 5))}
                className="finp"
              />
              <div style={{fontSize:".72rem",color:"var(--text4)",marginTop:4}}>
                Short break between work sessions (0 for no breaks)
              </div>
            </div>

            <div style={{marginBottom:16}}>
              <label style={{display:"block",fontSize:".8rem",fontWeight:600,color:"var(--text3)",marginBottom:6}}>
                Number of Breaks
              </label>
              <input 
                type="number" 
                min="0" 
                max={customWorkSessions - 1} 
                value={customBreakCount} 
                onChange={(e) => setCustomBreakCount(Math.max(0, Math.min(customWorkSessions - 1, parseInt(e.target.value) || 0)))}
                className="finp"
              />
              <div style={{fontSize:".72rem",color:"var(--text4)",marginTop:4}}>
                How many breaks? (max {customWorkSessions - 1} for {customWorkSessions} sessions)
              </div>
            </div>

            {customBreakCount > 0 && customWorkSessions > 2 && (
              <div style={{marginBottom:16}}>
                <label style={{display:"block",fontSize:".8rem",fontWeight:600,color:"var(--text3)",marginBottom:6}}>
                  Long Break Time (minutes)
                </label>
                <input 
                  type="number" 
                  min="0" 
                  max="90" 
                  value={customLongBreakTime} 
                  onChange={(e) => setCustomLongBreakTime(Math.max(0, parseInt(e.target.value) || 15))}
                  className="finp"
                />
                <div style={{fontSize:".72rem",color:"var(--text4)",marginTop:4}}>
                  Longer break after every {Math.floor(customWorkSessions / 2)} sessions
                </div>
              </div>
            )}

            <div style={{marginBottom:20}}>
              <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
                <input 
                  type="checkbox" 
                  checked={customAutoStart} 
                  onChange={(e) => setCustomAutoStart(e.target.checked)}
                  style={{width:18,height:18}}
                />
                <span style={{fontSize:".85rem",color:"var(--text2)"}}>
                  Auto-start timer immediately
                </span>
              </label>
            </div>

            <div style={{
              background:"var(--bg3)",
              border:"1.5px solid var(--border)",
              borderRadius:12,
              padding:14,
              marginBottom:20,
              fontSize:".82rem",
              color:"var(--text2)",
              lineHeight:1.6
            }}>
              <div style={{fontWeight:600,marginBottom:6,color:"var(--text)"}}>Session Summary:</div>
              • {customWorkSessions} work session{customWorkSessions > 1 ? 's' : ''} of {customWorkTime} min each<br/>
              {customBreakCount > 0 && `• ${customBreakCount} break${customBreakCount > 1 ? 's' : ''} of ${customBreakTime} min each`}<br/>
              {customBreakCount > 0 && customWorkSessions > 2 && `• Long breaks of ${customLongBreakTime} min`}<br/>
              • Total time: ~{customWorkSessions * customWorkTime + customBreakCount * customBreakTime} minutes
            </div>

            <div className="mactions">
              <button className="btn btn-g" onClick={() => setShowCustomModal(false)}>
                Cancel
              </button>
              <button className="btn btn-p" onClick={startCustomSession}>
                Start Custom Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TimerTab;