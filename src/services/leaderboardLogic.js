// ═══════════════════════════════════════════════════════════════════════════════
// LEADERBOARD LOGIC SERVICE
// Handles leaderboard fetching and user ranking functionality
// ═══════════════════════════════════════════════════════════════════════════════

import { FB_FS, FB_KEY } from '../utils/firebase';

// ── Leaderboard Logic ──────────────────────────────────────────────────────────
export async function fetchLeaderboard(user, setLeaderboard) {
  if (!user) return;
  try {
    const r = await fetch(`${FB_FS}/presence?key=${FB_KEY}&pageSize=50`, { headers: { "Authorization": `Bearer ${user.idToken}` } });
    const d = await r.json();
    const entries = (d.documents || []).map(doc => ({
      name: doc.fields?.displayName?.stringValue || doc.fields?.email?.stringValue?.split("@")[0] || "Anonymous",
      photo: doc.fields?.photoURL?.stringValue || "",
      points: parseInt(doc.fields?.points?.integerValue || 0),
      streak: parseInt(doc.fields?.streak?.integerValue || 0),
    })).filter(e => e.points > 0).sort((a, b) => b.points - a.points).slice(0, 10);
    setLeaderboard(entries);
  } catch { }
}