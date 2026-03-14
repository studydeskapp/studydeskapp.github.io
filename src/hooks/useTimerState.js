import { useState } from 'react';

/**
 * Encapsulates all timer-related state for the Pomodoro/study timer.
 * Logic is in services/timerLogic; this hook manages state only.
 */
export function useTimerState() {
  const [timerMode, setTimerMode] = useState("pomodoro"); // pomodoro|short|long|custom
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerInterval, setTimerInterval] = useState(null);
  const [timerSessions, setTimerSessions] = useState(0);
  const [showCustomTimer, setShowCustomTimer] = useState(false);
  const [customFocus, setCustomFocus] = useState(25);
  const [customShort, setCustomShort] = useState(5);
  const [customLong, setCustomLong] = useState(15);
  const [customRounds, setCustomRounds] = useState(4);
  const [autoStartBreaks, setAutoStartBreaks] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);

  return {
    timerMode,
    setTimerMode,
    timerSeconds,
    setTimerSeconds,
    timerRunning,
    setTimerRunning,
    timerInterval,
    setTimerInterval,
    timerSessions,
    setTimerSessions,
    showCustomTimer,
    setShowCustomTimer,
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
    setSessionCount,
  };
}
