// ═══════════════════════════════════════════════════════════════════════════════
// GAME LOGIC SERVICE
// Handles XP, streaks, shop items, buddy progression, and floating animations
// ═══════════════════════════════════════════════════════════════════════════════

import { SHOP_ITEMS, SUBJECT_COLORS } from '../constants';
import { fbIncrementStat } from '../utils/firebase';

// ── Game Completion Logic ──────────────────────────────────────────────────────
// Validate streak on app load - reset if broken
export function validateStreak(game) {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  
  // If lastStreakDate is not yesterday or today, streak is broken
  if (game.lastStreakDate !== yesterdayStr && game.lastStreakDate !== today) {
    return { ...game, streak: 0 };
  }
  
  return game;
}

export function handleComplete(prev, next, user, setGame, addFloat, hasBeenCompleted) {
  // Only award points if going from incomplete to complete AND hasn't been completed before
  if (next !== 100 || prev >= 100 || hasBeenCompleted) return;
  
  if (user) fbIncrementStat("totalSubmitted", 1, user.idToken);
  if (user) fbIncrementStat("totalPoints", 15, user.idToken);
  
  const today = new Date().toISOString().split("T")[0];
  setGame(g => {
    const nd = g.dailyDate !== today;
    const nc = nd ? 1 : g.dailyCount + 1;
    let ns = g.streak, nl = g.lastStreakDate, bonus = 0;
    
    // Only update streak when completing 3rd assignment of the day
    if (nc === 3) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      
      // Continue streak if last streak was yesterday, start new streak if it was earlier or never
      if (g.lastStreakDate === yesterdayStr) {
        // Continue existing streak
        ns = g.streak + 1;
      } else if (g.lastStreakDate === today) {
        // Already got streak today, don't change it
        ns = g.streak;
      } else {
        // Streak broken, start new one
        ns = 1;
      }
      
      bonus = Math.round(10 + ns * 4);
      nl = today;
      setTimeout(() => addFloat(bonus, true), 600);
    }
    
    addFloat(15, false);
    return { ...g, points: g.points + 15 + bonus, streak: ns, lastStreakDate: nl, dailyDate: today, dailyCount: nc };
  });
}

// ── Shop Logic ─────────────────────────────────────────────────────────────────
export function buyItem(id, game, setGame) {
  const it = SHOP_ITEMS.find(i => i.id === id);
  if (!it || game.owned.includes(id) || game.points < it.price) return;
  setGame(g => ({ ...g, points: g.points - it.price, owned: [...g.owned, id] }));
}

export function equipItem(id, game, setGame) {
  const it = SHOP_ITEMS.find(i => i.id === id);
  if (!it || !game.owned.includes(id)) return;
  setGame(g => ({ ...g, equipped: { ...g.equipped, [it.cat]: g.equipped[it.cat] === id ? "" : id } }));
}

// ── Animation Logic ────────────────────────────────────────────────────────────
export function addFloat(pts, streak, setFloats) {
  const id = Date.now() + Math.random();
  setFloats(f => [...f, { id, pts, streak }]);
  setTimeout(() => setFloats(f => f.filter(x => x.id !== id)), 2000);
}

export function launchConfetti(originEl, setConfetti) {
  const rect = originEl ? originEl.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
  const ox = rect.left + rect.width / 2;
  const oy = rect.top + rect.height / 2;
  const colors = ["#16a34a", "#4ade80", "#fbbf24", "#f472b6", "#60a5fa", "#a78bfa", "#fb923c", "#fff"];
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: Date.now() + i,
    x: ox, y: oy,
    color: colors[i % colors.length],
    tx: (Math.random() - 0.5) * 700,
    ty: -(Math.random() * 300 + 100),
    rot: (Math.random() - 0.5) * 900,
    dur: 0.9 + Math.random() * 0.8,
    w: 6 + Math.random() * 8,
    h: 8 + Math.random() * 10,
  }));
  setConfetti(pieces);
  setTimeout(() => setConfetti([]), 2200);
}

// ── Class Detection Logic ──────────────────────────────────────────────────────
export function checkUnknown(adds, classes, setSchedPrompt) {
  const cn = new Set(classes.map(c => c.name));
  for (const a of adds) {
    if (a.subject && !cn.has(a.subject)) {
      setSchedPrompt({
        subject: a.subject,
        pf: { name: a.subject, days: [], startTime: "09:00", endTime: "10:00", room: "", color: SUBJECT_COLORS[0] }
      });
      return;
    }
  }
}