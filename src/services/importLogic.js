// ═══════════════════════════════════════════════════════════════════════════════
// IMPORT LOGIC SERVICE
// Handles assignment import from various sources (Canvas, Google Docs/Slides, text)
// ═══════════════════════════════════════════════════════════════════════════════

import { fetchWithFallback, extractId } from '../utils/helpers';
import { callGemini } from '../utils/gemini';
import { fbIncrementStat } from '../utils/firebase';
import { checkUnknown } from './gameLogic';

// ── Import State Reset ─────────────────────────────────────────────────────────
export function resetImport(setImportUrl, setPasteText, setCanvasPaste, setImportResult, setImportStep, setCanvasStatus, setAgendaUrl, setFetchStatus, setAgendaStep, setAgendaDocText, setAgendaSlideLinks, setAgendaSlideTexts) {
  setImportUrl("");
  setPasteText("");
  setCanvasPaste("");
  setImportResult(null);
  setImportStep("url");
  setCanvasStatus("");
  setAgendaUrl("");
  setFetchStatus("");
  setAgendaStep("url");
  setAgendaDocText("");
  setAgendaSlideLinks([]);
  setAgendaSlideTexts([]);
}

// ── Text Parsing Logic ─────────────────────────────────────────────────────────
export async function parseHomeworkFromText(text) {
  if (!text?.trim()) return [];
  
  const prompt = `Extract homework assignments from this text. Return a JSON array of objects with these fields:
- title: assignment name
- subject: class/subject name (if mentioned)
- dueDate: YYYY-MM-DD format (if mentioned, otherwise empty string)
- priority: "high", "medium", or "low" based on urgency
- notes: any additional details

Text to parse:
${text}

Return only the JSON array, no other text.`;

  try {
    const response = await callGemini(prompt);
    const parsed = JSON.parse(response);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    // Fallback to simple regex parsing
    const lines = text.split('\n').filter(line => line.trim());
    const assignments = [];
    
    for (const line of lines) {
      if (line.toLowerCase().includes('due') || line.toLowerCase().includes('assignment')) {
        assignments.push({
          title: line.trim(),
          subject: "",
          dueDate: "",
          priority: "medium",
          notes: ""
        });
      }
    }
    
    return assignments;
  }
}

// ── Canvas Import Logic ────────────────────────────────────────────────────────
export async function importFromCanvasPaste(canvasPaste, setImporting, setImportResult) {
  if (!canvasPaste.trim()) return;
  setImporting(true);
  setImportResult(null);
  
  try {
    const clean = canvasPaste.trim();
    const s = clean.indexOf("["), e = clean.lastIndexOf("]");
    if (s === -1) throw new Error("Doesn't look like Canvas data — make sure you selected all the text on the page.");
    const parsed = JSON.parse(clean.slice(s, e + 1));
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("No assignments found. Make sure you're logged into Canvas first.");

    // Parse Canvas planner format
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const assignments = parsed
      .filter(item => item.plannable_type === "assignment" || item.plannable_type === "quiz" || item.plannable_type === "discussion_topic")
      .map(item => {
        const dueDate = item.plannable_date ? item.plannable_date.split("T")[0] : "";
        const days = dueDate ? (new Date(dueDate) - today) / 86400000 : 99;
        return {
          title: item.plannable?.title || item.plannable_type,
          subject: item.context_name || "Unknown",
          dueDate,
          priority: days <= 2 ? "high" : days <= 7 ? "medium" : "low",
          progress: 0,
          notes: item.plannable?.points_possible ? `${item.plannable.points_possible} pts` : "",
        };
      });

    if (assignments.length === 0) throw new Error("No upcoming assignments found in that data.");
    setImportResult({ assignments, source: "canvas" });
  } catch (e) {
    setImportResult({ error: e.message });
  }
  setImporting(false);
}

export async function importFromCanvasAPI(canvasToken, canvasBaseUrl, isLocalhost, proxyBlocked, setImporting, setImportResult) {
  if (isLocalhost) {
    setImportResult({ error: "Canvas API import doesn't work on localhost due to CORS. Deploy the app or use the 'Paste Canvas data' option instead." });
    return;
  }
  if (proxyBlocked) {
    setImportResult({ error: "Canvas is blocked on this network (e.g. school wifi). Try on a personal device or home network." });
    return;
  }
  
  setImporting(true);
  setImportResult(null);
  
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const startDate = today.toISOString().split("T")[0];
    // Fetch ALL pages of upcoming assignments
    let allItems = [];
    let currentPath = `/api/v1/planner/items?per_page=100&start_date=${startDate}`;
    let pageCount = 0;
    
    while (currentPath && pageCount < 20) {
      pageCount++;
      const r = await fetchWithFallback(canvasBaseUrl, currentPath, {
        headers: { "Authorization": `Bearer ${canvasToken}`, "Accept": "application/json" },
      });
      const link = r.headers.get("Link") || "";
      const nextMatch = link.match(/<([^>]+)>;\s*rel="next"/);
      let nextPath = null;
      if (nextMatch) {
        try { const nu = new URL(nextMatch[1]); nextPath = nu.pathname + nu.search; } catch { }
      }
      const data = await r.json();
      if (!Array.isArray(data)) throw new Error("Unexpected response from Canvas");
      allItems = [...allItems, ...data];
      currentPath = nextPath;
    }

    if (allItems.length === 0) throw new Error("No upcoming assignments found on Canvas.");

    // Parse into assignment objects
    const parsed = allItems
      .filter(item => ["assignment", "quiz", "discussion_topic", "wiki_page"].includes(item.plannable_type))
      .map(item => {
        const dueDate = item.plannable_date ? item.plannable_date.split("T")[0] : "";
        const days = dueDate ? (new Date(dueDate + "T00:00:00") - today) / 86400000 : 99;
        const submitted = item.submissions?.submitted || false;
        const score = item.submissions?.score ?? null;
        const pointsPossible = item.plannable?.points_possible ?? null;
        return {
          canvasId: String(item.plannable_id || ""),
          title: item.plannable?.title || item.plannable_type,
          subject: item.context_name || "Unknown",
          dueDate,
          priority: days <= 1 ? "high" : days <= 5 ? "medium" : "low",
          progress: submitted ? 100 : 0,
          notes: pointsPossible ? `${pointsPossible} pts` : "",
          pointsPossible,
          ...(score !== null && pointsPossible ? { grade: Math.round((score / pointsPossible) * 100), gradeRaw: `${score}/${pointsPossible}` } : {})
        };
      });

    if (parsed.length === 0) throw new Error("No assignments or quizzes found.");
    setImportResult({ assignments: parsed, source: "canvas", total: allItems.length });
  } catch (e) {
    setImportResult({ error: e.message });
  }
  setImporting(false);
}

// ── Google Slides/Docs Import Logic ────────────────────────────────────────────
export async function importFromSlides(pasteText, setImporting, setImportResult) {
  if (!pasteText.trim()) return;
  setImporting(true);
  setImportResult(null);
  
  try {
    const parsed = await parseHomeworkFromText(pasteText);
    if (!parsed.length) throw new Error("No assignments detected. Make sure the text contains lines like 'Complete X Due Tomorrow'.");
    setImportResult({ assignments: parsed });
  } catch (e) {
    setImportResult({ error: e.message });
  }
  setImporting(false);
}

export function extractDocId(url) {
  const m = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

export async function fetchViaProxy(url) {
  const FREE_SLIDE_PROXIES = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  ];
  let lastErr;
  for (const proxyUrl of FREE_SLIDE_PROXIES) {
    try {
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(10000) });
      if (res.ok) return res.text();
    } catch (e) { lastErr = e; }
  }
  throw new Error(`Failed to fetch slides. Make sure the link is set to "Anyone with link can view".`);
}

// ── Import Confirmation Logic ──────────────────────────────────────────────────
export function confirmImport(importResult, user, setAssignments, classes, setSchedPrompt, setImportOpen, resetImportFn, setTab, fbIncrementStat) {
  const incoming = importResult?.assignments || [];
  setAssignments(prev => {
    let updated = [...prev];
    const toAdd = [];
    for (const a of incoming) {
      // Try to find existing match by canvasId or title+subject
      const match = updated.find(ex =>
        (a.canvasId && ex.canvasId === a.canvasId) ||
        (ex.title.toLowerCase().trim() === a.title.toLowerCase().trim() &&
          (!a.subject || !ex.subject || ex.subject.toLowerCase() === a.subject.toLowerCase()))
      );
      if (match) {
        // Update with Canvas data
        updated = updated.map(ex => ex.id === match.id ? {
          ...ex,
          ...(a.canvasId ? { canvasId: a.canvasId } : {}),
          subject: a.subject || ex.subject,
          dueDate: a.dueDate || ex.dueDate,
          priority: a.priority || ex.priority,
          progress: Math.max(ex.progress, a.progress),
          ...(a.grade != null ? { grade: a.grade, gradeRaw: a.gradeRaw } : {}),
          ...(a.pointsPossible ? { pointsPossible: a.pointsPossible } : {}),
        } : ex);
      } else {
        toAdd.push({ ...a, id: Date.now().toString() + Math.random().toString(36).slice(2) });
      }
    }
    if (toAdd.length && user) fbIncrementStat("totalAssignments", toAdd.length, user.idToken);
    checkUnknown(toAdd, classes, setSchedPrompt);
    return [...updated, ...toAdd];
  });
  setImportOpen(false);
  resetImportFn();
  setTab("assignments");
}