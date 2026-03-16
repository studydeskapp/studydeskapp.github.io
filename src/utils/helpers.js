// ┌──────────────────────────────────────────────────────────────────────────────┐
// │  HELPER UTILITIES                                                            │
// │  Pure utility functions with no side effects or state dependencies.         │
// └──────────────────────────────────────────────────────────────────────────────┘

import { BUDDY_STAGES, DAYS, SUBJECT_COLORS } from '../constants';

// ┌──────────────────────────────────────────────────────────────────────────────┐
// │  BUDDY / GAME HELPERS                                                        │
// └──────────────────────────────────────────────────────────────────────────────┘

export function getBuddyStage(s){
  return s>=30?5:s>=14?4:s>=7?3:s>=3?2:s>=1?1:0;
}

// ┌──────────────────────────────────────────────────────────────────────────────┐
// │  DATE & TIME HELPERS                                                         │
// └──────────────────────────────────────────────────────────────────────────────┘

export function daysUntil(d){
  if(!d)return Infinity;
  const n=new Date();
  n.setHours(0,0,0,0);
  return Math.ceil((new Date(d+"T00:00:00")-n)/86400000);
}

export function fmtDate(d){
  if(!d)return"";
  return new Date(d+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"});
}

export function fmt12(t){
  if(!t)return"";
  const[h,m]=t.split(":").map(Number);
  return`${h%12||12}:${String(m).padStart(2,"0")}${h>=12?"pm":"am"}`;
}

export function fmt12h(h){
  return`${h%12||12}${h>=12?"pm":"am"}`;
}

export function todayAbbr(){
  return DAYS[[6,0,1,2,3,4,5][new Date().getDay()]];
}

// ┌──────────────────────────────────────────────────────────────────────────────┐
// │  COLOR & SUBJECT HELPERS                                                     │
// └──────────────────────────────────────────────────────────────────────────────┘

export function subjectColor(name,classes){
  const c=classes.find(x=>x.name===name);
  if(c?.color)return c.color;
  let h=0;
  for(const ch of(name||""))h=(h*31+ch.charCodeAt(0))%SUBJECT_COLORS.length;
  return SUBJECT_COLORS[h];
}

// ┌──────────────────────────────────────────────────────────────────────────────┐
// │  URL HELPERS                                                                 │
// └──────────────────────────────────────────────────────────────────────────────┘

export function extractId(url){
  const m=url.match(/\/presentation\/d\/([a-zA-Z0-9_-]+)/);
  return m?m[1]:null;
}

// ┌──────────────────────────────────────────────────────────────────────────────┐
// │  CANVAS PROXY HELPER                                                         │
// └──────────────────────────────────────────────────────────────────────────────┘

export const CF_PROXY = "https://studydesk-proxy.goyalamars18.workers.dev";

export async function fetchWithFallback(base, path, options={}) {
  const url = `${CF_PROXY}/canvas?base=${encodeURIComponent(base)}&path=${encodeURIComponent(path)}`;
  const r = await fetch(url, {...options, signal:AbortSignal.timeout(15000)});
  if(r.ok) return r;
  if(r.status===401||r.status===403) throw new Error(`Canvas returned ${r.status} — check your API token`);
  throw new Error(`Canvas proxy returned ${r.status}`);
}


// ── Class Name Matching ────────────────────────────────────────────────────────
/**
 * Find the best matching class name from existing classes
 * Uses fuzzy matching to handle variations like "AP World History Semester 2" vs "AP World History"
 */
export function findMatchingClassName(importedName, existingClasses) {
  if (!importedName || !existingClasses || existingClasses.length === 0) {
    return importedName;
  }

  const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normalizedImported = normalize(importedName);
  
  // Check for exact match first
  const exactMatch = existingClasses.find(c => normalize(c.name) === normalizedImported);
  if (exactMatch) return exactMatch.name;
  
  // Check for substring match (e.g., "AP World History" is in "AP World History Semester 2")
  const substringMatch = existingClasses.find(c => {
    const existing = normalize(c.name);
    const imported = normalizedImported;
    return existing.includes(imported) || imported.includes(existing);
  });
  if (substringMatch) return substringMatch.name;
  
  // Calculate similarity scores for all classes
  const scores = existingClasses.map(c => {
    const existing = normalize(c.name);
    const imported = normalizedImported;
    
    // Calculate Levenshtein distance-based similarity
    const maxLen = Math.max(existing.length, imported.length);
    if (maxLen === 0) return { name: c.name, score: 1 };
    
    const distance = levenshteinDistance(existing, imported);
    const similarity = 1 - (distance / maxLen);
    
    return { name: c.name, score: similarity };
  });
  
  // Find best match (threshold: 0.6 = 60% similar)
  const bestMatch = scores.reduce((best, current) => 
    current.score > best.score ? current : best
  , { name: null, score: 0 });
  
  if (bestMatch.score >= 0.6) {
    return bestMatch.name;
  }
  
  // No good match found, return original
  return importedName;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}
