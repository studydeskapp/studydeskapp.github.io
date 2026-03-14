import React, { useState } from 'react';

/**
 * Timer View - Mobile Pomodoro timer interface
 */
function TimerView({ 
  timerMode,
  setTimerMode,
  timerSeconds,
  timerRunning,
  timerSessions,
  startTimer,
  resetTimer,
  fmtTimer,
  customFocus,
  setCustomFocus,
  customShort,
  setCustomShort,
  customLong,
  setCustomLong
}) {
  const [showSettings, setShowSettings] = useState(false);

  const modes = [
    { id: 'pomodoro', label: 'Focus', icon: '🍅', seconds: customFocus * 60 },
    { id: 'short', label: 'Short Break', icon: '☕', seconds: customShort * 60 },
    { id: 'long', label: 'Long Break', icon: '🌴', seconds: customLong * 60 }
  ];

  const currentMode = modes.find(m => m.id === timerMode) || modes[0];

  const handleModeChange = (modeId) => {
    const mode = modes.find(m => m.id === modeId);
    setTimerMode(modeId);
    if (!timerRunning && mode) {
      resetTimer(mode.seconds);
    }
  };

  return (
    <div className="mobile-view">
      <div className="timer-header-mobile">
        <h1 className="timer-title-mobile">Timer</h1>
        <button 
          className="btn-icon"
          onClick={() => setShowSettings(!showSettings)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
          </svg>
        </button>
      </div>

      <div className="timer-sessions-mobile">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 11l3 3L22 4"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
        <span>{timerSessions} session{timerSessions !== 1 ? 's' : ''} today</span>
      </div>

      <div className="timer-display-card">
        <div className="timer-mode-label">
          <span className="timer-mode-icon">{currentMode.icon}</span>
          <span>{currentMode.label}</span>
        </div>
        
        <div className="timer-display-mobile">
          {fmtTimer(timerSeconds)}
        </div>

        <div className="timer-mode-pills">
          {modes.map(mode => (
            <button
              key={mode.id}
              className={`timer-mode-pill ${timerMode === mode.id ? 'active' : ''}`}
              onClick={() => handleModeChange(mode.id)}
            >
              <span>{mode.icon}</span>
              <span>{mode.label}</span>
            </button>
          ))}
        </div>

        <div className="timer-controls-mobile">
          <button
            className={`btn-timer-mobile ${timerRunning ? 'pause' : 'start'}`}
            onClick={() => startTimer(timerSeconds)}
          >
            {timerRunning ? (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16"/>
                  <rect x="14" y="4" width="4" height="16"/>
                </svg>
                <span>Pause</span>
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                <span>Start</span>
              </>
            )}
          </button>
          
          <button
            className="btn-timer-mobile reset"
            onClick={() => resetTimer(currentMode.seconds)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
            </svg>
            <span>Reset</span>
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="timer-settings-mobile">
          <h3 className="timer-settings-title">Timer Settings</h3>
          
          <div className="timer-setting-item">
            <label>Focus Time (minutes)</label>
            <input
              type="number"
              min="1"
              max="120"
              value={customFocus}
              onChange={(e) => setCustomFocus(Math.max(1, parseInt(e.target.value) || 25))}
              className="timer-input-mobile"
            />
          </div>

          <div className="timer-setting-item">
            <label>Short Break (minutes)</label>
            <input
              type="number"
              min="1"
              max="30"
              value={customShort}
              onChange={(e) => setCustomShort(Math.max(1, parseInt(e.target.value) || 5))}
              className="timer-input-mobile"
            />
          </div>

          <div className="timer-setting-item">
            <label>Long Break (minutes)</label>
            <input
              type="number"
              min="1"
              max="60"
              value={customLong}
              onChange={(e) => setCustomLong(Math.max(1, parseInt(e.target.value) || 15))}
              className="timer-input-mobile"
            />
          </div>
        </div>
      )}

      <div className="timer-tips-mobile">
        <div className="timer-tips-title">Pomodoro Technique</div>
        <div className="timer-tips-text">
          1. Work for {customFocus} minutes<br/>
          2. Take a {customShort}-minute break<br/>
          3. Repeat 4 times<br/>
          4. Take a longer {customLong}-minute break
        </div>
      </div>
    </div>
  );
}

export default TimerView;
