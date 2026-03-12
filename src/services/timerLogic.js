// ═══════════════════════════════════════════════════════════════════════════════
// TIMER LOGIC SERVICE
// Handles study timer functionality, sound effects, and notifications
// ═══════════════════════════════════════════════════════════════════════════════

// ── Timer Control Functions ────────────────────────────────────────────────────
export function startTimer(secs, setTimerSeconds, setTimerRunning) {
  setTimerSeconds(secs);
  setTimerRunning(true);
}

export function resetTimer(secs, timerInterval, setTimerRunning, setTimerSeconds, setTimerDone) {
  clearInterval(timerInterval);
  setTimerRunning(false);
  setTimerSeconds(secs);
  setTimerDone(false);
}

export function fmtTimer(s) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

// ── Timer Completion Logic ─────────────────────────────────────────────────────
export function playDoneSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    // Three ascending beeps
    [[0, .12, 660], [.18, .30, 880], [.36, .54, 1100]].forEach(([start, end, freq]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq; osc.type = "sine";
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + start + 0.02);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + end);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + end + 0.05);
    });
  } catch (e) { }
}

export function onTimerComplete(setTimerRunning, setTimerSessions, setGame, setTimerDone, playDoneSound) {
  setTimerRunning(false);
  setTimerSessions(n => n + 1);
  setGame(g => ({ ...g, points: g.points + 10 }));
  setTimerDone(true);
  playDoneSound();
  
  // Web Notification (works on Android PWA / desktop, not iOS)
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("StudyDesk — Session complete! 🎉", { body: "Time for a break. You earned 10 points.", icon: "/logo192.png" });
  }
  
  setTimeout(() => setTimerDone(false), 8000);
}