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
