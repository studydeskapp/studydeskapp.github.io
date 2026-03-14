// ═══════════════════════════════════════════════════════════════════════════════
// CANVAS SYNC SERVICE
// Handles Canvas LMS integration, assignment syncing, and API calls
// ═══════════════════════════════════════════════════════════════════════════════

import { fetchWithFallback } from '../utils/helpers';
import { launchConfetti } from './gameLogic';

// ── Canvas Sync Logic ──────────────────────────────────────────────────────────
export async function syncCanvas(token, baseUrl, silent, isLocalhost, proxyBlocked, canvasSyncRef, setCanvasSync, setAssignments, setCanvasToken, setGame) {
  if (!token || canvasSyncRef.current) return;
  
  if (isLocalhost) {
    setCanvasSync(s => ({ ...s, syncing: false, error: "Canvas sync doesn't work on localhost — deploy to test it" }));
    return;
  }
  
  if (proxyBlocked) {
    setCanvasSync(s => ({ ...s, syncing: false, error: "Canvas sync is blocked on this network (e.g. school wifi). Try on a personal device or network." }));
    return;
  }
  
  canvasSyncRef.current = true;
  if (!silent) setCanvasSync(s => ({ ...s, syncing: true, error: "" }));
  else setCanvasSync(s => ({ ...s, syncing: true }));
  
  try {
    const today = new Date().toISOString().split("T")[0];
    const syncPath = `/api/v1/planner/items?per_page=100&start_date=${today}`;
    const syncR = await fetchWithFallback(baseUrl, syncPath, {
      headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" },
    });
    let data = await syncR.json();
    if (!Array.isArray(data)) throw new Error("Unexpected response from Canvas");

    let newSubmits = 0;
    const completedAssignmentIds = []; // Track which assignments were completed
    
    setAssignments(prev => {
      let updated = [...prev];
      for (const item of data) {
        if (!item.plannable?.title) continue;
        const submitted = item.submissions?.submitted || false;
        const score = item.submissions?.score ?? null;
        const pointsPossible = item.plannable?.points_possible ?? null;
        const dueDate = item.plannable_date ? item.plannable_date.split("T")[0] : "";
        const subject = item.context_name || "";
        const title = item.plannable?.title || "";
        const match = updated.find(a => {
          const titleMatch = a.title.toLowerCase().trim() === title.toLowerCase().trim() ||
            a.title.toLowerCase().includes(title.toLowerCase().slice(0, 15)) ||
            title.toLowerCase().includes(a.title.toLowerCase().slice(0, 15));
          const subjectMatch = !subject || !a.subject ||
            a.subject.toLowerCase().includes(subject.toLowerCase().slice(0, 8)) ||
            subject.toLowerCase().includes(a.subject.toLowerCase().slice(0, 8));
          return titleMatch && subjectMatch;
        });
        
        if (match) {
          const wasSubmitted = match.progress >= 100;
          const patch = {};
          if (submitted && !wasSubmitted) { 
            patch.progress = 100;
            patch.completedDate = new Date().toISOString(); // Set completion date
            newSubmits++;
            completedAssignmentIds.push(match.id); // Track for points
          }
          if (score !== null && pointsPossible) { patch.grade = Math.round((score / pointsPossible) * 100); patch.gradeRaw = `${score}/${pointsPossible}`; }
          if (dueDate && !match.dueDate) patch.dueDate = dueDate;
          if (Object.keys(patch).length > 0) {
            updated = updated.map(a => a.id === match.id ? { ...a, ...patch } : a);
          }
        } else if (submitted) {
          const existing = updated.find(a => a.title.toLowerCase() === title.toLowerCase());
          if (!existing && dueDate) {
            const today2 = new Date(); today2.setHours(0, 0, 0, 0);
            const due = new Date(dueDate + "T00:00:00");
            if (due >= today2 || score !== null) {
              const newId = "canvas_" + Date.now() + "_" + Math.random().toString(36).slice(2);
              updated.push({
                id: newId,
                title, subject, dueDate, priority: "medium", progress: 100, notes: "Auto-imported from Canvas",
                completedDate: new Date().toISOString(), // Set completion date for new completed assignments
                ...(score !== null && pointsPossible ? { grade: Math.round((score / pointsPossible) * 100), gradeRaw: `${score}/${pointsPossible}` } : {})
              });
              newSubmits++;
              completedAssignmentIds.push(newId); // Track for points
            }
          }
        }
      }
      return updated;
    });

    // Award points for completed assignments
    if (completedAssignmentIds.length > 0) {
      setGame(prev => {
        const today = new Date().toISOString().split('T')[0];
        
        // Count how many assignments were completed today (including these new ones)
        const todayCompleted = completedAssignmentIds.length;
        
        // Calculate points: 15 per assignment + streak bonus if 3+ completed today
        let totalPoints = completedAssignmentIds.length * 15;
        
        // Check if this brings us to 3+ completions today for streak bonus
        if (todayCompleted >= 3) {
          const streakBonus = Math.round(10 + prev.streak * 4);
          totalPoints += streakBonus;
        }
        
        return {
          ...prev,
          points: prev.points + totalPoints
        };
      });
    }

    setCanvasSync({ lastSync: new Date(), syncing: false, newSubmissions: newSubmits, error: "", everSucceeded: true });
    if (newSubmits > 0) {
      launchConfetti(null);
      setTimeout(() => setCanvasSync(s => ({ ...s, newSubmissions: 0 })), 4000);
    }
  } catch (e) {
    setCanvasSync(s => {
      // If this was the very first sync attempt and it failed, clear the token so user isn't stuck
      if (!s.everSucceeded) {
        setCanvasToken("");
        return { lastSync: null, syncing: false, newSubmissions: 0, error: "", everSucceeded: false };
      }
      const msg = e.message || "Sync failed";
      const friendly = msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("CORS")
        ? "Network error — Canvas sync only works on the deployed site, not localhost"
        : msg;
      return { ...s, syncing: false, error: friendly };
    });
  }
  canvasSyncRef.current = false;
}