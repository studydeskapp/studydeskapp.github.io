import { useState, useEffect, useRef } from "react";

// ── Firebase REST API (no SDK needed) ────────────────────────────────────────
const FB_KEY = "AIzaSyAm_er58eB70Mlhs1uALPmqMO-gh9BGg6c";
const FB_PROJECT = "studydesk-1b251";
const FB_AUTH = "https://identitytoolkit.googleapis.com/v1/accounts";
const FB_FS = `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents`;

const IS_PREVIEW = false;
const isChromebook = navigator.userAgentData?.platform === "Chrome OS" || navigator.userAgent.includes("CrOS");
function canvasProxyUrl(base, path) {
  return `https://corsproxy.io/?url=${encodeURIComponent(base+path)}`;
}

async function fbSignUp(email, password, displayName) {
  const r = await fetch(`${FB_AUTH}:signUp?key=${FB_KEY}`, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({email, password, returnSecureToken:true})
  });
  const d = await r.json();
  if(d.error) throw new Error(d.error.message);
  if(displayName) {
    await fetch(`${FB_AUTH}:update?key=${FB_KEY}`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({idToken:d.idToken, displayName, returnSecureToken:true})
    });
  }
  return {uid:d.localId, email:d.email, displayName, idToken:d.idToken, photoURL:null};
}

async function fbSignIn(email, password) {
  const r = await fetch(`${FB_AUTH}:signInWithPassword?key=${FB_KEY}`, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({email, password, returnSecureToken:true})
  });
  const d = await r.json();
  if(d.error) throw new Error(d.error.message);
  return {uid:d.localId, email:d.email, displayName:d.displayName||null, idToken:d.idToken, photoURL:d.photoUrl||null};
}

async function fbResetPassword(email) {
  const r = await fetch(`${FB_AUTH}:sendOobCode?key=${FB_KEY}`, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({requestType:"PASSWORD_RESET", email})
  });
  const d = await r.json();
  if(d.error) throw new Error(d.error.message);
  return true;
}

async function fbSendVerificationEmail(idToken) {
  const r = await fetch(`${FB_AUTH}:sendOobCode?key=${FB_KEY}`, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      requestType:"VERIFY_EMAIL",
      idToken,
      continueUrl:"https://studydeskapp.github.io"
    })
  });
  const d = await r.json();
  if(d.error) throw new Error(d.error.message);
  return true;
}

async function fbCheckEmailVerified(idToken) {
  const r = await fetch(`${FB_AUTH}:lookup?key=${FB_KEY}`, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({idToken})
  });
  const d = await r.json();
  if(d.error) throw new Error(d.error.message);
  return d.users?.[0]?.emailVerified === true;
}

async function fbDeleteAccount(idToken) {
  await fetch(`${FB_AUTH}:delete?key=${FB_KEY}`, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({idToken})
  });
}

async function fbAdminDeleteUserData(uid, adminIdToken) {
  // Delete user's Firestore docs (users + presence)
  await Promise.allSettled([
    fetch(`${FB_FS}/users/${uid}?key=${FB_KEY}`, {method:"DELETE", headers:{"Authorization":`Bearer ${adminIdToken}`}}),
    fetch(`${FB_FS}/presence/${uid}?key=${FB_KEY}`, {method:"DELETE", headers:{"Authorization":`Bearer ${adminIdToken}`}}),
  ]);
}

// ── Google Identity Services sign-in ─────────────────────────────────────────
// IMPORTANT: Replace the value below with your real Web Client ID from:
// Firebase Console → Authentication → Sign-in method → Google → Web SDK configuration → Web client ID
const GOOGLE_CLIENT_ID = "354710751847-29cuupcg436t4uubpa212ftg341s9t6p.apps.googleusercontent.com";

function loadGSI() {
  return new Promise(resolve => {
    if(window.google?.accounts?.id) { resolve(); return; }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.onload = resolve;
    document.head.appendChild(s);
  });
}

async function fbGoogleSignIn() {
  if(GOOGLE_CLIENT_ID === "REPLACE_WITH_YOUR_WEB_CLIENT_ID") {
    throw new Error("Google sign-in not configured. See setup instructions.");
  }
  await loadGSI();
  return new Promise((resolve, reject) => {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        if(response.credential) {
          resolve({ idToken: response.credential });
        } else {
          reject(new Error("No credential returned"));
        }
      },
      cancel_on_tap_outside: true,
    });
    // Use a popup-style button click flow
    window.google.accounts.id.prompt((notification) => {
      if(notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // Fallback: render a hidden button and click it
        const div = document.createElement("div");
        div.style.cssText = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:99999;";
        document.body.appendChild(div);
        window.google.accounts.id.renderButton(div, {
          type:"standard", theme:"outline", size:"large", text:"signin_with",
          width: 300,
        });
        const btn = div.querySelector("div[role=button]");
        if(btn) btn.click();
        // Clean up div after sign-in
        setTimeout(() => { try { document.body.removeChild(div); } catch{} }, 5000);
      }
    });
  });
}

async function fbLoadData(uid, idToken) {
  const r = await fetch(`${FB_FS}/users/${uid}`, {
    headers:{"Authorization":`Bearer ${idToken}`}
  });
  if(r.status===404) return null;
  const d = await r.json();
  if(d.error) return null;
  const raw = d.fields?.data?.stringValue;
  return raw ? JSON.parse(raw) : null;
}

async function fbSaveData(uid, idToken, data) {
  try {
    await fetch(`${FB_FS}/users/${uid}?updateMask.fieldPaths=data`, {
      method:"PATCH", headers:{"Content-Type":"application/json","Authorization":`Bearer ${idToken}`},
      body: JSON.stringify({fields:{data:{stringValue:JSON.stringify(data)}}})
    });
  } catch(e) { console.warn("Save error", e); }
}

function fbGetSession() {
  try { const s=localStorage.getItem("sd-session"); return s?JSON.parse(s):null; } catch{return null;}
}
function fbSetSession(user) {
  try { localStorage.setItem("sd-session", user?JSON.stringify(user):""); } catch{}
}
function fbClearSession() {
  try { localStorage.removeItem("sd-session"); } catch{}
}

const ADMIN_PASS = "studydesk2026";

async function fbIncrementStat(field, amount, idToken) {
  if(!amount) amount=1;
  try{
    await fetch(`https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents:commit?key=${FB_KEY}`,{
      method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${idToken}`},
      body:JSON.stringify({writes:[{transform:{document:`projects/${FB_PROJECT}/databases/(default)/documents/analytics/global`,fieldTransforms:[{fieldPath:field,increment:{integerValue:amount}}]}}]})
    });
  }catch(e){console.warn("Stat error",e);}
}

async function fbUpdatePresence(user) {
  try{
    await fetch(`${FB_FS}/presence/${user.uid}?key=${FB_KEY}&updateMask.fieldPaths=lastSeen&updateMask.fieldPaths=email&updateMask.fieldPaths=displayName`,{
      method:"PATCH",headers:{"Content-Type":"application/json","Authorization":`Bearer ${user.idToken}`},
      body:JSON.stringify({fields:{lastSeen:{timestampValue:new Date().toISOString()},email:{stringValue:user.email},displayName:{stringValue:user.displayName||user.email.split("@")[0]}}})
    });
  }catch(e){console.warn("Presence error",e);}
}

async function fbGetAdminStats(idToken) {
  try{
    const [gSnap,pSnap,uSnap]=await Promise.all([
      fetch(`${FB_FS}/analytics/global?key=${FB_KEY}`,{headers:{"Authorization":`Bearer ${idToken}`}}).then(r=>r.json()),
      fetch(`${FB_FS}/presence?key=${FB_KEY}&pageSize=200`,{headers:{"Authorization":`Bearer ${idToken}`}}).then(r=>r.json()),
      fetch(`${FB_FS}/users?key=${FB_KEY}&pageSize=200`,{headers:{"Authorization":`Bearer ${idToken}`}}).then(r=>r.json()),
    ]);
    const g=gSnap.fields||{};
    const gi=f=>parseInt(f?.integerValue||f?.doubleValue||0);
    const twoMin=new Date(Date.now()-2*60*1000);
    const allP=(pSnap.documents||[]);
    const online=allP.filter(p=>{const ls=p.fields?.lastSeen?.timestampValue;return ls&&new Date(ls)>twoMin;})
      .map(p=>({email:p.fields?.email?.stringValue||"",displayName:p.fields?.displayName?.stringValue||"",lastSeen:p.fields?.lastSeen?.timestampValue}));
    const allUsers=(uSnap.documents||[]).map(u=>({uid:u.name.split("/").pop(),email:u.fields?.email?.stringValue||"",displayName:u.fields?.displayName?.stringValue||""}));
    // Use actual document counts from Firestore — more reliable than manual counters
    const totalUsersReal = Math.max(gi(g.totalUsers), allUsers.length, allP.length);
    const today = new Date().toISOString().split("T")[0];
    const newToday = allP.filter(p=>{
      const ls=p.fields?.lastSeen?.timestampValue;
      return ls&&ls.startsWith(today);
    }).length;
    return{
      totalUsers:totalUsersReal,
      onlineNow:online.length,onlineUsers:online,
      totalAssignments:gi(g.totalAssignments),totalSubmitted:gi(g.totalSubmitted),
      totalClasses:gi(g.totalClasses),totalPoints:gi(g.totalPoints),
      newUsersToday:newToday,
      allUsers: allUsers.length > 0 ? allUsers :
        allP.map(p=>({uid:p.name.split("/").pop(),email:p.fields?.email?.stringValue||"",displayName:p.fields?.displayName?.stringValue||""})),
    };
  }catch(e){console.warn("Admin error",e);return null;}
}

const STORAGE_KEY = "hw-tracker-v1";
const APP_VERSION = "1.3.1";
const RELEASES = [
  {
    version: "1.3.1",
    date: "09 March 2026",
    title: "UI Cleanup & Chromebook Fix",
    changes: [
      "🎨 Cleaner header — icon buttons replace the old row of text buttons for a less cluttered look",
      "🗂️ Tabs redesigned with a subtle card-style active state instead of the filled color",
      "✨ Refined color palette, tighter spacing, and smoother hover animations throughout",
      "🔒 Canvas token no longer synced to the cloud — stays on your device only",
      "🚫 Canvas Connect now shows a clear message on Chromebooks instead of silently failing",
      "🐛 Removed background keep-alive requests that were firing even when Canvas wasn't connected",
    ]
  },
  {
    version: "1.3.0",
    date: "08 March 2026",
    title: "Canvas Sync, Grades & School Schedules",
    changes: [
      "🎓 One-click Canvas import — connect your token and import every upcoming assignment, quiz, and discussion instantly with no copy-pasting",
      "🔄 Canvas auto-syncs every 3 minutes — assignments mark themselves done the moment you submit on Canvas",
      "📈 Grades tab — per-class averages, letter grades, weighted scores, and expandable assignment breakdowns",
      "💯 Grades shown on every assignment card, color coded green/blue/yellow/red by letter grade",
      "🔁 Import updates existing assignments with latest Canvas data instead of creating duplicates",
      "🏫 School schedule import — search your school and get bell times loaded automatically",
      "📅 Naperville Central fully supported with day-specific times, SOAR period, and Wednesday late start",
      "🌐 School search uses two APIs in parallel — 80+ schools pre-loaded for instant results",
      "🔐 Google sign-in rebuilt with Google Identity Services — no more authorization errors",
      "👤 Click your username to sign out — cleaner header, no separate sign out button",
    ]
  },
  {
    version: "1.2.0",
    date: "03 March 2026",
    title: "Big UI Refresh + Dark Mode",
    changes: [
      "🌙 Dark mode — toggle in the header, remembers your preference",
      "📊 Redesigned dashboard with color-accent stat cards, overdue alert banner, and due-soon badges on today's classes",
      "📋 Assignments tab now splits into Pending and Completed sections",
      "📅 Schedule reworked into a two-panel layout with class list + pending counts alongside the timetable",
      "🧠 Smart subject picker — dropdown pulls from your schedule and past assignments when adding manually",
      "💡 Add-to-schedule prompt — if an imported or manually added subject isn't in your timetable, you'll be asked to set it up",
      "🎨 Polished cards, hover animations, and consistent spacing across all tabs",
      "💡 Suggestions button — send feature ideas and bug reports directly from the header",
    ]
  },
  {
    version: "1.1.0",
    date: "03 March 2026",
    title: "Study Buddy + Points",
    changes: [
      "🐣 Study Buddy tab — a little creature that grows as your streak increases through 6 evolution stages",
      "⭐ Points system — earn 15 points per completed assignment",
      "🔥 Daily streak — complete 3 assignments in a day to extend your streak, with scaling bonus points",
      "🛍️ Shop tab — spend points on 12 accessories for your buddy (hats, glasses, capes, and more)",
      "Streak and points badges in the header so you always know your progress",
      "Daily quest tracker with pip indicators on the Buddy tab",
    ]
  },
  {
    version: "1.0.0",
    date: "03 March 2026",
    title: "Initial Launch",
    changes: [
      "Homework tracker with assignments, schedule, and dashboard",
      "Import from Google Slides — paste a link to auto fetch or upload a .txt file",
      "Import from Google Docs agenda calendars — finds all linked slides from today onwards",
      "Import from Canvas — paste your planner JSON to pull in upcoming assignments",
      "Smart homework parser reads both \'Due [day]\' and \'TODAY\'S HOMEWORK\' formats",
      "Supports numeric dates like 1/27 and 2/4 for chemistry-style slides",
      "Subject dropdown on review screen — correct the class before adding",
      "Remove individual assignments from import preview with the ✕ button",
      "Priority levels, progress tracking, and overdue detection",
      "Weekly schedule view with class time and room management",
    ]
  }
];
const PRIORITY = {
  high:   { label: "High",   bg: "#fef2f2", text: "#dc2626" },
  medium: { label: "Medium", bg: "#fffbeb", text: "#d97706" },
  low:    { label: "Low",    bg: "#f0fdf4", text: "#16a34a" },
};
const SUBJECT_COLORS = ["#6366f1","#ec4899","#14b8a6","#f59e0b","#3b82f6","#8b5cf6","#10b981","#f97316","#06b6d4","#e11d48","#84cc16","#0ea5e9"];
const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const HOURS = Array.from({length:15},(_,i)=>i+7);
const SHOP_ITEMS=[{id:"party_hat",name:"Party Hat",cat:"hat",price:50,emoji:"🎉",desc:"Ready to celebrate!"},{id:"crown",name:"Royal Crown",cat:"hat",price:200,emoji:"👑",desc:"Fit for royalty"},{id:"wizard_hat",name:"Wizard Hat",cat:"hat",price:150,emoji:"🪄",desc:"Full of magic"},{id:"santa_hat",name:"Santa Hat",cat:"hat",price:100,emoji:"🎅",desc:"Ho ho homework!"},{id:"sunglasses",name:"Sunglasses",cat:"face",price:75,emoji:"😎",desc:"Too cool for school"},{id:"heart_eyes",name:"Heart Glasses",cat:"face",price:120,emoji:"🩷",desc:"Love studying"},{id:"monocle",name:"Monocle",cat:"face",price:130,emoji:"🧐",desc:"Very distinguished"},{id:"bow_tie",name:"Bow Tie",cat:"body",price:60,emoji:"🎀",desc:"Dressed to impress"},{id:"cape",name:"Hero Cape",cat:"body",price:220,emoji:"🦸",desc:"Study hero!"},{id:"halo",name:"Halo",cat:"special",price:280,emoji:"😇",desc:"Pure dedication"},{id:"wings",name:"Fairy Wings",cat:"special",price:350,emoji:"🦋",desc:"Soar through homework"},{id:"rainbow",name:"Rainbow Aura",cat:"special",price:420,emoji:"🌈",desc:"Legendary scholar"}];
const BUDDY_STAGES=[{name:"Sleeping Egg",min:0,next:1,desc:"Complete your first streak to hatch!"},{name:"Baby Bud",min:1,next:3,desc:"A little buddy is growing..."},{name:"Tiny Tot",min:3,next:7,desc:"Getting bigger every day!"},{name:"Young Pal",min:7,next:14,desc:"Really coming into their own!"},{name:"Study Star",min:14,next:30,desc:"Nearly at legendary status!"},{name:"Legend",min:30,next:null,desc:"You have reached the pinnacle!"}];
function getBuddyStage(s){return s>=30?5:s>=14?4:s>=7?3:s>=3?2:s>=1?1:0;}


function daysUntil(d){if(!d)return Infinity;const n=new Date();n.setHours(0,0,0,0);return Math.ceil((new Date(d+"T00:00:00")-n)/86400000);}
function fmtDate(d){if(!d)return"";return new Date(d+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"});}
function fmt12(t){if(!t)return"";const[h,m]=t.split(":").map(Number);return`${h%12||12}:${String(m).padStart(2,"0")}${h>=12?"pm":"am"}`;}
function fmt12h(h){return`${h%12||12}${h>=12?"pm":"am"}`;}
function todayAbbr(){return DAYS[[6,0,1,2,3,4,5][new Date().getDay()]];}
function subjectColor(name,classes){const c=classes.find(x=>x.name===name);if(c?.color)return c.color;let h=0;for(const ch of(name||""))h=(h*31+ch.charCodeAt(0))%SUBJECT_COLORS.length;return SUBJECT_COLORS[h];}
function extractId(url){const m=url.match(/\/presentation\/d\/([a-zA-Z0-9_-]+)/);return m?m[1]:null;}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#F4F1EB;--bg2:#FFFFFF;--bg3:#EDEAE3;--bg4:#E5E1D8;--border:#DDD9D1;--border2:#C4BFB5;--text:#18192B;--text2:#52556E;--text3:#8F93A8;--text4:#C2C5D4;--accent:#18192B;--accent2:#2B2E50;--card:#FFFFFF;--card2:#F9F7F3;--sh:rgba(24,25,43,.06);--sh2:rgba(24,25,43,.13);--mbg:#F4F1EB;--ibg:#FFFFFF;--sg:linear-gradient(160deg,#FFFFFF,#F5F3EE);--hb:#18192B;--tb:#E8E4DC;--tc:#F5F3ED;--schdr:#18192B;--radius:16px}
.dark{--bg:#0D0F18;--bg2:#13151F;--bg3:#181B27;--bg4:#1E2130;--border:#232638;--border2:#2E3248;--text:#E0E4F8;--text2:#8A90B8;--text3:#525875;--text4:#303550;--accent:#7C85FF;--accent2:#9199FF;--card:#13151F;--card2:#171A26;--sh:rgba(0,0,0,.35);--sh2:rgba(0,0,0,.55);--mbg:#13151F;--ibg:#181B27;--sg:linear-gradient(160deg,#181B27,#13151F);--hb:#232638;--tb:#171A26;--tc:#161822;--schdr:#13151F;--radius:16px}
body{font-family:'Plus Jakarta Sans',sans-serif;background:var(--bg);min-height:100vh;color:var(--text);transition:background .25s,color .25s}
.dk{background:var(--bg);min-height:100vh;transition:background .25s}
.app{max-width:1080px;margin:0 auto;padding:0 20px 120px}
.hdr{padding:20px 0 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1.5px solid var(--border);margin-bottom:24px;gap:12px;flex-wrap:wrap}
.hdr-title{font-family:'Fraunces',serif;font-size:1.85rem;font-weight:700;color:var(--text);letter-spacing:-.5px;line-height:1}
.hdr-sub{font-size:.75rem;color:var(--text3);margin-top:3px;font-weight:500}
.hdr-r{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.hdr-icon-btn{width:34px;height:34px;border-radius:10px;border:1.5px solid var(--border);background:var(--card);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.85rem;color:var(--text2);transition:all .15s;position:relative;flex-shrink:0}
.hdr-icon-btn:hover{background:var(--bg3);border-color:var(--border2);color:var(--text)}
.hdr-icon-btn .notif-dot{position:absolute;top:-3px;right:-3px;width:7px;height:7px;background:#ef4444;border-radius:50%;border:1.5px solid var(--bg)}
.dm-btn{width:44px;height:26px;border-radius:13px;border:1.5px solid var(--border2);background:var(--bg3);cursor:pointer;position:relative;transition:all .2s;flex-shrink:0;padding:0}
.dm-knob{width:20px;height:20px;border-radius:50%;background:var(--text2);position:absolute;top:2px;left:2px;transition:transform .2s;display:flex;align-items:center;justify-content:center;font-size:.65rem;line-height:1}
.dark .dm-knob{transform:translateX(18px)}
.tabs{display:flex;gap:2px;margin-bottom:22px;background:var(--tb);padding:3px;border-radius:14px;width:fit-content;overflow-x:auto;max-width:100%;scrollbar-width:none}
.tabs::-webkit-scrollbar{display:none}
.tab{padding:7px 15px;border-radius:11px;border:none;background:transparent;font-family:'Plus Jakarta Sans',sans-serif;font-size:.8rem;font-weight:600;color:var(--text3);cursor:pointer;transition:all .18s;white-space:nowrap;letter-spacing:.01em}
.tab:hover:not(.on){background:var(--bg4);color:var(--text2)}
.tab.on{background:var(--card);color:var(--text);box-shadow:0 1px 6px var(--sh2),0 0 0 1px var(--border)}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:20px}
.stat{background:var(--card);border-radius:18px;padding:16px 16px 13px;border:1.5px solid var(--border);position:relative;overflow:hidden;transition:transform .18s,box-shadow .18s;cursor:default}
.stat:hover{transform:translateY(-2px);box-shadow:0 8px 24px var(--sh2)}
.sacc{position:absolute;top:0;left:0;right:0;height:3px;border-radius:18px 18px 0 0}
.stat-n{font-family:'Fraunces',serif;font-size:1.9rem;font-weight:700;color:var(--text);line-height:1;margin-top:4px}
.stat-l{font-size:.68rem;color:var(--text3);margin-top:5px;font-weight:700;text-transform:uppercase;letter-spacing:.07em}
.stat-ico{position:absolute;right:12px;top:12px;font-size:1.2rem;opacity:.12}
.sec-hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
.sec-t{font-family:'Fraunces',serif;font-size:1.15rem;font-weight:600;color:var(--text)}
.sec-lbl{font-size:.67rem;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px}
.alist{display:flex;flex-direction:column;gap:8px}
.acard{background:var(--card);border-radius:14px;padding:13px 15px;border:1.5px solid var(--border);display:flex;align-items:center;gap:11px;transition:all .18s}
.acard:hover{transform:translateY(-1px);box-shadow:0 6px 20px var(--sh);border-color:var(--border2)}
.acard.ov{border-color:#fca5a5;background:#fff8f8}
.dark .acard.ov{border-color:#7f1d1d;background:#170808}
.stripe{width:5px;border-radius:5px;align-self:stretch;min-height:40px;flex-shrink:0}
.amain{flex:1;min-width:0}
.atitle{font-weight:700;color:var(--text);font-size:.91rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:3px}
.ameta{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.mtag{font-size:.72rem;font-weight:700}
.ppill{font-size:.66rem;font-weight:700;padding:2px 8px;border-radius:20px}
.dbadge{font-size:.71rem;font-weight:700}
.pbar-wrap{width:88px;flex-shrink:0}
.pbar-track{height:6px;background:var(--bg3);border-radius:5px;overflow:hidden}
.pbar-fill{height:100%;border-radius:5px;transition:width .4s ease}
.plabel{font-size:.66rem;color:var(--text3);text-align:right;margin-top:2px;font-weight:700}
.qbtns{display:flex;gap:3px;margin-top:7px}
.qbtn{font-size:.65rem;padding:3px 7px;border-radius:6px;border:1.5px solid var(--border);background:var(--card);cursor:pointer;color:var(--text3);font-weight:700;transition:all .12s;font-family:'Plus Jakarta Sans',sans-serif}
.qbtn.on{background:var(--accent);color:#fff;border-color:var(--accent)}
.qbtn:hover:not(.on){background:var(--bg3);color:var(--text)}
.ibtn{width:28px;height:28px;border-radius:8px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.75rem;background:transparent;color:var(--text4);transition:all .15s;font-family:'Plus Jakarta Sans',sans-serif}
.ibtn:hover{background:#fef2f2;color:#dc2626}
.dark .ibtn:hover{background:#350000;color:#ff7070}
.sfilt{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px}
.sfbtn{padding:5px 13px;border-radius:20px;border:1.5px solid var(--border);background:var(--card);font-size:.75rem;font-weight:600;cursor:pointer;color:var(--text2);transition:all .12s;font-family:'Plus Jakarta Sans',sans-serif}
.sfbtn:hover{background:var(--bg3);color:var(--text)}
.btn{padding:8px 15px;border-radius:10px;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-weight:600;font-size:.81rem;transition:all .16s;display:inline-flex;align-items:center;gap:5px;letter-spacing:.01em}
.btn-p{background:var(--accent);color:#fff;box-shadow:0 1px 4px var(--sh)}
.btn-p:hover{background:var(--accent2);transform:translateY(-1px);box-shadow:0 4px 14px var(--sh2)}
.btn-g{background:var(--card);color:var(--text2);border:1.5px solid var(--border)}
.btn-g:hover{background:var(--bg3);color:var(--text);border-color:var(--border2)}
.btn-sm{padding:5px 11px;font-size:.75rem;border-radius:8px}
.overlay{position:fixed;inset:0;background:rgba(8,10,18,.55);backdrop-filter:blur(8px);z-index:100;display:flex;align-items:center;justify-content:center;padding:16px}
.modal{background:var(--mbg);border-radius:20px;padding:24px;width:100%;max-width:460px;max-height:92vh;overflow-y:auto;border:1.5px solid var(--border);box-shadow:0 20px 60px var(--sh2)}
.modal-t{font-family:'Fraunces',serif;font-size:1.2rem;font-weight:700;color:var(--text);margin-bottom:18px}
.fg{margin-bottom:12px}
.flbl{display:block;font-size:.67rem;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:5px}
.finp,.fsel,.ftxt{width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:10px;font-family:'Plus Jakarta Sans',sans-serif;font-size:.85rem;background:var(--ibg);color:var(--text);outline:none;transition:border-color .15s,box-shadow .15s}
.finp:focus,.fsel:focus,.ftxt:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--sh)}
.ftxt{resize:vertical;min-height:60px}
.frow{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.range{width:100%;accent-color:var(--accent)}
.mactions{display:flex;gap:8px;justify-content:flex-end;margin-top:18px}
.dtoggle{padding:6px 10px;border-radius:8px;border:1.5px solid var(--border);cursor:pointer;font-size:.76rem;font-weight:600;background:var(--card);color:var(--text2);transition:all .15s;font-family:'Plus Jakarta Sans',sans-serif}
.dtoggle.on{border-color:var(--accent);background:var(--accent);color:#fff}
.dtogglerow{display:flex;gap:5px;flex-wrap:wrap}
.swatches{display:flex;gap:7px;flex-wrap:wrap}
.swatch{width:26px;height:26px;border-radius:50%;cursor:pointer;border:2.5px solid transparent;transition:transform .1s}
.swatch.on{border-color:var(--text);transform:scale(1.18)}
.sched-layout{display:grid;grid-template-columns:270px 1fr;gap:18px;align-items:start}
.sc-classes{display:flex;flex-direction:column;gap:8px}
.sc-card{background:var(--card);border-radius:14px;padding:13px 15px;border:1.5px solid var(--border);display:flex;align-items:center;gap:11px;transition:box-shadow .15s}
.sc-card:hover{box-shadow:0 4px 16px var(--sh)}
.sc-dot{width:12px;height:12px;border-radius:50%;flex-shrink:0}
.sc-name{font-weight:700;color:var(--text);font-size:.88rem}
.sc-meta{font-size:.72rem;color:var(--text3);margin-top:2px;line-height:1.4}
.sc-badge{font-size:.66rem;font-weight:700;color:inherit;margin-top:2px}
.sgrid{background:var(--card);border-radius:16px;border:1.5px solid var(--border);overflow:auto;box-shadow:0 2px 12px var(--sh)}
.shdr{display:grid;grid-template-columns:48px repeat(7,1fr);background:var(--schdr);color:#fff;min-width:520px;border-radius:14px 14px 0 0}
.shcell{padding:10px 3px;text-align:center;font-size:.72rem;font-weight:700;letter-spacing:.04em}
.shcell.tdy{background:rgba(255,255,255,.13)}
.srow{display:grid;grid-template-columns:48px repeat(7,1fr);border-top:1px solid var(--border);min-height:40px;min-width:520px;transition:background .1s}
.srow:hover{background:var(--bg3)}
.stime{padding:4px 6px 0 0;font-size:.62rem;color:var(--text4);text-align:right;font-weight:600}
.scell{border-left:1px solid var(--border);position:relative;padding:1px 2px}
.scell.tdy{background:var(--tc)}
.cblock{border-radius:6px;padding:3px 5px;font-size:.64rem;font-weight:700;color:#fff;height:100%;display:flex;flex-direction:column;justify-content:center;line-height:1.3}
.dash-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.dcard{background:var(--card);border:1.5px solid var(--border);border-radius:18px;overflow:hidden;box-shadow:0 2px 12px var(--sh)}
.dcard-hdr{padding:13px 16px;border-bottom:1.5px solid var(--border);display:flex;align-items:center;gap:9px}
.dcard-title{font-family:'Fraunces',serif;font-size:1rem;font-weight:600;color:var(--text)}
.dcard-body{padding:10px 12px;display:flex;flex-direction:column;gap:7px;max-height:340px;overflow-y:auto}
.cacard{background:var(--bg3);border-radius:11px;padding:10px 12px;display:flex;align-items:center;gap:10px;transition:background .12s}
.cacard:hover{background:var(--bg4)}
.castripe{width:4px;border-radius:4px;align-self:stretch;min-height:30px;flex-shrink:0}
.catitle{font-weight:700;font-size:.86rem;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cadue{font-size:.7rem;font-weight:700;white-space:nowrap}
.tccard{display:flex;align-items:center;gap:10px;background:var(--bg3);border-radius:11px;padding:10px 12px}
.tcdot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
.tcname{font-weight:700;color:var(--text);font-size:.86rem}
.tctime{font-size:.72rem;color:var(--text3);margin-left:auto;white-space:nowrap;font-weight:700;text-align:right;line-height:1.4}
.tcroom{font-size:.68rem;color:var(--text4);margin-top:1px}
.pts-pill{display:inline-flex;align-items:center;gap:5px;background:#FFFBEB;border:1.5px solid #FDE68A;border-radius:20px;padding:5px 12px;font-size:.78rem;font-weight:700;color:#D97706}
.dark .pts-pill{background:#231800;border-color:#8A5000;color:#F59E0B}
.streak-pill{display:inline-flex;align-items:center;gap:5px;background:#FFF7F0;border:1.5px solid #FDDCB5;border-radius:20px;padding:5px 12px;font-size:.78rem;font-weight:700;color:#EA580C}
.dark .streak-pill{background:#200E00;border-color:#7A3000;color:#FB923C}
.pts-float{position:fixed;top:45%;left:50%;transform:translate(-50%,-50%);pointer-events:none;font-size:1.6rem;font-weight:900;animation:ptsFly 1.8s ease-out forwards;z-index:9999;text-shadow:0 2px 12px rgba(0,0,0,.2)}
@keyframes ptsFly{0%{opacity:1;transform:translate(-50%,-50%) scale(1.4)}100%{opacity:0;transform:translate(-50%,-200%) scale(.8)}}
.confetti-piece{position:fixed;pointer-events:none;z-index:9998;border-radius:3px;animation:confettiFall var(--dur,1.4s) ease-out forwards}
@keyframes confettiFall{0%{opacity:1;transform:translate(0,0) rotate(0deg) scale(1)}100%{opacity:0;transform:translate(var(--tx,0px),var(--ty,320px)) rotate(var(--rot,480deg)) scale(.4)}}
.submit-btn{padding:6px 13px;border-radius:9px;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.74rem;background:#16a34a;color:#fff;box-shadow:0 0 10px rgba(22,163,74,.5),0 0 20px rgba(22,163,74,.25);transition:all .18s;white-space:nowrap;flex-shrink:0}
.submit-btn:hover{background:#15803d;box-shadow:0 0 16px rgba(22,163,74,.7),0 0 32px rgba(22,163,74,.35);transform:translateY(-1px) scale(1.04)}
.submit-btn:active{transform:scale(.97)}
.submit-btn.done{background:#15803d;box-shadow:none;cursor:default;opacity:.7}
.submit-btn.compact{padding:4px 9px;font-size:.68rem;border-radius:7px;box-shadow:0 0 8px rgba(22,163,74,.45),0 0 14px rgba(22,163,74,.2)}
.quest-strip{background:linear-gradient(135deg,#FFFBEB,#FFF8D6);border:1.5px solid #FDE68A;border-radius:14px;padding:12px 16px;margin-bottom:18px;display:flex;align-items:center;gap:14px}
.dark .quest-strip{background:linear-gradient(135deg,#221600,#1A1200);border-color:#6A3800}
.qpip{width:34px;height:34px;border-radius:50%;border:2.5px solid #FDE68A;display:flex;align-items:center;justify-content:center;font-size:.9rem;background:var(--card);transition:all .3s}
.qpip.lit{background:#F59E0B;border-color:#F59E0B;box-shadow:0 2px 10px rgba(245,158,11,.4);color:#fff}
.buddy-wrap{display:flex;justify-content:center;margin:0 auto 4px;width:180px;height:200px}
.buddy-bounce{animation:bBounce 2.8s ease-in-out infinite}
@keyframes bBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
.buddy-shell{background:var(--card);border:1.5px solid var(--border);border-radius:20px;padding:20px;margin-bottom:16px;text-align:center}
.buddy-stage-name{font-family:'Fraunces',serif;font-size:1.3rem;font-weight:700;color:var(--text);margin-bottom:3px}
.buddy-stage-desc{font-size:.76rem;color:var(--text3);margin-bottom:14px}
.bpbar{height:8px;background:var(--bg3);border-radius:6px;overflow:hidden;margin:10px 0 5px}
.bpfill{height:100%;border-radius:6px;background:linear-gradient(90deg,#f5a623,#ffd060);transition:width .6s}
.bplbl{display:flex;justify-content:space-between;font-size:.68rem;color:var(--text4);font-weight:600;margin-bottom:14px}
.quest-card{background:linear-gradient(135deg,#FFFBEB,#FFF8D6);border:1.5px solid #FDE68A;border-radius:16px;padding:16px 18px;margin-bottom:14px}
.dark .quest-card{background:linear-gradient(135deg,#221600,#1A1200);border-color:#6A3800}
.quest-title{font-size:.68rem;font-weight:800;color:#D97706;text-transform:uppercase;letter-spacing:.08em;margin-bottom:3px}
.quest-text{font-size:.86rem;font-weight:600;color:var(--text);margin-bottom:12px}
.quest-pips{display:flex;gap:10px;align-items:center}
.quest-pip{width:42px;height:42px;border-radius:50%;border:2.5px solid #FDE68A;display:flex;align-items:center;justify-content:center;font-size:1.1rem;background:var(--card);transition:all .3s;font-weight:700}
.quest-pip.lit{background:#F59E0B;border-color:#F59E0B;box-shadow:0 2px 12px rgba(245,158,11,.4)}
.bstat-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
.pts-how{background:var(--bg3);border:1.5px solid var(--border);border-radius:14px;padding:14px 16px;margin-bottom:14px}
.pts-how-row{display:flex;justify-content:space-between;font-size:.82rem;align-items:center;padding:4px 0;color:var(--text2)}
.pts-how-amt{font-weight:700;color:#F59E0B;white-space:nowrap}
.shop-filter{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:14px}
.shop-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
.shop-card{background:var(--card);border:1.5px solid var(--border);border-radius:16px;padding:18px 14px 14px;text-align:center;transition:transform .18s,box-shadow .18s;position:relative}
.shop-card:hover{transform:translateY(-3px);box-shadow:0 8px 24px var(--sh2)}
.shop-card.owned{border-color:#BBF7D0;background:#F0FDF4}
.dark .shop-card.owned{border-color:#166534;background:#001508}
.shop-card.equipped{border-color:var(--accent);box-shadow:0 0 0 3px var(--sh2)}
.shop-badge{position:absolute;top:8px;right:8px;font-size:.58rem;font-weight:800;padding:2px 7px;border-radius:20px;color:#fff}
.shop-icon{font-size:2.6rem;margin-bottom:8px;display:block;line-height:1}
.shop-name{font-size:.84rem;font-weight:700;color:var(--text);margin-bottom:1px}
.shop-cat{font-size:.63rem;color:var(--text4);text-transform:uppercase;letter-spacing:.07em;font-weight:700;margin-bottom:4px}
.shop-desc{font-size:.73rem;color:var(--text3);margin-bottom:10px;line-height:1.4}
.eq-row{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-top:10px;min-height:20px}
.eq-chip{background:var(--bg3);border-radius:20px;padding:3px 10px;font-size:.72rem;font-weight:600;color:var(--text3)}
.release-overlay{position:fixed;inset:0;background:rgba(8,10,18,.62);backdrop-filter:blur(6px);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px}
.release-box{background:var(--mbg);border-radius:22px;width:100%;max-width:520px;max-height:88vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 60px var(--sh2);border:1.5px solid var(--border)}
.release-hd{padding:22px 24px 16px;border-bottom:1.5px solid var(--border);display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.release-title{font-family:'Fraunces',serif;font-size:1.35rem;font-weight:700;color:var(--text)}
.release-sub{font-size:.74rem;color:var(--text3);margin-top:3px}
.release-body{overflow-y:auto;padding:20px 24px;flex:1}
.release-entry{margin-bottom:24px}
.release-entry:last-child{margin-bottom:0}
.release-ver{display:inline-flex;align-items:center;gap:8px;margin-bottom:10px}
.release-badge{background:var(--accent);color:#fff;font-size:.7rem;font-weight:700;padding:3px 10px;border-radius:20px}
.release-date{font-size:.72rem;color:var(--text3);font-weight:500}
.release-name{font-size:.95rem;font-weight:700;color:var(--text);margin-bottom:8px}
.release-changes{display:flex;flex-direction:column;gap:5px}
.release-change{display:flex;gap:8px;font-size:.8rem;color:var(--text2);line-height:1.5}
.release-dot{color:#f5a623;font-size:.9rem;flex-shrink:0;margin-top:1px}
.about-body{padding:24px;overflow-y:auto;flex:1}
.about-hero{text-align:center;padding:8px 0 20px}
.about-logo{width:64px;height:64px;background:linear-gradient(135deg,var(--accent),var(--accent2));border-radius:18px;display:flex;align-items:center;justify-content:center;font-size:2rem;margin:0 auto 12px}
.about-name{font-family:'Fraunces',serif;font-size:1.6rem;font-weight:700;color:var(--text)}
.about-tagline{font-size:.82rem;color:var(--text3);margin-top:4px}
.about-section{margin-bottom:20px}
.about-section-title{font-size:.7rem;font-weight:700;color:var(--text3);letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px}
.about-card{background:var(--bg3);border:1.5px solid var(--border);border-radius:12px;padding:12px 14px;font-size:.82rem;color:var(--text2);line-height:1.7}
.about-feature{display:flex;gap:10px;align-items:flex-start;padding:7px 0;border-bottom:1px solid var(--border)}
.about-feature:last-child{border-bottom:none}
.about-feature-icon{font-size:1rem;flex-shrink:0;margin-top:1px}
.about-feature-text{font-size:.8rem;color:var(--text2);line-height:1.5}
.about-feature-text b{color:var(--text)}
.about-made{text-align:center;padding:16px 0 4px;font-size:.78rem;color:var(--text4)}
.about-made span{color:var(--text);font-weight:700}
.import-step{display:flex;align-items:flex-start;gap:9px;margin-bottom:11px}
.import-num{width:22px;height:22px;border-radius:50%;background:var(--accent);color:#fff;font-size:.68rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px}
.import-txt{font-size:.81rem;color:var(--text2);line-height:1.5}
.import-txt b{color:var(--text)}
.apreview{border:1.5px solid var(--border);border-radius:13px;overflow:hidden;margin-top:10px}
.apreview-hd{background:var(--accent);color:#fff;padding:8px 13px;font-size:.76rem;font-weight:600}
.apreview-list{max-height:210px;overflow-y:auto}
.apreview-item{display:flex;align-items:center;gap:8px;padding:8px 13px;border-bottom:1px solid var(--border)}
.apreview-item:last-child{border-bottom:none}
.apreview-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.apreview-name{font-size:.83rem;font-weight:600;color:var(--text);flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.apreview-due{font-size:.7rem;color:var(--text3);white-space:nowrap}
.spin{animation:spin .8s linear infinite;display:inline-block}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.85)}}
.cv-spin{animation:spin .8s linear infinite;display:inline-block}
@keyframes spin{to{transform:rotate(360deg)}}
.err-box{background:#fef2f2;border:1.5px solid #fca5a5;border-radius:10px;padding:10px 13px;font-size:.8rem;color:#dc2626;margin-top:8px;line-height:1.5}
.dark .err-box{background:#1c0000;border-color:#7f1d1d;color:#ff8080}
.success-box{background:#f0fdf4;border:1.5px solid #86efac;border-radius:10px;padding:10px 13px;font-size:.8rem;color:#16a34a;margin-top:6px;font-weight:600}
.dark .success-box{background:#001500;border-color:#166534;color:#4ade80}
.loading-box{display:flex;flex-direction:column;align-items:center;padding:30px;gap:12px;color:var(--text3)}
.loading-box p{font-size:.82rem;text-align:center;max-width:260px;line-height:1.5;color:var(--text2)}
.itabs{display:flex;gap:4px;background:var(--bg3);padding:4px;border-radius:11px;margin-bottom:16px}
.itab{flex:1;padding:7px 0;border-radius:8px;border:none;font-family:'Plus Jakarta Sans',sans-serif;font-size:.82rem;font-weight:600;color:var(--text3);cursor:pointer;transition:all .15s;background:transparent}
.itab.on{background:var(--accent);color:#fff}
.itab.canvas-on{background:#4338ca;color:#fff}
.itab.agenda-on{background:#ea580c;color:#fff}
.empty{text-align:center;padding:42px 20px;color:var(--text4)}
.empty-i{font-size:2.2rem;margin-bottom:10px}
.empty-t{font-family:'Fraunces',serif;font-size:1rem;color:var(--text4)}
.twocol{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.tclass{display:flex;flex-direction:column;gap:7px}
.clsrow{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:13px}
.clstag{display:flex;align-items:center;gap:5px;padding:4px 10px;background:var(--card);border-radius:9px;border:1.5px solid var(--border)}
.prompt-overlay{position:fixed;inset:0;background:rgba(8,10,18,.6);backdrop-filter:blur(6px);z-index:150;display:flex;align-items:center;justify-content:center;padding:16px}
.prompt-modal{background:var(--mbg);border-radius:20px;padding:24px;width:100%;max-width:420px;border:1.5px solid var(--border);box-shadow:0 20px 50px var(--sh2)}
@media(max-width:800px){.sched-layout{grid-template-columns:1fr}.dash-grid{grid-template-columns:1fr}.hdr-title{font-size:1.6rem}.pbar-wrap{display:none}.frow{grid-template-columns:1fr}.stats{grid-template-columns:repeat(auto-fit,minmax(110px,1fr))}}
.auth-page{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg);padding:20px}
.auth-card{background:var(--card);border:1.5px solid var(--border);border-radius:24px;padding:36px 32px;width:100%;max-width:420px;box-shadow:0 24px 60px var(--sh2)}
.auth-logo{width:56px;height:56px;background:linear-gradient(135deg,var(--text),var(--accent2));border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:1.8rem;margin:0 auto 16px}
.auth-title{font-family:'Fraunces',serif;font-size:1.7rem;font-weight:700;color:var(--text);text-align:center;margin-bottom:4px}
.auth-sub{font-size:.82rem;color:var(--text3);text-align:center;margin-bottom:24px}
.auth-tabs{display:grid;grid-template-columns:1fr 1fr;background:var(--bg3);border-radius:12px;padding:4px;margin-bottom:22px;gap:4px}
.auth-tab{padding:8px;border-radius:9px;border:none;font-family:'Plus Jakarta Sans',sans-serif;font-size:.84rem;font-weight:600;color:var(--text3);cursor:pointer;transition:all .15s;background:transparent}
.auth-tab.on{background:var(--card);color:var(--text);box-shadow:0 2px 8px var(--sh)}
.auth-divider{display:flex;align-items:center;gap:10px;margin:16px 0;color:var(--text4);font-size:.75rem;font-weight:600}
.auth-divider::before,.auth-divider::after{content:'';flex:1;height:1px;background:var(--border)}
.google-btn{width:100%;padding:11px;border-radius:12px;border:1.5px solid var(--border);background:var(--card);cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-size:.86rem;font-weight:600;color:var(--text);display:flex;align-items:center;justify-content:center;gap:10px;transition:all .15s;margin-bottom:4px}
.google-btn:hover{background:var(--bg3);border-color:var(--border2);transform:translateY(-1px);box-shadow:0 4px 14px var(--sh)}
.auth-btn{width:100%;padding:12px;border-radius:12px;border:none;background:var(--accent);color:#fff;font-family:'Plus Jakarta Sans',sans-serif;font-size:.88rem;font-weight:700;cursor:pointer;transition:all .18s;margin-top:4px}
.auth-btn:hover{background:var(--accent2);transform:translateY(-1px);box-shadow:0 4px 18px var(--sh2)}
.auth-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
.auth-err{background:#fef2f2;border:1.5px solid #fca5a5;border-radius:10px;padding:10px 13px;font-size:.8rem;color:#dc2626;margin-top:10px;line-height:1.5}
.dark .auth-err{background:#350000;border-color:#7f1d1d;color:#f87171}
.auth-user-pill{display:flex;align-items:center;gap:7px;background:var(--bg3);border:1.5px solid var(--border);border-radius:20px;padding:4px 10px 4px 6px;font-size:.75rem;font-weight:600;color:var(--text2)}
.auth-avatar{width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:700;color:#fff;flex-shrink:0;overflow:hidden}

.prompt-overlay{position:fixed;inset:0;background:rgba(8,10,18,.5);backdrop-filter:blur(6px);z-index:150;display:flex;align-items:center;justify-content:center;padding:16px}
.prompt-card{background:var(--mbg);border-radius:20px;padding:24px;width:100%;max-width:400px;border:1.5px solid var(--border);box-shadow:0 24px 60px var(--sh2);animation:slideUp .28s cubic-bezier(.34,1.56,.64,1) forwards}
@keyframes slideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
.prompt-icon{font-size:2.2rem;margin-bottom:12px;display:block;text-align:center}
.prompt-title{font-family:'Fraunces',serif;font-size:1.1rem;font-weight:700;color:var(--text);margin-bottom:6px;text-align:center}
.prompt-body{font-size:.82rem;color:var(--text2);line-height:1.6;text-align:center;margin-bottom:20px}
.prompt-body b{color:var(--text)}

`;


function CopyBtn({text}){
  const [copied,setCopied]=useState(false);
  return(
    <button onClick={()=>{navigator.clipboard.writeText(text).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});}}
      style={{position:"absolute",top:5,right:5,background:copied?"#16a34a":"#4338ca",color:"#fff",border:"none",borderRadius:5,padding:"3px 8px",fontSize:".65rem",fontWeight:700,cursor:"pointer",fontFamily:"sans-serif"}}>
      {copied?"✅ Copied!":"📋 Copy"}
    </button>
  );
}

function FetcherCopyBox({html}){
  const [copied,setCopied]=useState(false);
  return(
    <div style={{marginBottom:14}}>
      <div style={{position:"relative"}}>
        <textarea readOnly value={html}
          style={{width:"100%",height:90,fontFamily:"monospace",fontSize:".62rem",borderRadius:9,border:"1.5px solid #c7d2fe",padding:"8px 10px",background:"#f8f8ff",color:"#333",resize:"none",boxSizing:"border-box"}}/>
        <button onClick={()=>{navigator.clipboard.writeText(html).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),3000);});}}
          style={{position:"absolute",top:6,right:6,background:copied?"#16a34a":"#4338ca",color:"#fff",border:"none",borderRadius:6,padding:"4px 10px",fontSize:".72rem",fontWeight:700,cursor:"pointer"}}>
          {copied?"✅ Copied!":"📋 Copy All"}
        </button>
      </div>
      <div style={{fontSize:".72rem",color:"#888",marginTop:6,lineHeight:1.6}}>
        1. Click <b>Copy All</b> above<br/>
        2. Open <b>Notepad</b> (Windows) or <b>TextEdit</b> (Mac)<br/>
        3. Paste and save as <b>agenda-fetcher.html</b><br/>
        4. Open that file in Chrome/Edge while logged into Google
      </div>
    </div>
  );
}

function BuddyCreature({stage,eq={}}){
  const s=Math.min(stage,5);
  const cfg=[
    {fill:"#FFF0CC",sk:"#D4A850",ec:"#8B6340",mood:"sleep",path:"M100 72 C145 72 165 108 163 148 C161 188 144 218 100 218 C56 218 39 188 37 148 C35 108 55 72 100 72Z"},
    {fill:"#B8EAFF",sk:"#64C8F0",ec:"#0055AA",mood:"happy",path:"M100 84 C138 84 156 112 156 142 C156 172 138 198 100 198 C62 198 44 172 44 142 C44 112 62 84 100 84Z"},
    {fill:"#4ECDE8",sk:"#1AB0D0",ec:"#005A7A",mood:"happy",path:"M100 78 C144 78 165 108 164 142 C163 176 144 204 100 204 C56 204 37 176 36 142 C35 108 56 78 100 78Z"},
    {fill:"#1AACB0",sk:"#0A8A8A",ec:"#004050",mood:"cool",path:"M100 74 C150 74 174 106 173 142 C172 178 150 208 100 208 C50 208 28 178 27 142 C26 106 50 74 100 74Z"},
    {fill:"#C472E8",sk:"#9030C8",ec:"#3D0070",mood:"power",path:"M100 70 C155 70 180 104 180 142 C180 180 155 212 100 212 C45 212 20 180 20 142 C20 104 45 70 100 70Z"},
    {fill:"#FFB840",sk:"#E07800",ec:"#703000",mood:"legend",path:"M76 72 C72 54 90 48 100 58 C110 48 128 54 124 72 C162 74 184 106 184 142 C184 178 162 212 100 212 C38 212 16 178 16 142 C16 106 38 74 76 72Z"},
  ][s];
  const{fill,sk,ec,mood,path}=cfg;
  const ey=139-s*2,elx=78,erx=122,er=8+s*1.2,my=ey+28+s;
  const hatY=parseInt(path.match(/M\d+ (\d+)/)[1])-2;
  return(
    <svg viewBox="0 0 200 240" style={{width:"100%",height:"100%",overflow:"visible",filter:s>=4?"drop-shadow(0 0 16px "+sk+")":"none"}}>
      <defs>
        <radialGradient id={"bg"+s} cx="40%" cy="35%" r="65%"><stop offset="0%" stopColor="#fff" stopOpacity="0.25"/><stop offset="100%" stopColor="#000" stopOpacity="0"/></radialGradient>
        <linearGradient id="rG" x1="0%" y1="0%" x2="100%" y2="0%">{["#F00","#F80","#FF0","#0C0","#00F","#90C"].map((c,i)=><stop key={i} offset={i*20+"%"} stopColor={c}/>)}</linearGradient>
      </defs>
      {eq.special==="wings"&&<><ellipse cx="24" cy={ey+14} rx="22" ry="36" fill="#C8F5D8" stroke="#60D898" strokeWidth="2" transform={"rotate(-20 24 "+(ey+14)+")"} opacity="0.9"/><ellipse cx="176" cy={ey+14} rx="22" ry="36" fill="#C8F5D8" stroke="#60D898" strokeWidth="2" transform={"rotate(20 176 "+(ey+14)+")"} opacity="0.9"/></>}
      {eq.special==="rainbow"&&<path d={"M5 "+(my+55)+" Q100 "+(ey-90)+" 195 "+(my+55)} fill="none" stroke="url(#rG)" strokeWidth="10" strokeLinecap="round" opacity="0.55"/>}
      {eq.body==="cape"&&<path d={"M"+(elx+2)+","+(ey-10)+" L"+(elx-22)+","+(my+55)+" Q100,"+(my+72)+" "+(erx+22)+","+(my+55)+" L"+(erx-2)+","+(ey-10)+"Z"} fill="#6820B0" stroke="#4A10A0" strokeWidth="2" opacity="0.9"/>}
      <path d={path} fill={fill} stroke={sk} strokeWidth="3.5"/><path d={path} fill={"url(#bg"+s+")"}/>
      <ellipse cx="107" cy={my+4} rx="19" ry="13" fill="white" opacity="0.16"/>
      {s>=1&&s<=3&&<><ellipse cx={elx-15} cy={ey+20} rx="11" ry="7" fill="#FF7FA8" opacity="0.38"/><ellipse cx={erx+15} cy={ey+20} rx="11" ry="7" fill="#FF7FA8" opacity="0.38"/></>}
      {s===5&&<><text x="16" y="54" fontSize="14" opacity="0.8" fill="#FFD700">✦</text><text x="166" y="48" fontSize="10" opacity="0.7" fill="#FFD700">✦</text><text x="12" y="185" fontSize="10" opacity="0.6" fill="#FFD700">✦</text><text x="168" y="192" fontSize="13" opacity="0.75" fill="#FFD700">✦</text></>}
      {mood==="sleep"?<><path d={"M"+(elx-9)+" "+ey+" Q"+elx+" "+(ey-10)+" "+(elx+9)+" "+ey} fill="none" stroke={ec} strokeWidth="3.5" strokeLinecap="round"/><path d={"M"+(erx-9)+" "+ey+" Q"+erx+" "+(ey-10)+" "+(erx+9)+" "+ey} fill="none" stroke={ec} strokeWidth="3.5" strokeLinecap="round"/><text x="110" y={ey-4} fontSize="10" fill={ec} opacity="0.6">z</text><text x="121" y={ey-12} fontSize="7" fill={ec} opacity="0.4">z</text></>
      :<><circle cx={elx} cy={ey} r={er} fill="white"/><circle cx={elx+1} cy={ey+1} r={er*0.62} fill={ec}/><circle cx={elx-er*0.28} cy={ey-er*0.28} r={er*0.22} fill="white"/><circle cx={erx} cy={ey} r={er} fill="white"/><circle cx={erx+1} cy={ey+1} r={er*0.62} fill={ec}/><circle cx={erx-er*0.28} cy={ey-er*0.28} r={er*0.22} fill="white"/>{(mood==="power"||mood==="legend")&&<><circle cx={elx} cy={ey} r={er+1.5} fill="none" stroke={sk} strokeWidth="2" opacity="0.4"/><circle cx={erx} cy={ey} r={er+1.5} fill="none" stroke={sk} strokeWidth="2" opacity="0.4"/></>}{mood==="cool"&&<><path d={"M"+(elx-er)+" "+(ey-er-4)+" Q"+elx+" "+(ey-er-11)+" "+(elx+er)+" "+(ey-er-4)} fill="none" stroke={ec} strokeWidth="2.5" strokeLinecap="round"/><path d={"M"+(erx-er)+" "+(ey-er-4)+" Q"+erx+" "+(ey-er-11)+" "+(erx+er)+" "+(ey-er-4)} fill="none" stroke={ec} strokeWidth="2.5" strokeLinecap="round"/></>}</>}
      {eq.face==="sunglasses"&&<><rect x={elx-er-3} y={ey-er-2} width={(er+3)*2} height={(er+3)*2} rx={er+3} fill="rgba(0,0,0,0.82)"/><rect x={erx-er-3} y={ey-er-2} width={(er+3)*2} height={(er+3)*2} rx={er+3} fill="rgba(0,0,0,0.82)"/><rect x={elx+er+1} y={ey-1.5} width={erx-elx-er*2-2} height="3" fill="#111"/></>}
      {eq.face==="heart_eyes"&&[elx,erx].map((cx2,ki)=><path key={ki} d={"M"+cx2+" "+(ey-2)+" C"+(cx2-er*1.1)+" "+(ey-er*1.5)+" "+(cx2-er*1.7)+" "+(ey-2)+" "+cx2+" "+(ey+er*0.9)+" C"+(cx2+er*1.7)+" "+(ey-2)+" "+(cx2+er*1.1)+" "+(ey-er*1.5)+" "+cx2+" "+(ey-2)+"Z"} fill="#FF3D7F" opacity="0.9"/>)}
      {eq.face==="monocle"&&<><circle cx={erx} cy={ey} r={er+4} fill="none" stroke="#9B8030" strokeWidth="2.5"/><line x1={erx+er+4} y1={ey+er+4} x2={erx+er+10} y2={ey+er+18} stroke="#9B8030" strokeWidth="2"/></>}
      {mood!=="sleep"&&(mood==="cool"?<path d={"M"+(100-13)+" "+my+" Q100 "+(my+10)+" "+(100+13)+" "+my} fill="none" stroke={ec} strokeWidth="3" strokeLinecap="round"/>:<path d={"M"+(100-16)+" "+my+" Q100 "+(my+16)+" "+(100+16)+" "+my} fill="none" stroke={ec} strokeWidth="3" strokeLinecap="round"/>)}
      {eq.body==="bow_tie"&&<><polygon points={(100-21)+","+(my+16)+" "+(100-6)+","+(my+24)+" "+(100-21)+","+(my+32)} fill="#FF4D8A" stroke="#D0306A" strokeWidth="1.5"/><polygon points={(100+21)+","+(my+16)+" "+(100+6)+","+(my+24)+" "+(100+21)+","+(my+32)} fill="#FF4D8A" stroke="#D0306A" strokeWidth="1.5"/><circle cx="100" cy={my+24} r="5.5" fill="#FF6BA8"/></>}
      {eq.hat==="party_hat"&&<><polygon points={"100,"+(hatY-48)+" "+(100-30)+","+(hatY-2)+" "+(100+30)+","+(hatY-2)} fill="#FF6BA8" stroke="#D0356E" strokeWidth="2"/><rect x={100-32} y={hatY-8} width="64" height="10" rx="5" fill="#FFC0D8" opacity="0.7"/><circle cx="100" cy={hatY-52} r="5.5" fill="#FFD700"/></>}
      {eq.hat==="crown"&&<><path d={"M"+(100-34)+","+hatY+" L"+(100-34)+","+(hatY-32)+" L"+(100-17)+","+(hatY-19)+" L100,"+(hatY-40)+" L"+(100+17)+","+(hatY-19)+" L"+(100+34)+","+(hatY-32)+" L"+(100+34)+","+hatY+"Z"} fill="#FFD700" stroke="#DAA520" strokeWidth="2.5"/><circle cx={100-17} cy={hatY-19} r="3.5" fill="#FF3333"/><circle cx="100" cy={hatY-40} r="3.5" fill="#4488FF"/><circle cx={100+17} cy={hatY-19} r="3.5" fill="#33CC33"/></>}
      {eq.hat==="wizard_hat"&&<><polygon points={"100,"+(hatY-60)+" "+(100-36)+","+(hatY-2)+" "+(100+36)+","+(hatY-2)} fill="#3A0090" stroke="#7030C0" strokeWidth="2.5"/><ellipse cx="100" cy={hatY-2} rx="40" ry="9" fill="#3A0090" stroke="#7030C0" strokeWidth="2.5"/><text x="88" y={hatY-30} fontSize="13" fill="#FFD700" opacity="0.9">✦</text></>}
      {eq.hat==="santa_hat"&&<><polygon points={"100,"+(hatY-56)+" "+(100-34)+","+(hatY-2)+" "+(100+34)+","+(hatY-2)} fill="#CC0000" stroke="#AA0000" strokeWidth="2"/><rect x={100-36} y={hatY-11} width="72" height="14" rx="7" fill="white"/><circle cx="100" cy={hatY-60} r="8" fill="white"/></>}
      {eq.special==="halo"&&<ellipse cx="100" cy={hatY-22} rx="30" ry="9" fill="rgba(255,220,50,0.75)" stroke="#FFD700" strokeWidth="3.5"/>}
    </svg>
  );
}
function AuthScreen({onAuth, adminMode=false, adminEmail=""}){
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  // Email verification state
  const [verifyStep, setVerifyStep] = useState(false); // true = showing verify screen
  const [verifyUser, setVerifyUser] = useState(null);  // temp user object while verifying
  const [verifyPolling, setVerifyPolling] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const pollRef = useRef(null);

  async function handleReset(){
    if(!resetEmail){setErr("Enter your email first.");return;}
    setResetLoading(true);setErr("");
    try{
      await fbResetPassword(resetEmail);
      setResetSent(true);
    } catch(e){
      if(e.message==="PREVIEW_MODE") setErr("Password reset emails work on the deployed app, not in the preview.");
      else {
        const msgs={"EMAIL_NOT_FOUND":"No account found with that email.","INVALID_EMAIL":"Please enter a valid email."};
        setErr(msgs[e.message]||e.message);
      }
    }
    setResetLoading(false);
  }
  const [darkMode] = useState(()=>{try{return localStorage.getItem("sd-dark")==="1";}catch{return false;}});

  function startResendCooldown(){
    setResendCooldown(60);
    const t=setInterval(()=>setResendCooldown(c=>{if(c<=1){clearInterval(t);return 0;}return c-1;}),1000);
  }

  async function checkVerified(u, manual=false){
    try{
      const verified=await fbCheckEmailVerified(u.idToken);
      if(verified){
        clearInterval(pollRef.current);
        setVerifyPolling(false);
        fbSetSession(u);
        fbIncrementStat("totalUsers",1,u.idToken);
        onAuth(u);
        return true;
      } else if(manual){
        setErr("Email not verified yet — make sure you clicked the link in your inbox.");
      }
    }catch(e){
      if(manual) setErr("Couldn't check verification status. Try again.");
    }
    return false;
  }

  function startPolling(u){
    setVerifyPolling(true);
    // Poll every 5 seconds — less aggressive than 3s
    pollRef.current=setInterval(()=>checkVerified(u), 5000);
  }

  async function handleResend(){
    if(resendCooldown>0||!verifyUser)return;
    setResendLoading(true);
    try{
      await fbSendVerificationEmail(verifyUser.idToken);
      startResendCooldown();
    }catch(e){setErr(e.message);}
    setResendLoading(false);
  }

  async function handleCancelVerify(){
    clearInterval(pollRef.current);
    if(verifyUser){try{await fbDeleteAccount(verifyUser.idToken);}catch{}}
    setVerifyStep(false);setVerifyUser(null);setErr("");
  }

  async function handleSubmit(){
    if(!email||!password)return;
    if(mode==="signup"){
      if(!name){setErr("Please enter your name.");return;}
      if(password!==confirmPassword){setErr("Passwords don't match.");return;}
      if(password.length<6){setErr("Password must be at least 6 characters.");return;}
    }
    setLoading(true);setErr("");
    try{
      let user;
      if(mode==="login"){
        user=await fbSignIn(email,password);
        fbSetSession(user);
        onAuth(user);
      } else {
        // Create account, send verification email, show verify screen
        user=await fbSignUp(email,password,name);
        await fbSendVerificationEmail(user.idToken);
        setVerifyUser(user);
        setVerifyStep(true);
        startResendCooldown();
        startPolling(user);
      }
    } catch(e){
      const msgs={
        "EMAIL_NOT_FOUND":"No account found with that email.",
        "INVALID_PASSWORD":"Incorrect password.",
        "EMAIL_EXISTS":"An account with this email already exists.",
        "WEAK_PASSWORD : Password should be at least 6 characters":"Password must be at least 6 characters.",
        "INVALID_EMAIL":"Please enter a valid email address.",
        "INVALID_LOGIN_CREDENTIALS":"Incorrect email or password.",
      };
      setErr(msgs[e.message]||e.message);
    }
    setLoading(false);
  }

  async function handleGoogle(){
    setLoading(true); setErr("");
    try{
      const result = await fbGoogleSignIn();
      // Exchange Google ID token with Firebase signInWithIdp
      const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${FB_KEY}`,{
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          requestUri:"http://localhost",
          postBody:`id_token=${result.idToken}&providerId=google.com`,
          returnSecureToken:true,
          returnIdpCredential:true
        })
      });
      const d = await r.json();
      if(d.error) throw new Error(d.error.message);
      const u={uid:d.localId,email:d.email,displayName:d.displayName||null,idToken:d.idToken,photoURL:d.photoUrl||null};
      fbSetSession(u);
      onAuth(u);
    } catch(e){
      if(e.message!=="Popup closed"&&e.message!=="No credential returned"){
        setErr(e.message||"Google sign-in failed.");
      }
    }
    setLoading(false);
  }

  const bg   = darkMode ? "#0F1117" : "#F5F2EC";
  const card = darkMode ? "#161921" : "#FFFFFF";
  const bd   = darkMode ? "#262B3C" : "#E2DDD6";
  const txt  = darkMode ? "#DDE2F5" : "#1B1F3B";
  const txt3 = darkMode ? "#5C6480" : "#888888";
  const txt4 = darkMode ? "#353C58" : "#bbbbbb";
  const bg3  = darkMode ? "#1C1F2B" : "#F0EDE7";
  const acc  = darkMode ? "#7B83F7" : "#1B1F3B";
  const acc2 = darkMode ? "#9199FF" : "#2d3260";
  const sh2  = darkMode ? "rgba(0,0,0,.5)" : "rgba(27,31,59,.14)";

  const inp = {width:"100%",padding:"10px 13px",border:`1.5px solid ${bd}`,borderRadius:11,fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:".88rem",background:card,color:txt,outline:"none",transition:"border-color .15s",marginTop:5,boxSizing:"border-box"};
  const lbl = {display:"block",fontSize:".68rem",fontWeight:800,color:txt3,textTransform:"uppercase",letterSpacing:".07em",marginBottom:2};

  return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:bg,padding:20,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}`}</style>

      <div style={{background:card,border:`1.5px solid ${bd}`,borderRadius:24,padding:"36px 32px",width:"100%",maxWidth:420,boxShadow:`0 24px 60px ${sh2}`}}>

        {/* Logo + title */}
        <div style={{width:56,height:56,background:`linear-gradient(135deg,${txt},${acc2})`,borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.8rem",margin:"0 auto 16px"}}>📚</div>
        <div style={{fontFamily:"'Fraunces',serif",fontSize:"1.75rem",fontWeight:700,color:txt,textAlign:"center",marginBottom:4}}>Study Desk</div>
        <div style={{fontSize:".83rem",color:txt3,textAlign:"center",marginBottom:adminMode?12:24}}>{mode==="login"?"Welcome back! Sign in to continue.":"Create your free account."}</div>
        {adminMode&&(
          <div style={{background:darkMode?"#1e1b4b":"#eef2ff",border:`1.5px solid ${darkMode?"#4338ca":"#c7d2fe"}`,borderRadius:12,padding:"10px 14px",marginBottom:20,textAlign:"center"}}>
            <div style={{fontSize:".78rem",fontWeight:700,color:darkMode?"#a5b4fc":"#4338ca"}}>🔐 Admin Access Only</div>
          </div>
        )}

        {/* Sign in / Sign up toggle */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",background:bg3,borderRadius:12,padding:4,marginBottom:22,gap:4}}>
          {["login","signup"].map(m=>(
            <button key={m} onClick={()=>{setMode(m);setErr("");setConfirmPassword("");}} style={{padding:"9px 0",borderRadius:9,border:"none",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:".84rem",fontWeight:600,cursor:"pointer",transition:"all .15s",
              background:mode===m?card:"transparent",color:mode===m?txt:txt3,
              boxShadow:mode===m?`0 2px 8px ${sh2}`:"none"}}>
              {m==="login"?"Sign In":"Sign Up"}
            </button>
          ))}
        </div>

        {/* Google button */}
        <button onClick={handleGoogle} disabled={loading} style={{width:"100%",padding:"11px 0",borderRadius:12,border:`1.5px solid ${bd}`,background:card,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:".86rem",fontWeight:600,color:txt,display:"flex",alignItems:"center",justifyContent:"center",gap:10,transition:"all .15s",marginBottom:4}}>
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.8 2.5 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.8 6C12.2 13 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17z"/><path fill="#FBBC05" d="M10.4 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.8-6z"/><path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.2-7.7 2.2-6.3 0-11.6-4.2-13.6-10l-7.8 6C6.6 42.6 14.6 48 24 48z"/></svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div style={{display:"flex",alignItems:"center",gap:10,margin:"14px 0",color:txt4,fontSize:".74rem",fontWeight:600}}>
          <div style={{flex:1,height:1,background:bd}}/>or<div style={{flex:1,height:1,background:bd}}/>
        </div>

        {/* Fields */}
        {mode==="signup"&&(
          <div style={{marginBottom:12}}>
            <label style={lbl}>Your Name</label>
            <input style={inp} value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Alex" onKeyDown={e=>e.key==="Enter"&&handleSubmit()}/>
          </div>
        )}
        <div style={{marginBottom:12}}>
          <label style={lbl}>Email</label>
          <input style={inp} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com" onKeyDown={e=>e.key==="Enter"&&handleSubmit()}/>
        </div>
        {/* Email verification screen — overlays the form */}
        {verifyStep&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(4px)"}}>
            <div style={{background:card,border:`1.5px solid ${bd}`,borderRadius:24,padding:"36px 32px",width:"100%",maxWidth:400,boxShadow:`0 24px 60px ${sh2}`,textAlign:"center"}}>
              <div style={{fontSize:"3rem",marginBottom:16}}>📬</div>
              <div style={{fontFamily:"'Fraunces',serif",fontSize:"1.3rem",fontWeight:700,color:txt,marginBottom:8}}>Check your email</div>
              <div style={{fontSize:".83rem",color:txt3,lineHeight:1.7,marginBottom:6}}>
                We sent a verification link to
              </div>
              <div style={{fontWeight:700,color:txt,fontSize:".9rem",marginBottom:20,padding:"8px 14px",background:bg3,borderRadius:10,display:"inline-block"}}>{email}</div>
              <div style={{fontSize:".78rem",color:txt3,marginBottom:24,lineHeight:1.6}}>
                Click the link in the email to verify your account. This page will update automatically once verified.
              </div>
              {/* Steps */}
              <div style={{textAlign:"left",marginBottom:20,background:bg3,borderRadius:12,padding:"12px 14px"}}>
                {[
                  "Open the email from StudyDesk in your inbox",
                  "Click the verification link inside it",
                  "Come back here — you'll be signed in automatically",
                ].map((t,i)=>(
                  <div key={i} style={{display:"flex",gap:10,alignItems:"center",marginBottom:i<2?8:0}}>
                    <div style={{width:20,height:20,borderRadius:"50%",background:acc,color:"#fff",fontSize:".65rem",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{i+1}</div>
                    <div style={{fontSize:".78rem",color:txt}}>{t}</div>
                  </div>
                ))}
              </div>
              {/* Polling indicator */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:16,fontSize:".75rem",color:txt3}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:"#10b981",animation:"pulse 1.5s ease-in-out infinite"}}/>
                Checking automatically every 5 seconds...
              </div>
              {err&&<div style={{background:darkMode?"#350000":"#fef2f2",border:`1.5px solid ${darkMode?"#7f1d1d":"#fca5a5"}`,borderRadius:10,padding:"9px 12px",fontSize:".78rem",color:darkMode?"#f87171":"#dc2626",marginBottom:14,textAlign:"left"}}>{err}</div>}
              <div style={{display:"flex",gap:8,flexDirection:"column"}}>
                <button onClick={()=>{setErr("");checkVerified(verifyUser,true);}}
                  style={{width:"100%",padding:"12px",borderRadius:11,border:"none",background:acc,color:"#fff",fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:".88rem",cursor:"pointer"}}>
                  ✓ I've clicked the link
                </button>
                <button onClick={handleResend} disabled={resendCooldown>0||resendLoading}
                  style={{width:"100%",padding:"10px",borderRadius:11,border:`1.5px solid ${bd}`,background:"transparent",color:resendCooldown>0?txt3:acc,fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:600,fontSize:".83rem",cursor:resendCooldown>0?"not-allowed":"pointer"}}>
                  {resendLoading?"Sending...":`📨 Resend Email${resendCooldown>0?` (${resendCooldown}s)`:""}`}
                </button>
                <button onClick={handleCancelVerify}
                  style={{width:"100%",padding:"8px",borderRadius:11,border:"none",background:"transparent",color:txt3,fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:500,fontSize:".78rem",cursor:"pointer",textDecoration:"underline"}}>
                  Cancel & use a different email
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
            <label style={lbl}>Password</label>
            {mode==="login"&&<button onClick={()=>{setShowReset(true);setResetEmail(email);setErr("");setResetSent(false);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:".72rem",color:acc,fontWeight:600,padding:0,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Forgot password?</button>}
          </div>
          <input style={inp} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&handleSubmit()}/>
        </div>
        {mode==="signup"&&(
          <div style={{marginBottom:8}}>
            <label style={lbl}>Confirm Password</label>
            <input style={{...inp,borderColor:confirmPassword&&confirmPassword!==password?"#ef4444":bd}} type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&handleSubmit()}/>
            {confirmPassword&&confirmPassword!==password&&<div style={{fontSize:".72rem",color:"#ef4444",marginTop:4}}>Passwords don't match</div>}
          </div>
        )}

        {/* Forgot password modal */}
        {showReset&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(4px)"}}
            onClick={e=>{if(e.target===e.currentTarget){setShowReset(false);setResetSent(false);}}}>
            <div style={{background:card,border:`1.5px solid ${bd}`,borderRadius:20,padding:"28px 28px 24px",width:"100%",maxWidth:380,boxShadow:`0 24px 60px ${sh2}`}}>
              {resetSent?(
                <>
                  <div style={{fontSize:"2rem",textAlign:"center",marginBottom:10}}>📬</div>
                  <div style={{fontWeight:700,color:txt,fontSize:"1.05rem",textAlign:"center",marginBottom:8}}>Check your inbox!</div>
                  <div style={{color:txt3,fontSize:".82rem",textAlign:"center",lineHeight:1.6,marginBottom:20}}>
                    <>We sent a password reset link to <strong style={{color:txt}}>{resetEmail}</strong>. Check your spam folder if you don't see it.</>
                  </div>
                  <button onClick={()=>{setShowReset(false);setResetSent(false);}} style={{width:"100%",padding:"11px",borderRadius:11,border:"none",background:acc,color:"#fff",fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:".88rem",cursor:"pointer"}}>Back to Sign In</button>
                </>
              ):(
                <>
                  <div style={{fontWeight:700,color:txt,fontSize:"1.05rem",marginBottom:6}}>🔑 Reset Password</div>
                  <div style={{color:txt3,fontSize:".8rem",marginBottom:16,lineHeight:1.5}}>Enter your email and we'll send you a link to reset your password.</div>
                  <label style={lbl}>Email</label>
                  <input style={{...inp,marginBottom:10}} type="email" value={resetEmail} onChange={e=>setResetEmail(e.target.value)} placeholder="you@email.com" autoFocus onKeyDown={e=>e.key==="Enter"&&handleReset()}/>
                  {err&&<div style={{background:darkMode?"#350000":"#fef2f2",border:`1.5px solid ${darkMode?"#7f1d1d":"#fca5a5"}`,borderRadius:10,padding:"9px 12px",fontSize:".78rem",color:darkMode?"#f87171":"#dc2626",marginBottom:10}}>{err}</div>}
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>{setShowReset(false);setErr("");}} style={{flex:1,padding:"10px",borderRadius:11,border:`1.5px solid ${bd}`,background:"transparent",color:txt,fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:600,fontSize:".84rem",cursor:"pointer"}}>Cancel</button>
                    <button onClick={handleReset} disabled={resetLoading||!resetEmail} style={{flex:2,padding:"10px",borderRadius:11,border:"none",background:resetLoading||!resetEmail?"#ccc":acc,color:"#fff",fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:".84rem",cursor:resetLoading||!resetEmail?"not-allowed":"pointer"}}>
                      {resetLoading?"Sending...":"Send Reset Link →"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {err&&<div style={{background:darkMode?"#350000":"#fef2f2",border:`1.5px solid ${darkMode?"#7f1d1d":"#fca5a5"}`,borderRadius:10,padding:"10px 13px",fontSize:".8rem",color:darkMode?"#f87171":"#dc2626",marginBottom:10,lineHeight:1.5}}>{err}</div>}

        {/* Submit */}
        <button onClick={handleSubmit} disabled={loading||!email||!password}
          style={{width:"100%",padding:"12px 0",borderRadius:12,border:"none",background:(!loading&&email&&password)?acc:"#ccc",color:"#fff",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:".9rem",fontWeight:700,cursor:(!loading&&email&&password)?"pointer":"not-allowed",transition:"all .18s",marginTop:4}}>
          {loading?"Loading...":(mode==="login"?"Sign In →":"Create Account →")}
        </button>

      </div>
    </div>
  );
}

function AdminPanel({user, onClose, inline=false}){
  const [pass, setPass] = useState("");
  const [authed, setAuthed] = useState(inline);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setPassErr] = useState("");
  const [deletingUser, setDeletingUser] = useState(null);
  const [darkMode] = useState(()=>{try{return localStorage.getItem("sd-dark")==="1";}catch{return false;}});

  const bg=darkMode?"#0F1117":"#F5F2EC", card=darkMode?"#161921":"#fff", bd=darkMode?"#262B3C":"#E2DDD6";
  const txt=darkMode?"#DDE2F5":"#1B1F3B", txt3=darkMode?"#5C6480":"#888", bg3=darkMode?"#1C1F2B":"#F0EDE7";
  const sh=darkMode?"rgba(0,0,0,.5)":"rgba(27,31,59,.14)";

  async function loadStats(){
    setLoading(true);
    const s=await fbGetAdminStats(user.idToken);
    setStats(s);setLoading(false);
  }
  useEffect(()=>{ if(inline&&user) loadStats(); },[]);

  function tryLogin(){
    if(pass===ADMIN_PASS){setAuthed(true);loadStats();}
    else setPassErr("Wrong password.");
  }

  const completionRate = stats && stats.totalAssignments>0
    ? Math.round((stats.totalSubmitted/stats.totalAssignments)*100) : 0;

  const STAT_CARDS=[
    {label:"Total Users",value:stats?.totalUsers??"-",icon:"👤",color:"#6366f1"},
    {label:"Online Now",value:stats?.onlineNow??"-",icon:"🟢",color:"#10b981"},
    {label:"New Today",value:stats?.newUsersToday??"-",icon:"✨",color:"#f59e0b"},
    {label:"Assignments Created",value:stats?.totalAssignments??"-",icon:"📝",color:"#3b82f6"},
    {label:"Submitted",value:stats?.totalSubmitted??"-",icon:"✅",color:"#16a34a"},
    {label:"Completion Rate",value:stats?completionRate+"%":"-",icon:"📊",color:"#8b5cf6"},
    {label:"Classes Created",value:stats?.totalClasses??"-",icon:"🏫",color:"#ec4899"},
    {label:"Total Points Earned",value:stats?.totalPoints??"-",icon:"⭐",color:"#f97316"},
  ];

  const panelContent=(
    <div style={{background:card,borderRadius:inline?24:24,width:"100%",fontFamily:"'Plus Jakarta Sans',sans-serif",border:`1.5px solid ${bd}`,maxHeight:inline?"none":"88vh",overflow:inline?"visible":"auto",boxShadow:inline?"none":`0 32px 80px ${sh}`}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"22px 28px 18px",borderBottom:`1.5px solid ${bd}`,position:"sticky",top:0,background:card,zIndex:1,borderRadius:"24px 24px 0 0"}}>
          <div>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:"1.4rem",fontWeight:700,color:txt}}>🛡️ Admin Panel</div>
            <div style={{fontSize:".76rem",color:txt3,marginTop:2}}>StudyDesk analytics dashboard</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            {authed&&<button onClick={loadStats} style={{padding:"7px 14px",borderRadius:9,border:`1.5px solid ${bd}`,background:bg3,color:txt,fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:".78rem",fontWeight:600,cursor:"pointer"}}>🔄 Refresh</button>}
            <button onClick={onClose} style={{padding:"7px 14px",borderRadius:9,border:`1.5px solid ${bd}`,background:bg3,color:txt,fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:".78rem",fontWeight:600,cursor:"pointer"}}>✕ Close</button>
          </div>
        </div>

        <div style={{padding:"24px 28px"}}>
          {/* Password gate */}
          {!authed?(
            <div style={{maxWidth:320,margin:"0 auto",paddingTop:20}}>
              <div style={{fontSize:"1.1rem",fontWeight:700,color:txt,marginBottom:6,textAlign:"center"}}>🔒 Enter Admin Password</div>
              <div style={{fontSize:".8rem",color:txt3,textAlign:"center",marginBottom:20}}>Access restricted to admins only.</div>
              <input type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&tryLogin()}
                placeholder="Password..." autoFocus
                style={{width:"100%",padding:"10px 13px",border:`1.5px solid ${bd}`,borderRadius:11,background:bg3,color:txt,fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:".9rem",outline:"none",marginBottom:10,boxSizing:"border-box"}}/>
              {err&&<div style={{color:"#ef4444",fontSize:".8rem",marginBottom:10,textAlign:"center"}}>{err}</div>}
              <button onClick={tryLogin} style={{width:"100%",padding:"11px",borderRadius:11,border:"none",background:txt,color:card,fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:".9rem",cursor:"pointer"}}>
                Unlock →
              </button>

            </div>
          ):(
            <>
              {/* Preview badge */}


              {loading?(
                <div style={{textAlign:"center",padding:40,color:txt3}}>Loading stats...</div>
              ):stats?(
                <>
                  {/* Stats grid */}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:24}}>
                    {STAT_CARDS.map(sc=>(
                      <div key={sc.label} style={{background:bg3,border:`1.5px solid ${bd}`,borderRadius:16,padding:"16px 14px",position:"relative",overflow:"hidden"}}>
                        <div style={{position:"absolute",top:0,left:0,width:3,height:"100%",background:sc.color,borderRadius:"16px 0 0 16px"}}/>
                        <div style={{fontSize:"1.5rem",marginBottom:4,marginLeft:6}}>{sc.icon}</div>
                        <div style={{fontSize:"1.6rem",fontWeight:800,color:txt,marginLeft:6,lineHeight:1}}>{sc.value}</div>
                        <div style={{fontSize:".68rem",fontWeight:700,color:txt3,marginTop:4,marginLeft:6,textTransform:"uppercase",letterSpacing:".04em"}}>{sc.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Progress bar: submission rate */}
                  <div style={{background:bg3,border:`1.5px solid ${bd}`,borderRadius:16,padding:"18px 20px",marginBottom:16}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                      <div style={{fontWeight:700,color:txt,fontSize:".88rem"}}>📈 Assignment Completion Rate</div>
                      <div style={{fontWeight:800,color:"#16a34a",fontSize:".88rem"}}>{completionRate}%</div>
                    </div>
                    <div style={{background:bd,borderRadius:99,height:10,overflow:"hidden"}}>
                      <div style={{width:completionRate+"%",height:"100%",background:"linear-gradient(90deg,#16a34a,#4ade80)",borderRadius:99,transition:"width .6s ease"}}/>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:6,fontSize:".72rem",color:txt3}}>
                      <span>{stats.totalSubmitted} submitted</span>
                      <span>{(stats.totalAssignments-stats.totalSubmitted)} still pending</span>
                    </div>
                  </div>

                  {/* Online users */}
                  <div style={{background:bg3,border:`1.5px solid ${bd}`,borderRadius:16,padding:"18px 20px",marginBottom:16}}>
                    <div style={{fontWeight:700,color:txt,fontSize:".88rem",marginBottom:12}}>🟢 Online Now ({stats.onlineNow})</div>
                    {stats.onlineUsers.length===0?(
                      <div style={{color:txt3,fontSize:".8rem"}}>No users active in the last 2 minutes.</div>
                    ):(
                      <div style={{display:"flex",flexDirection:"column",gap:8}}>
                        {stats.onlineUsers.map((u,i)=>(
                          <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
                            <div style={{width:8,height:8,borderRadius:"50%",background:"#10b981",flexShrink:0}}/>
                            <div style={{width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:".75rem",flexShrink:0}}>
                              {(u.displayName||u.email||"?")[0].toUpperCase()}
                            </div>
                            <div>
                              <div style={{fontSize:".82rem",fontWeight:600,color:txt}}>{u.displayName||u.email.split("@")[0]}</div>
                              <div style={{fontSize:".7rem",color:txt3}}>{u.email}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* All users */}
                  {stats.allUsers&&stats.allUsers.length>0&&(
                    <div style={{background:bg3,border:`1.5px solid ${bd}`,borderRadius:16,padding:"18px 20px"}}>
                      <div style={{fontWeight:700,color:txt,fontSize:".88rem",marginBottom:12}}>👥 All Registered Users ({stats.allUsers.length})</div>
                      <div style={{display:"flex",flexDirection:"column",gap:7,maxHeight:260,overflow:"auto"}}>
                        {stats.allUsers.map((u,i)=>(
                          <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderBottom:`1px solid ${bd}`}}>
                            <div style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#3b82f6,#6366f1)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:".7rem",flexShrink:0}}>
                              {(u.displayName||u.email||"?")[0].toUpperCase()}
                            </div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:".8rem",fontWeight:600,color:txt,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{u.displayName||u.email.split("@")[0]}</div>
                              <div style={{fontSize:".69rem",color:txt3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{u.email}</div>
                            </div>
                            {u.uid&&(
                              <button
                                disabled={deletingUser===u.uid}
                                onClick={async()=>{
                                  if(!window.confirm(`Remove ${u.email} from StudyDesk?\n\nThis deletes their Firestore data. Their login account will remain.`)) return;
                                  setDeletingUser(u.uid);
                                  await fbAdminDeleteUserData(u.uid, user.idToken);
                                  setStats(s=>({...s,allUsers:s.allUsers.filter(x=>x.uid!==u.uid),totalUsers:s.totalUsers-1}));
                                  setDeletingUser(null);
                                }}
                                style={{padding:"4px 10px",borderRadius:7,border:"1.5px solid #fca5a5",background:deletingUser===u.uid?"#fca5a5":"#fef2f2",color:"#dc2626",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:".7rem",fontWeight:700,cursor:deletingUser===u.uid?"not-allowed":"pointer",flexShrink:0,transition:"all .15s"}}>
                                {deletingUser===u.uid?"...":"🗑 Remove"}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ):(
                <div style={{textAlign:"center",padding:40,color:"#ef4444"}}>Failed to load stats. Check your connection.</div>
              )}
            </>
          )}
        </div>
      </div>
  );
  if(inline) return panelContent;
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(4px)"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{maxWidth:700,width:"100%"}}>
        {panelContent}
      </div>
    </div>
  );
}

export default function StudyDesk() {
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [tab, setTab] = useState("dashboard");
  const [showReleases, setShowReleases] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [releaseViewed, setReleaseViewed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [addingA, setAddingA] = useState(false);
  const [addingC, setAddingC] = useState(false);
  const [schoolWiz, setSchoolWiz] = useState(null);
  // schoolWiz = null | {step:"search"|"confirm"|"periods", query, results, school, numPeriods, periods:[{name,start,end,days}], currentPeriod}
  const [filter, setFilter] = useState("all");
  const [darkMode, setDarkMode] = useState(()=>{try{return localStorage.getItem("sd-dark")==="1";}catch{return false;}});
  const [user, setUser] = useState(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const logoClicks = useRef(0);
  const logoTimer = useRef(null);
  function handleLogoClick(){
    logoClicks.current+=1;
    clearTimeout(logoTimer.current);
    logoTimer.current=setTimeout(()=>{logoClicks.current=0;},1800);
    // 5-click logo trick disabled — use /admin route instead
  }
  // /admin route detection
  const ADMIN_EMAIL = "asgoyal1@stu.naperville203.org";
  const isAdminRoute = window.location.hash==="#/admin" || window.location.pathname==="/admin" || window.location.pathname.endsWith("/admin");
  const [adminRouteAuthed, setAdminRouteAuthed] = useState(false);

  const [authLoading, setAuthLoading] = useState(true);
  const [game, setGame] = useState({points:0,streak:0,lastStreakDate:"",dailyDate:"",dailyCount:0,owned:[],equipped:{hat:"",face:"",body:"",special:""}});
  const [shopCat, setShopCat] = useState("all");
  const [floats, setFloats] = useState([]);
  const [confetti, setConfetti] = useState([]);

  function launchConfetti(originEl){
    const rect=originEl?originEl.getBoundingClientRect():{left:window.innerWidth/2,top:window.innerHeight/2,width:0,height:0};
    const ox=rect.left+rect.width/2;
    const oy=rect.top+rect.height/2;
    const colors=["#16a34a","#4ade80","#fbbf24","#f472b6","#60a5fa","#a78bfa","#fb923c","#fff"];
    const pieces=Array.from({length:60},(_,i)=>({
      id:Date.now()+i,
      x:ox,y:oy,
      color:colors[i%colors.length],
      tx:(Math.random()-0.5)*700,
      ty:-(Math.random()*300+100),
      rot:(Math.random()-0.5)*900,
      dur:0.9+Math.random()*0.8,
      w:6+Math.random()*8,
      h:8+Math.random()*10,
    }));
    setConfetti(pieces);
    setTimeout(()=>setConfetti([]),2200);
  }
  const [schedPrompt, setSchedPrompt] = useState(null);
  const [subjMode, setSubjMode] = useState("select");

  const [importOpen, setImportOpen] = useState(false);
  const [importMode, setImportMode] = useState("canvas");
  const [importUrl, setImportUrl] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importStep, setImportStep] = useState("url");
  const [agendaUrl, setAgendaUrl] = useState("");
  const [agendaStep, setAgendaStep] = useState("url"); // url | doc-upload | slides-download | slides-upload | scanning
  const [agendaDocText, setAgendaDocText] = useState("");
  const [agendaSlideLinks, setAgendaSlideLinks] = useState([]); // [{id, title, exportUrl}]
  const [agendaSlideTexts, setAgendaSlideTexts] = useState([]);
  const [canvasStatus, setCanvasStatus] = useState("");
  const [canvasToken, setCanvasToken] = useState(()=>{try{return localStorage.getItem("sd-canvas-token")||"";}catch{return "";}});
  const [canvasBaseUrl, setCanvasBaseUrl] = useState(()=>{try{return localStorage.getItem("sd-canvas-url")||"https://naperville.instructure.com";}catch{return "https://naperville.instructure.com";}});
  const [canvasSync, setCanvasSync] = useState({lastSync:null,syncing:false,newSubmissions:0,error:"",everSucceeded:false});
  const [showCanvasSetup, setShowCanvasSetup] = useState(false);
  const [expandedGradeClass, setExpandedGradeClass] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const canvasSyncRef = useRef(false);
  const [fetchStatus, setFetchStatus] = useState("");

  const emptyAF = {title:"",subject:"",dueDate:"",priority:"medium",progress:0,notes:""};
  const emptyCF = {name:"",days:[],startTime:"09:00",endTime:"10:00",room:"",color:SUBJECT_COLORS[0]};
  const [af, setAf] = useState(emptyAF);
  const [cf, setCf] = useState(emptyCF);

  const saveReady=useRef(false);

  // Restore session on mount — always force fresh login on /admin route
  useEffect(()=>{
    const onAdminRoute = window.location.hash==="#/admin" || window.location.pathname==="/admin" || window.location.pathname.endsWith("/admin");
    if(onAdminRoute){
      // Clear any existing session so admin must always sign in fresh
      fbClearSession();
      setAuthLoading(false);
      return;
    }
    const session=fbGetSession();
    if(session){
      setUser(session);
      fbLoadData(session.uid, session.idToken).then(d=>{
        if(d){setAssignments(d.a||[]);setClasses(d.c||[]);if(d.g)setGame(d.g);if(d.cv?.url){setCanvasBaseUrl(d.cv.url);}}
        saveReady.current=true;
        setLoaded(true);
        const seenVersion=localStorage.getItem("studydesk-seen-version");
        if(seenVersion!==APP_VERSION) setShowReleases(true);
      }).catch(()=>{setLoaded(true);saveReady.current=true;});
    } else {
      setAuthLoading(false);
    }
    setAuthLoading(false);
  },[]);

  // Save to Firestore debounced
  useEffect(()=>{
    if(!saveReady.current||!user) return;
    const t=setTimeout(()=>{
      fbSaveData(user.uid, user.idToken, {a:assignments,c:classes,g:game,cv:{url:canvasBaseUrl}});
    },800); // debounce 800ms
    return()=>clearTimeout(t);
  },[assignments,classes,game,loaded,user]);

  useEffect(()=>{try{localStorage.setItem("sd-dark",darkMode?"1":"0");}catch{}},[darkMode]);
  useEffect(()=>{try{if(canvasToken)localStorage.setItem("sd-canvas-token",canvasToken);else localStorage.removeItem("sd-canvas-token");}catch{}},[canvasToken]);
  useEffect(()=>{try{localStorage.setItem("sd-canvas-url",canvasBaseUrl);}catch{}},[canvasBaseUrl]);

  // Presence heartbeat — updates every 60s while logged in
  useEffect(()=>{
    if(!user) return;
    fbUpdatePresence(user);
    const t=setInterval(()=>fbUpdatePresence(user),60000);
    return()=>clearInterval(t);
  },[user]);

  // ── Canvas Auto-Sync ────────────────────────────────────────────────────────
  async function syncCanvas(token, baseUrl, silent=false){
    if(!token||canvasSyncRef.current) return;
    canvasSyncRef.current=true;
    if(!silent) setCanvasSync(s=>({...s,syncing:true,error:""}));
    else setCanvasSync(s=>({...s,syncing:true}));
    try{
      const today=new Date().toISOString().split("T")[0];
      const syncPath=`/api/v1/planner/items?per_page=100&start_date=${today}`;
      const syncR=await fetch(canvasProxyUrl(baseUrl, syncPath),{
        headers:{"Authorization":`Bearer ${token}`,"Accept":"application/json"},
        signal:AbortSignal.timeout(10000)
      });
      if(!syncR.ok) throw new Error(`Canvas returned ${syncR.status}`);
      let data=await syncR.json();
      if(!Array.isArray(data)) throw new Error("Unexpected response from Canvas");

      let newSubmits=0;
      setAssignments(prev=>{
        let updated=[...prev];
        for(const item of data){
          if(!item.plannable?.title) continue;
          const submitted=item.submissions?.submitted||false;
          const score=item.submissions?.score??null;
          const pointsPossible=item.plannable?.points_possible??null;
          const dueDate=item.plannable_date?item.plannable_date.split("T")[0]:"";
          const subject=item.context_name||"";
          const title=item.plannable?.title||"";
          const match=updated.find(a=>{
            const titleMatch=a.title.toLowerCase().trim()===title.toLowerCase().trim()||
              a.title.toLowerCase().includes(title.toLowerCase().slice(0,15))||
              title.toLowerCase().includes(a.title.toLowerCase().slice(0,15));
            const subjectMatch=!subject||!a.subject||
              a.subject.toLowerCase().includes(subject.toLowerCase().slice(0,8))||
              subject.toLowerCase().includes(a.subject.toLowerCase().slice(0,8));
            return titleMatch&&subjectMatch;
          });
          if(match){
            const wasSubmitted=match.progress>=100;
            const patch={};
            if(submitted&&!wasSubmitted){ patch.progress=100; newSubmits++; }
            if(score!==null&&pointsPossible){ patch.grade=Math.round((score/pointsPossible)*100); patch.gradeRaw=`${score}/${pointsPossible}`; }
            if(dueDate&&!match.dueDate) patch.dueDate=dueDate;
            if(Object.keys(patch).length>0){
              updated=updated.map(a=>a.id===match.id?{...a,...patch}:a);
            }
          } else if(submitted){
            const existing=updated.find(a=>a.title.toLowerCase()===title.toLowerCase());
            if(!existing&&dueDate){
              const today2=new Date(); today2.setHours(0,0,0,0);
              const due=new Date(dueDate+"T00:00:00");
              if(due>=today2||score!==null){
                updated.push({
                  id:"canvas_"+Date.now()+"_"+Math.random().toString(36).slice(2),
                  title,subject,dueDate,priority:"medium",progress:100,notes:"Auto-imported from Canvas",
                  ...(score!==null&&pointsPossible?{grade:Math.round((score/pointsPossible)*100),gradeRaw:`${score}/${pointsPossible}`}:{})
                });
                newSubmits++;
              }
            }
          }
        }
        return updated;
      });

      setCanvasSync({lastSync:new Date(),syncing:false,newSubmissions:newSubmits,error:"",everSucceeded:true});
      if(newSubmits>0){
        launchConfetti(null);
        setTimeout(()=>setCanvasSync(s=>({...s,newSubmissions:0})),4000);
      }
    } catch(e){
      setCanvasSync(s=>{
        // If this was the very first sync attempt and it failed, clear the token so user isn't stuck
        if(!s.everSucceeded){
          setCanvasToken("");
          return {lastSync:null,syncing:false,newSubmissions:0,error:"",everSucceeded:false};
        }
        return {...s,syncing:false,error:e.message||"Sync failed"};
      });
    }
    canvasSyncRef.current=false;
  }

  // Auto-sync every 3 minutes if token is set
  useEffect(()=>{
    if(!canvasToken||!user) return;
    syncCanvas(canvasToken, canvasBaseUrl, true);
    const t=setInterval(()=>syncCanvas(canvasToken, canvasBaseUrl, true), 3*60*1000);
    return()=>clearInterval(t);
  },[canvasToken, canvasBaseUrl, user]);

  function getExportUrl(rawUrl){const id=extractId(rawUrl.trim());if(!id)return null;return`https://docs.google.com/presentation/d/${id}/export/txt`;}

  function handleFileUpload(e){
    const file=e.target.files[0];if(!file)return;
    file.text().then(text=>{
      setPasteText(text);
      setImporting(true);setImportResult(null);
      try{
        const found=parseHomeworkFromText(text);
        if(!found.length){setImportResult({error:"No assignments found. Make sure the file contains lines like 'Complete X Due Tomorrow'."});}
        else{setImportResult({assignments:found,source:"slides"});}
      }catch(err){setImportResult({error:err.message});}
      setImporting(false);
    });
  }

  function handleSlidesUploadClick(){
    // Auto-open the export/txt download before they pick the file
    const id=extractId(importUrl);
    if(id) window.open(`https://docs.google.com/presentation/d/${id}/export/txt`,"_blank");
  }

  function addFloat(pts,streak){const id=Date.now()+Math.random();setFloats(f=>[...f,{id,pts,streak}]);setTimeout(()=>setFloats(f=>f.filter(x=>x.id!==id)),2000);}
  function handleComplete(prev,next){
    if(next!==100||prev>=100)return;
    if(user)fbIncrementStat("totalSubmitted",1,user.idToken);if(user)fbIncrementStat("totalPoints",15,user.idToken);
    const today=new Date().toISOString().split("T")[0];
    setGame(g=>{
      const nd=g.dailyDate!==today;
      const nc=nd?1:g.dailyCount+1;
      let ns=g.streak,nl=g.lastStreakDate,bonus=0;
      if(nc===3){
        const y=new Date();y.setDate(y.getDate()-1);
        const ys=y.toISOString().split("T")[0];
        ns=(g.lastStreakDate===ys||g.lastStreakDate===today)?g.streak+1:1;
        bonus=Math.round(10+ns*4);nl=today;
        setTimeout(()=>addFloat(bonus,true),600);
      }
      addFloat(15,false);
      return{...g,points:g.points+15+bonus,streak:ns,lastStreakDate:nl,dailyDate:today,dailyCount:nc};
    });
  }
  function buyItem(id){const it=SHOP_ITEMS.find(i=>i.id===id);if(!it||game.owned.includes(id)||game.points<it.price)return;setGame(g=>({...g,points:g.points-it.price,owned:[...g.owned,id]}));}
  function equipItem(id){const it=SHOP_ITEMS.find(i=>i.id===id);if(!it||!game.owned.includes(id))return;setGame(g=>({...g,equipped:{...g.equipped,[it.cat]:g.equipped[it.cat]===id?"":id}}));}
  function checkUnknown(adds){const cn=new Set(classes.map(c=>c.name));for(const a of adds){if(a.subject&&!cn.has(a.subject)){setSchedPrompt({subject:a.subject,pf:{name:a.subject,days:[],startTime:"09:00",endTime:"10:00",room:"",color:SUBJECT_COLORS[0]}});return;}}}
  function resetImport(){setImportUrl("");setPasteText("");setCanvasPaste("");setImportResult(null);setImportStep("url");setCanvasStatus("");setAgendaUrl("");setFetchStatus("");setAgendaStep("url");setAgendaDocText("");setAgendaSlideLinks([]);setAgendaSlideTexts([]);}

  function dismissReleases(){
    localStorage.setItem("studydesk-seen-version", APP_VERSION);
    setShowReleases(false);
    setReleaseViewed(true);
  }

  function confirmImport(){
    const incoming=importResult?.assignments||[];
    setAssignments(prev=>{
      let updated=[...prev];
      const toAdd=[];
      for(const a of incoming){
        // Try to find existing match by canvasId or title+subject
        const match=updated.find(ex=>
          (a.canvasId&&ex.canvasId===a.canvasId)||
          (ex.title.toLowerCase().trim()===a.title.toLowerCase().trim()&&
           (!a.subject||!ex.subject||ex.subject.toLowerCase()===a.subject.toLowerCase()))
        );
        if(match){
          // Update with Canvas data
          updated=updated.map(ex=>ex.id===match.id?{
            ...ex,
            ...(a.canvasId?{canvasId:a.canvasId}:{}),
            subject:a.subject||ex.subject,
            dueDate:a.dueDate||ex.dueDate,
            priority:a.priority||ex.priority,
            progress:Math.max(ex.progress,a.progress),
            ...(a.grade!=null?{grade:a.grade,gradeRaw:a.gradeRaw}:{}),
            ...(a.pointsPossible?{pointsPossible:a.pointsPossible}:{}),
          }:ex);
        } else {
          toAdd.push({...a,id:Date.now().toString()+Math.random().toString(36).slice(2)});
        }
      }
      if(toAdd.length&&user) fbIncrementStat("totalAssignments",toAdd.length,user.idToken);
      checkUnknown(toAdd);
      return [...updated,...toAdd];
    });
    setImportOpen(false);resetImport();setTab("assignments");
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const CANVAS_URL = `https://naperville.instructure.com/api/v1/planner/items?per_page=100&start_date=${todayStr}`;

  const [canvasPaste, setCanvasPaste] = useState("");

  async function importFromCanvasPaste(){
    if(!canvasPaste.trim())return;
    setImporting(true);setImportResult(null);
    try{
      const clean=canvasPaste.trim();
      const s=clean.indexOf("["),e=clean.lastIndexOf("]");
      if(s===-1)throw new Error("Doesn't look like Canvas data — make sure you selected all the text on the page.");
      const parsed=JSON.parse(clean.slice(s,e+1));
      if(!Array.isArray(parsed)||parsed.length===0)throw new Error("No assignments found. Make sure you're logged into Canvas first.");

      // Parse Canvas planner format
      const today=new Date(); today.setHours(0,0,0,0);
      const assignments=parsed
        .filter(item=>item.plannable_type==="assignment"||item.plannable_type==="quiz"||item.plannable_type==="discussion_topic")
        .map(item=>{
          const dueDate=item.plannable_date?item.plannable_date.split("T")[0]:"";
          const days=dueDate?(new Date(dueDate)-today)/86400000:99;
          return{
            title:item.plannable?.title||item.plannable_type,
            subject:item.context_name||"Unknown",
            dueDate,
            priority:days<=2?"high":days<=7?"medium":"low",
            notes:item.plannable?.points_possible?`${item.plannable.points_possible} pts`:"",
          };
        });

      if(assignments.length===0)throw new Error("No upcoming assignments found in that data.");
      setImportResult({assignments,source:"canvas"});
    }catch(e){setImportResult({error:e.message});}
    setImporting(false);
  }

  async function importFromCanvasAPI(){
    setImporting(true); setImportResult(null);
    try{
      const today=new Date(); today.setHours(0,0,0,0);
      const startDate=today.toISOString().split("T")[0];
      // Fetch ALL pages of upcoming assignments
      let allItems=[];
      let currentPath=`/api/v1/planner/items?per_page=100&start_date=${startDate}`;
      let pageCount=0;
      while(currentPath&&pageCount<20){
        pageCount++;
        const r=await fetch(canvasProxyUrl(canvasBaseUrl, currentPath),{
          headers:{"Authorization":`Bearer ${canvasToken}`,"Accept":"application/json"},
          signal:AbortSignal.timeout(12000)
        });
        if(!r.ok) throw new Error(`Canvas API returned ${r.status} — check your token`);
        const link=r.headers.get("Link")||"";
        const nextMatch=link.match(/<([^>]+)>;\s*rel="next"/);
        let nextPath=null;
        if(nextMatch){
          try{ const nu=new URL(nextMatch[1]); nextPath=nu.pathname+nu.search; }catch{}
        }
        const data=await r.json();
        if(!Array.isArray(data)) throw new Error("Unexpected response from Canvas");
        allItems=[...allItems,...data];
        currentPath=nextPath;
      }

      if(allItems.length===0) throw new Error("No upcoming assignments found on Canvas.");

      // Parse into assignment objects
      const parsed=allItems
        .filter(item=>["assignment","quiz","discussion_topic","wiki_page"].includes(item.plannable_type))
        .map(item=>{
          const dueDate=item.plannable_date?item.plannable_date.split("T")[0]:"";
          const days=dueDate?(new Date(dueDate+"T00:00:00")-today)/86400000:99;
          const submitted=item.submissions?.submitted||false;
          const score=item.submissions?.score??null;
          const pointsPossible=item.plannable?.points_possible??null;
          return{
            canvasId:String(item.plannable_id||""),
            title:item.plannable?.title||item.plannable_type,
            subject:item.context_name||"Unknown",
            dueDate,
            priority:days<=1?"high":days<=5?"medium":"low",
            progress:submitted?100:0,
            notes:pointsPossible?`${pointsPossible} pts`:"",
            pointsPossible,
            ...(score!==null&&pointsPossible?{grade:Math.round((score/pointsPossible)*100),gradeRaw:`${score}/${pointsPossible}`}:{})
          };
        });

      if(parsed.length===0) throw new Error("No assignments or quizzes found.");
      setImportResult({assignments:parsed,source:"canvas",total:allItems.length});
    }catch(e){ setImportResult({error:e.message}); }
    setImporting(false);
  }

  async function importFromSlides(){
    if(!pasteText.trim())return;
    setImporting(true);setImportResult(null);
    try{
      const parsed=parseHomeworkFromText(pasteText);
      if(!parsed.length)throw new Error("No assignments detected. Make sure the text contains lines like 'Complete X Due Tomorrow'.");
      setImportResult({assignments:parsed});
    }catch(e){setImportResult({error:e.message});}
    setImporting(false);
  }

  function extractDocId(url){const m=url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);return m?m[1]:null;}

  async function fetchViaProxy(url){
    const proxy=`https://corsproxy.io/?url=${encodeURIComponent(url)}`;
    const res=await fetch(proxy);
    if(!res.ok)throw new Error(`Failed to fetch (${res.status}). Make sure the link is set to "Anyone with link can view".`);
    return res.text();
  }

  async function importFromSlidesUrl(){
    const id=extractId(importUrl.trim());
    if(!id){setImportResult({error:"Not a valid Google Slides URL."});return;}
    setImporting(true);setImportResult(null);
    try{
      setFetchStatus("Downloading slide content...");
      const exportUrl=`https://docs.google.com/presentation/d/${id}/export/txt`;
      const text=await fetchViaProxy(exportUrl);
      if(!text||text.trim().length<10)throw new Error("Slides appear empty or couldn't be fetched. Make sure sharing is set to 'Anyone with link can view'.");
      setFetchStatus("Extracting homework...");
      const parsed=parseHomeworkFromText(text);
      if(!parsed.length)throw new Error("No assignments detected in slides. Make sure the slides contain lines like 'Complete X Due Tomorrow'.");
      setImportResult({assignments:parsed,source:"slides"});
    }catch(e){setImportResult({error:e.message});}
    setImporting(false);setFetchStatus("");
  }

  function getDocExportUrl(url){
    const m=url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
    if(!m)return null;
    // Use HTML export so hyperlinks are preserved
    return`https://docs.google.com/document/d/${m[1]}/export?format=html`;
  }

  function handleAgendaDocUpload(e){
    const file=e.target.files[0];if(!file)return;
    file.text().then(html=>{
      const parser=new DOMParser();
      const doc2=parser.parseFromString(html,"text/html");

      const MONTHS={january:0,february:1,march:2,april:3,may:4,june:5,july:6,august:7,september:8,october:9,november:10,december:11};
      const today=new Date(); today.setHours(0,0,0,0);
      let currentMonth=today.getMonth();
      let currentYear=today.getFullYear();
      const entries=[];
      const seen=new Set();

      // Iterate table cells — each <td> has a day number and optional agenda link
      const cells=doc2.querySelectorAll("td");
      cells.forEach(td=>{
        const text=(td.innerText||td.textContent||"").trim();

        // Detect month name in this cell's text
        for(const [mname,mnum] of Object.entries(MONTHS)){
          if(text.toLowerCase().includes(mname)){
            currentMonth=mnum;
            // If month wraps to next year (e.g. we're in November and see January)
            if(mnum<today.getMonth()-2) currentYear=today.getFullYear()+1;
            break;
          }
        }

        // Extract day number — first number in the cell text
        const dayMatch=text.match(/^(?:[A-Za-z]+\s+)?(\d{1,2})/);
        if(!dayMatch) return;
        const day=parseInt(dayMatch[1]);
        if(day<1||day>31) return;

        // Find agenda links inside this cell
        const anchors=td.querySelectorAll("a");
        anchors.forEach(a=>{
          // The href attr is a google redirect: google.com/url?q=https://docs.google.com/...
          const rawHref=a.getAttribute("href")||"";
          let resolvedUrl=rawHref;

          // Extract the actual URL from google redirect
          const qMatch=rawHref.match(/[?&]q=([^&]+)/);
          if(qMatch){
            try{ resolvedUrl=decodeURIComponent(qMatch[1]); }catch{}
          }

          const sliM=resolvedUrl.match(/\/presentation\/d\/([a-zA-Z0-9_-]+)/);
          const docM=resolvedUrl.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);

          if(sliM||docM){
            const date=new Date(currentYear,currentMonth,day);
            date.setHours(0,0,0,0);
            if(date>=today){
              const exportUrl=sliM
                ?`https://docs.google.com/presentation/d/${sliM[1]}/export/txt`
                :`https://docs.google.com/document/d/${docM[1]}/export?format=txt`;
              if(!seen.has(exportUrl)){
                seen.add(exportUrl);
                const monthName=new Date(currentYear,currentMonth,1).toLocaleString("en-US",{month:"long"});
                entries.push({date,label:`${monthName} ${day}`,exportUrl});
              }
            }
          }
        });
      });

      // Sort by date
      entries.sort((a,b)=>a.date-b.date);

      if(entries.length===0){
        setImportResult({error:"No upcoming agenda links found. Make sure you downloaded the HTML version of the doc (not txt)."});
        return;
      }
      setAgendaSlideLinks(entries);
      setAgendaStep("fetcher");
    });
  }

  function generateFetcherPage(links){
    const urls=links.map(l=>({label:l.label,url:l.exportUrl}));
    return`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Agenda Fetcher</title>
<style>body{font-family:sans-serif;max-width:600px;margin:40px auto;padding:20px;background:#fafaf8}
h2{color:#1B1F3B}
.status{margin:8px 0;padding:8px 12px;border-radius:8px;background:#f0fdf4;border:1px solid #86efac;font-size:.85rem;color:#15803d}
.err{background:#fef2f2;border-color:#fca5a5;color:#dc2626}
button{background:#1B1F3B;color:#fff;border:none;padding:10px 22px;border-radius:8px;font-size:1rem;cursor:pointer;margin-top:16px}
button:disabled{opacity:.5;cursor:not-allowed}
#log{margin-top:16px;max-height:300px;overflow-y:auto}
</style></head>
<body>
<h2>📋 Agenda Fetcher</h2>
<p>This page will fetch all your upcoming agendas using your Google login.<br>Make sure you're logged into Google in this browser, then click the button.</p>
<button id="btn" onclick="run()">⬇️ Fetch All Agendas</button>
<div id="log"></div>
<script>
const URLS=${JSON.stringify(urls,null,2)};
function log(msg,err){
  const d=document.createElement("div");
  d.className="status"+(err?" err":"");
  d.textContent=msg;
  document.getElementById("log").appendChild(d);
}
async function run(){
  document.getElementById("btn").disabled=true;
  let combined="";
  for(const item of URLS){
    log("Fetching: "+item.label+"...");
    try{
      const res=await fetch(item.url,{credentials:"include"});
      if(!res.ok)throw new Error("HTTP "+res.status);
      const text=await res.text();
      combined+="\\n\\n=== "+item.label+" ===\\n"+text;
      log("✅ Got: "+item.label);
    }catch(e){
      log("⚠️ Skipped "+item.label+": "+e.message,true);
    }
  }
  if(!combined.trim()){log("❌ Nothing was fetched. Make sure you're logged into Google.",true);document.getElementById("btn").disabled=false;return;}
  const blob=new Blob([combined],{type:"text/plain"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="agendas-combined.txt";
  a.click();
  log("✅ Download started! Upload agendas-combined.txt back to Study Desk.");
}
</script>
</body></html>`;
  }

  function downloadFetcherPage(){
    const html=generateFetcherPage(agendaSlideLinks);
    const blob=new Blob([html],{type:"text/html"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download="agenda-fetcher.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }

  function handleCombinedUpload(e){
    const file=e.target.files[0];if(!file)return;
    file.text().then(text=>{
      runAgendaScan(text);
    });
  }

  function parseHomeworkFromText(text){
    const today=new Date(); today.setHours(0,0,0,0);
    const MNAMES={january:0,february:1,march:2,april:3,may:4,june:5,july:6,august:7,september:8,october:9,november:10,december:11};
    const DOW={sunday:0,monday:1,tuesday:2,wednesday:3,thursday:4,friday:5,saturday:6};
    function fmtD(d){return d.toISOString().split("T")[0];}

    // Pull subject from header like "Honors English One: Tuesday..." or first non-blank line
    let subject="";
    const sm=text.match(/^(.+?):\s+(?:Monday|Tuesday|Wednesday|Thursday|Friday)/m);
    if(sm) subject=sm[1].trim();
    else{
      // Try first meaningful line
      const firstLine=(text.split("\n").find(l=>l.trim().length>3&&!/^(put your phone|take out|stash|get ready)/i.test(l.trim()))||"").trim();
      if(firstLine.length<60) subject=firstLine;
    }

    // Get all context dates from slide headers like "Tuesday, January 27" or "Monday, February 2"
    // We'll build a map of line-index -> date for sections
    const lines=text.split("\n");
    // Find slide-date headers — lines that are just a day+date like "Tuesday, January 27"
    const sectionDates=[]; // [{lineIdx, date}]
    for(let i=0;i<lines.length;i++){
      const l=lines[i].trim();
      const hm=l.match(/^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)[,\s]+([A-Za-z]+)\s+(\d{1,2})(?:[\u2013\-]\d{1,2})?(?:[,\s]+(\d{4}))?\s*$/i);
      if(hm&&MNAMES[hm[1].toLowerCase()]!==undefined){
        const yr=hm[3]?parseInt(hm[3]):today.getFullYear();
        const d=new Date(yr,MNAMES[hm[1].toLowerCase()],parseInt(hm[2]));
        d.setHours(0,0,0,0);
        sectionDates.push({lineIdx:i,date:d});
      }
    }

    function getContextDateForLine(lineIdx){
      // Find the most recent section date at or before this line
      let ctx=new Date(today); ctx.setHours(0,0,0,0);
      for(const sd of sectionDates){
        if(sd.lineIdx<=lineIdx) ctx=sd.date;
        else break;
      }
      return ctx;
    }

    function resolveDate(word, contextDate){
      const w=word.toLowerCase().trim();
      const base=new Date(contextDate); base.setHours(0,0,0,0);
      if(w==="today") return fmtD(base);
      if(w==="tomorrow"){const d=new Date(base);d.setDate(d.getDate()+1);return fmtD(d);}
      if(DOW[w]!==undefined){
        const d=new Date(base);
        const diff=(DOW[w]-d.getDay()+7)%7||7;
        d.setDate(d.getDate()+diff);
        return fmtD(d);
      }
      // "March 9" or "January 27" style
      const mm=word.match(/([A-Za-z]+)\s+(\d{1,2})/);
      if(mm&&MNAMES[mm[1].toLowerCase()]!==undefined){
        const d=new Date(base.getFullYear(),MNAMES[mm[1].toLowerCase()],parseInt(mm[2]));
        if(d<today) d.setFullYear(d.getFullYear()+1);
        return fmtD(d);
      }
      // "1/27" or "2/4" numeric style
      const nm=word.match(/^(\d{1,2})\/(\d{1,2})$/);
      if(nm){
        const d=new Date(today.getFullYear(),parseInt(nm[1])-1,parseInt(nm[2]));
        if(d<today) d.setFullYear(d.getFullYear()+1);
        return fmtD(d);
      }
      return "";
    }

    const assignments=[];
    const seen=new Set();

    // --- Strategy 1: "TODAY'S HOMEWORK" section parsing ---
    // Find each "TODAY'S HOMEWORK" block, get section date, grab items until next header
    const hwSectionRe=/TODAY'S HOMEWORK/i;
    const nextSectionRe=/^(DUE TODAY|GET READY|GET DONE|DO:|REMINDERS|Upcoming assessments|STASH|YOU NEED|TARGETS|SUMMATIVE|EVIDENCE|PRACTICE|Stash)/i;
    for(let i=0;i<lines.length;i++){
      if(!hwSectionRe.test(lines[i])) continue;
      const ctx=getContextDateForLine(i);
      // Collect homework items until next section header or blank+header
      for(let j=i+1;j<lines.length&&j<i+20;j++){
        const item=lines[j].trim();
        if(!item) continue;
        if(nextSectionRe.test(item)) break;
        if(item.length<3) continue;
        // Skip generic filler lines
        if(/^(none!?|pencil|calculator|canvas|mole carnival|mole conversion video|if you need|1 hour|maximum of|highest score|watch|support video)/i.test(item)) continue;
        // This is a homework item — due date is the NEXT class day from context
        const nextDay=new Date(ctx); nextDay.setDate(nextDay.getDate()+1);
        // Skip weekends
        while(nextDay.getDay()===0||nextDay.getDay()===6) nextDay.setDate(nextDay.getDate()+1);
        const dueDate=fmtD(nextDay);
        if(new Date(dueDate+"T00:00:00")<today) continue;
        // Check if line has its own date like "Moles Quiz 1/30"
        const inlineDate=item.match(/(\d{1,2}\/\d{1,2})\s*$/);
        let resolvedDate=dueDate;
        if(inlineDate){
          const rd=resolveDate(inlineDate[1],ctx);
          if(rd) resolvedDate=rd;
        }
        if(new Date(resolvedDate+"T00:00:00")<today) continue;
        let title=item.replace(/(\d{1,2}\/\d{1,2})\s*$/,"").replace(/\s+/g," ").trim();
        title=title.replace(/^[-\u2013\u2014\u2022*\s]+/,"").replace(/[.!,;:]+$/,"").trim();
        if(!title||title.length<3) continue;
        const key=title.toLowerCase();
        if(seen.has(key)) continue;
        seen.add(key);
        const days=Math.ceil((new Date(resolvedDate+"T00:00:00")-today)/86400000);
        const priority=days<=1?"high":days<=4?"medium":"low";
        const notes=/canvas/i.test(item)?"Submit to Canvas":"";
        assignments.push({title,subject,dueDate:resolvedDate,priority,notes});
      }
    }

    // --- Strategy 2: "Upcoming assessments" section parsing ---
    const upcomingRe=/Upcoming assessments/i;
    for(let i=0;i<lines.length;i++){
      if(!upcomingRe.test(lines[i])) continue;
      const ctx=getContextDateForLine(i);
      for(let j=i+1;j<lines.length&&j<i+20;j++){
        const item=lines[j].trim();
        if(!item) continue;
        if(/^(Retake|ACS|Deadline|Max |AC:|DUE TODAY|YOU NEED|STASH)/i.test(item)) continue;
        if(nextSectionRe.test(item)&&!/upcoming/i.test(item)) break;
        // Look for lines with a date like "Moles Quiz 1/30" or "Stoich Quiz #1 2/4"
        const dm=item.match(/(\d{1,2}\/\d{1,2})\s*$/);
        if(!dm) continue;
        const resolvedDate=resolveDate(dm[1],ctx);
        if(!resolvedDate) continue;
        if(new Date(resolvedDate+"T00:00:00")<today) continue;
        let title=item.replace(/(\d{1,2}\/\d{1,2})\s*$/,"").replace(/\s+/g," ").trim();
        title=title.replace(/^[-\u2013\u2014\u2022*\s]+/,"").replace(/[.!,;:]+$/,"").trim();
        if(!title||title.length<3) continue;
        const key=title.toLowerCase();
        if(seen.has(key)) continue;
        seen.add(key);
        const days=Math.ceil((new Date(resolvedDate+"T00:00:00")-today)/86400000);
        const priority=days<=1?"high":days<=4?"medium":"low";
        const notes=/canvas/i.test(item)?"Submit to Canvas":"";
        assignments.push({title,subject,dueDate:resolvedDate,priority,notes});
      }
    }

    // --- Strategy 3: "Due [day]" inline pattern (original English class style) ---
    const DOWPAT="today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday";
    const DATEPAT=`(${DOWPAT}|(?:january|february|march|april|may|june|july|august|september|october|november|december) \\d{1,2})`;
    const actionVerbs=/\b(complete|finish|read|annotate|write|submit|bring|prepare|study|review|do|turn in|upload|type|print|answer|work on)/i;
    for(let i=0;i<lines.length;i++){
      const line=lines[i].trim();
      if(!line) continue;
      const ctx=getContextDateForLine(i);
      const dueMatch=line.match(new RegExp("due\\s+"+DATEPAT,"i"));
      if(!dueMatch) continue;
      if(!actionVerbs.test(line)) continue;
      let title=line
        .replace(/due\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|[A-Za-z]+ \d{1,2})/gi,"")
        .replace(/\(submit to canvas[^)]*\)/gi,"")
        .replace(/^[-\u2013\u2014\u2022*\s]+/,"")
        .replace(/[.!,;:]+$/,"")
        .replace(/\s+/g," ").trim();
      if(!title||title.length<4) continue;
      const key=title.toLowerCase();
      if(seen.has(key)) continue;
      seen.add(key);
      const dueDate=resolveDate(dueMatch[1],ctx);
      if(dueDate&&new Date(dueDate+"T00:00:00")<today) continue;
      const days=dueDate?Math.ceil((new Date(dueDate+"T00:00:00")-today)/86400000):99;
      const priority=days<=1?"high":days<=4?"medium":"low";
      const notes=/canvas/i.test(line)?"Submit to Canvas":"";
      assignments.push({title,subject,dueDate,priority,notes});
    }

    return assignments;
  }

  function runAgendaScan(combinedText){
    setImporting(true);setImportResult(null);
    try{
      const seen=new Set();
      const allAssignments=[];
      // Split by file — each file starts with "Put your phone up"
      const fileSections=combinedText.split(/(?=Put your phone up)/);
      const sections=fileSections.length>1?fileSections:[combinedText];
      for(const section of sections){
        if(!section.trim()) continue;
        const found=parseHomeworkFromText(section);
        for(const a of found){
          const key=a.title.toLowerCase()+a.dueDate;
          if(!seen.has(key)){seen.add(key);allAssignments.push(a);}
        }
      }
      if(allAssignments.length===0){
        setImportResult({error:"No assignments found. Make sure the files contain lines like 'Complete X Due Tomorrow'."});
        setImporting(false);return;
      }
      setImportResult({assignments:allAssignments,source:"agenda",slideCount:agendaSlideLinks.length});
    }catch(err){setImportResult({error:err.message});}
    setImporting(false);setAgendaStep("url");
  }


  function addAssignment(){if(!af.title||!af.subject)return;const na={...af,id:Date.now().toString()};setAssignments(p=>[...p,na]);checkUnknown([na]);setAf(emptyAF);setAddingA(false);if(user)fbIncrementStat("totalAssignments",1,user.idToken);}
  function delAssignment(id){setAssignments(p=>p.filter(x=>x.id!==id));}
  function updateA(id,patch){setAssignments(prev=>{const a=prev.find(x=>x.id===id);if(a&&patch.progress!==undefined)handleComplete(a.progress,patch.progress);return prev.map(x=>x.id===id?{...x,...patch}:x);});}
  function addClass(){if(!cf.name)return;setClasses(p=>[...p,{...cf,id:Date.now().toString()}]);setCf(emptyCF);setAddingC(false);if(user)fbIncrementStat("totalClasses",1,user.idToken);}

  // Hardcoded bell schedules for known schools (keyed by NCESSCH)
  const KNOWN_SCHEDULES = {
    "172771002939": { // Naperville Central
      school:"Naperville Central High School",
      // Each period has dayGroups so different days get correct times
      // SOAR is fixed (auto-added, no class name needed)
      periods:[
        {label:"Period 1", dayGroups:[
          {days:["Mon","Fri"],start:"07:45",end:"08:35"},
          {days:["Tue","Thu"],start:"07:45",end:"08:30"},
          {days:["Wed"],     start:"09:00",end:"09:42"},
        ]},
        {label:"Period 2", dayGroups:[
          {days:["Mon","Fri"],start:"08:41",end:"09:34"},
          {days:["Tue","Thu"],start:"08:35",end:"09:20"},
          {days:["Wed"],     start:"09:47",end:"10:29"},
        ]},
        {label:"SOAR", fixed:true, dayGroups:[
          {days:["Tue","Thu"],start:"09:25",end:"10:10"},
        ]},
        {label:"Period 3", dayGroups:[
          {days:["Mon","Fri"],start:"09:40",end:"10:30"},
          {days:["Tue","Thu"],start:"10:15",end:"11:00"},
          {days:["Wed"],     start:"10:34",end:"11:16"},
        ]},
        {label:"Period 4", dayGroups:[
          {days:["Mon","Fri"],start:"10:36",end:"11:26"},
          {days:["Tue","Thu"],start:"11:05",end:"11:50"},
          {days:["Wed"],     start:"11:21",end:"12:03"},
        ]},
        {label:"Period 5", dayGroups:[
          {days:["Mon","Fri"],start:"11:32",end:"12:22"},
          {days:["Tue","Thu"],start:"11:55",end:"12:40"},
          {days:["Wed"],     start:"12:08",end:"12:49"},
        ]},
        {label:"Period 6", dayGroups:[
          {days:["Mon","Fri"],start:"12:28",end:"13:18"},
          {days:["Tue","Thu"],start:"12:45",end:"13:30"},
          {days:["Wed"],     start:"12:54",end:"13:36"},
        ]},
        {label:"Period 7", dayGroups:[
          {days:["Mon","Fri"],start:"13:24",end:"14:14"},
          {days:["Tue","Thu"],start:"13:35",end:"14:20"},
          {days:["Wed"],     start:"13:41",end:"14:23"},
        ]},
        {label:"Period 8", dayGroups:[
          {days:["Mon","Fri"],start:"14:20",end:"15:10"},
          {days:["Tue","Thu"],start:"14:25",end:"15:10"},
          {days:["Wed"],     start:"14:28",end:"15:10"},
        ]},
      ]
    },
    "172771002940": { // Naperville North
      school:"Naperville North High School",
      numPeriods:8,
      note:"Standard Mon/Fri 8-period schedule.",
      periods:[
        {label:"Period 1",start:"07:45",end:"08:35",days:["Mon","Tue","Wed","Thu","Fri"]},
        {label:"Period 2",start:"08:41",end:"09:34",days:["Mon","Tue","Wed","Thu","Fri"]},
        {label:"Period 3",start:"09:40",end:"10:30",days:["Mon","Tue","Wed","Thu","Fri"]},
        {label:"Period 4",start:"10:36",end:"11:26",days:["Mon","Tue","Wed","Thu","Fri"]},
        {label:"Period 5",start:"11:32",end:"12:22",days:["Mon","Tue","Wed","Thu","Fri"]},
        {label:"Period 6",start:"12:28",end:"13:18",days:["Mon","Tue","Wed","Thu","Fri"]},
        {label:"Period 7",start:"13:24",end:"14:14",days:["Mon","Tue","Wed","Thu","Fri"]},
        {label:"Period 8",start:"14:20",end:"15:10",days:["Mon","Tue","Wed","Thu","Fri"]},
      ]
    }
  };

  async function fetchBellSchedule(ncessch, idToken){
    // Check hardcoded first
    if(KNOWN_SCHEDULES[ncessch]){
      const s=KNOWN_SCHEDULES[ncessch];
      // Normalize: if periods have dayGroups, keep as-is; otherwise wrap for backwards compat
      return s;
    }
    // Then check Firestore
    try{
      const r=await fetch(`${FB_FS}/bellschedules/${ncessch}`,{headers:{"Authorization":`Bearer ${idToken}`}});
      if(r.status===404) return null;
      const d=await r.json();
      if(d.error||!d.fields?.data?.stringValue) return null;
      return JSON.parse(d.fields.data.stringValue);
    }catch{return null;}
  }

  async function saveBellSchedule(ncessch, scheduleData, idToken){
    try{
      await fetch(`${FB_FS}/bellschedules/${ncessch}?updateMask.fieldPaths=data`,{
        method:"PATCH",headers:{"Content-Type":"application/json","Authorization":`Bearer ${idToken}`},
        body:JSON.stringify({fields:{data:{stringValue:JSON.stringify(scheduleData)}}})
      });
    }catch(e){console.warn("Bell save error",e);}
  }

  // Large local school database — always-available, instant results
  const LOCAL_SCHOOLS=[
    // Naperville / DuPage County IL
    {name:"Naperville Central High School",city:"Naperville",state:"IL",ncessch:"172771002939"},
    {name:"Naperville North High School",city:"Naperville",state:"IL",ncessch:"172771002940"},
    {name:"Neuqua Valley High School",city:"Naperville",state:"IL",ncessch:"172771003284"},
    {name:"Waubonsie Valley High School",city:"Aurora",state:"IL",ncessch:"170993002728"},
    {name:"Metea Valley High School",city:"Aurora",state:"IL",ncessch:"170993005136"},
    {name:"Wheaton Warrenville South High School",city:"Wheaton",state:"IL",ncessch:"170993006245"},
    {name:"Glenbard West High School",city:"Glen Ellyn",state:"IL",ncessch:"170861001064"},
    {name:"Glenbard East High School",city:"Lombard",state:"IL",ncessch:"170861001062"},
    {name:"Glenbard North High School",city:"Carol Stream",state:"IL",ncessch:"170861001063"},
    {name:"Glenbard South High School",city:"Glen Ellyn",state:"IL",ncessch:"170861001065"},
    {name:"Downers Grove North High School",city:"Downers Grove",state:"IL",ncessch:"170993001456"},
    {name:"Downers Grove South High School",city:"Downers Grove",state:"IL",ncessch:"170993001457"},
    {name:"Hinsdale Central High School",city:"Hinsdale",state:"IL",ncessch:"171053001282"},
    {name:"Hinsdale South High School",city:"Darien",state:"IL",ncessch:"171053001283"},
    {name:"Lake Park High School",city:"Roselle",state:"IL",ncessch:"170993002559"},
    // Chicago Area
    {name:"New Trier Township High School",city:"Winnetka",state:"IL",ncessch:"170861003058"},
    {name:"Evanston Township High School",city:"Evanston",state:"IL",ncessch:"170993001524"},
    {name:"Oak Park and River Forest High School",city:"Oak Park",state:"IL",ncessch:"172771003021"},
    {name:"York Community High School",city:"Elmhurst",state:"IL",ncessch:"170861004435"},
    {name:"Lyons Township High School",city:"La Grange",state:"IL",ncessch:"171053002030"},
    {name:"Stevenson High School",city:"Lincolnshire",state:"IL",ncessch:"170993004217"},
    {name:"Glenbrook North High School",city:"Northbrook",state:"IL",ncessch:"170993001970"},
    {name:"Glenbrook South High School",city:"Glenview",state:"IL",ncessch:"170993001971"},
    {name:"Maine South High School",city:"Park Ridge",state:"IL",ncessch:"170861002087"},
    {name:"Maine West High School",city:"Des Plaines",state:"IL",ncessch:"170861002088"},
    {name:"Niles West High School",city:"Skokie",state:"IL",ncessch:"170861003106"},
    {name:"Niles North High School",city:"Skokie",state:"IL",ncessch:"170861003105"},
    // California
    {name:"Mission San Jose High School",city:"Fremont",state:"CA",ncessch:"062271005700"},
    {name:"Irvington High School",city:"Fremont",state:"CA",ncessch:"062271003336"},
    {name:"Fremont High School",city:"Sunnyvale",state:"CA",ncessch:"063441001875"},
    {name:"Palo Alto High School",city:"Palo Alto",state:"CA",ncessch:"063135005037"},
    {name:"Gunn High School",city:"Palo Alto",state:"CA",ncessch:"063135002101"},
    {name:"Los Altos High School",city:"Los Altos",state:"CA",ncessch:"063135003547"},
    {name:"Mountain View High School",city:"Mountain View",state:"CA",ncessch:"063135004222"},
    {name:"Lynbrook High School",city:"San Jose",state:"CA",ncessch:"063441003719"},
    {name:"Saratoga High School",city:"Saratoga",state:"CA",ncessch:"064122006124"},
    {name:"Monta Vista High School",city:"Cupertino",state:"CA",ncessch:"064119004219"},
    {name:"Cupertino High School",city:"Cupertino",state:"CA",ncessch:"064119001497"},
    {name:"Homestead High School",city:"Cupertino",state:"CA",ncessch:"064119002971"},
    {name:"Westview High School",city:"San Diego",state:"CA",ncessch:"060699013219"},
    {name:"Torrey Pines High School",city:"San Diego",state:"CA",ncessch:"060699012039"},
    {name:"Canyon Crest Academy",city:"San Diego",state:"CA",ncessch:"060699009690"},
    // New York
    {name:"Stuyvesant High School",city:"New York",state:"NY",ncessch:"360007703199"},
    {name:"Bronx Science High School",city:"New York",state:"NY",ncessch:"360007700226"},
    {name:"Brooklyn Technical High School",city:"New York",state:"NY",ncessch:"360007700249"},
    {name:"Great Neck North High School",city:"Great Neck",state:"NY",ncessch:"360407501533"},
    {name:"Great Neck South High School",city:"Great Neck",state:"NY",ncessch:"360407501534"},
    {name:"Jericho High School",city:"Jericho",state:"NY",ncessch:"360507502141"},
    {name:"Syosset High School",city:"Syosset",state:"NY",ncessch:"360207503396"},
    {name:"Scarsdale High School",city:"Scarsdale",state:"NY",ncessch:"360610500099"},
    // Texas
    {name:"Plano Senior High School",city:"Plano",state:"TX",ncessch:"482814007730"},
    {name:"Plano East Senior High School",city:"Plano",state:"TX",ncessch:"482814007731"},
    {name:"Plano West Senior High School",city:"Plano",state:"TX",ncessch:"482814011327"},
    {name:"Allen High School",city:"Allen",state:"TX",ncessch:"482814012101"},
    {name:"Coppell High School",city:"Coppell",state:"TX",ncessch:"482814006023"},
    {name:"Westlake High School",city:"Austin",state:"TX",ncessch:"481686008802"},
    {name:"Lake Travis High School",city:"Austin",state:"TX",ncessch:"481695007048"},
    {name:"Liberal Arts and Science Academy",city:"Austin",state:"TX",ncessch:"481686008824"},
    // New Jersey
    {name:"West Windsor Plainsboro High School North",city:"Plainsboro",state:"NJ",ncessch:"341710004685"},
    {name:"West Windsor Plainsboro High School South",city:"Princeton Junction",state:"NJ",ncessch:"341710004686"},
    {name:"Princeton High School",city:"Princeton",state:"NJ",ncessch:"341060003502"},
    {name:"Montgomery High School",city:"Skillman",state:"NJ",ncessch:"341710003325"},
    {name:"Millburn High School",city:"Millburn",state:"NJ",ncessch:"340930002878"},
    // Massachusetts
    {name:"Lexington High School",city:"Lexington",state:"MA",ncessch:"220945002483"},
    {name:"Newton South High School",city:"Newton Center",state:"MA",ncessch:"220975003461"},
    {name:"Newton North High School",city:"Newtonville",state:"MA",ncessch:"220975003460"},
    {name:"Wellesley High School",city:"Wellesley",state:"MA",ncessch:"221680004989"},
    {name:"Weston High School",city:"Weston",state:"MA",ncessch:"221695005007"},
    {name:"Acton Boxborough Regional High School",city:"Acton",state:"MA",ncessch:"220015000024"},
    // Virginia
    {name:"Thomas Jefferson High School for Science and Technology",city:"Alexandria",state:"VA",ncessch:"510005403191"},
    {name:"McLean High School",city:"McLean",state:"VA",ncessch:"510006001983"},
    {name:"Langley High School",city:"McLean",state:"VA",ncessch:"510006001836"},
    {name:"Westfield High School",city:"Chantilly",state:"VA",ncessch:"510006003356"},
    {name:"Chantilly High School",city:"Chantilly",state:"VA",ncessch:"510006000610"},
    // Washington
    {name:"Interlake High School",city:"Bellevue",state:"WA",ncessch:"530330000633"},
    {name:"Newport High School",city:"Bellevue",state:"WA",ncessch:"530330001131"},
    {name:"Bellevue High School",city:"Bellevue",state:"WA",ncessch:"530330000099"},
    {name:"Eastlake High School",city:"Sammamish",state:"WA",ncessch:"531806001843"},
    {name:"Skyline High School",city:"Sammamish",state:"WA",ncessch:"531806002459"},
    {name:"Mercer Island High School",city:"Mercer Island",state:"WA",ncessch:"530480000961"},
    // Georgia
    {name:"Northview High School",city:"Johns Creek",state:"GA",ncessch:"131230004028"},
    {name:"Johns Creek High School",city:"Johns Creek",state:"GA",ncessch:"131230003954"},
    {name:"Alpharetta High School",city:"Alpharetta",state:"GA",ncessch:"131230000027"},
    {name:"Milton High School",city:"Milton",state:"GA",ncessch:"131230003780"},
    {name:"Chattahoochee High School",city:"Johns Creek",state:"GA",ncessch:"131230000500"},
  ];

  async function searchSchools(q){
    const q2=q.toLowerCase().trim();
    if(!q2) return [];

    // 1. Local results — instant
    const localMatches=LOCAL_SCHOOLS.filter(s=>
      s.name.toLowerCase().includes(q2)||
      s.city.toLowerCase().includes(q2)||
      s.state.toLowerCase()===q2
    ).slice(0,6);

    // 2. Fire both APIs in parallel, race them
    const enc=encodeURIComponent(q);
    const odsUrl=`https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/us-public-schools/records?where=search(NAME%2C%22${enc}%22)%20AND%20LEVEL%3D%22High%22&limit=10&select=NAME%2CCITY%2CSTATE%2CNCESSCH&order_by=NAME`;
    // CORS proxy as backup for OpenDataSoft
    const proxyUrl=`https://corsproxy.io/?url=${encodeURIComponent(odsUrl)}`;

    function parseODS(d){
      return(d.results||[]).map(s=>({
        name:s.NAME||s.name||"",city:s.CITY||s.city||"",
        state:s.STATE||s.state||"",ncessch:s.NCESSCH||s.ncessch||""
      })).filter(s=>s.name&&s.ncessch);
    }

    const [odsResult, proxyResult] = await Promise.allSettled([
      fetch(odsUrl,{signal:AbortSignal.timeout(5000)}).then(r=>r.json()).then(parseODS).catch(()=>[]),
      fetch(proxyUrl,{signal:AbortSignal.timeout(6000)}).then(r=>r.json()).then(parseODS).catch(()=>[]),
    ]);

    const apiResults=[
      ...(odsResult.status==="fulfilled"?odsResult.value:[]),
      ...(proxyResult.status==="fulfilled"?proxyResult.value:[]),
    ];

    // Deduplicate by ncessch
    const seen=new Set();
    const dedupedApi=apiResults.filter(s=>{
      if(seen.has(s.ncessch))return false;
      seen.add(s.ncessch);return true;
    });

    // Merge: local first, then API results not already in local list
    const merged=[
      ...localMatches,
      ...dedupedApi.filter(a=>!localMatches.some(l=>l.ncessch===a.ncessch))
    ].slice(0,12);

    return merged.length?merged:localMatches;
  }

  function wizAddClasses(){
    if(!schoolWiz?.periods) return;
    // If this is the first person from the school, save bell schedule for others
    if(!schoolWiz.bellFound && user && schoolWiz.school?.ncessch){
      const bellData={
        school:schoolWiz.school.name,
        numPeriods:schoolWiz.numPeriods,
        periods:schoolWiz.periods.map(p=>({label:p.label,start:p.start,end:p.end,days:p.days}))
      };
      saveBellSchedule(schoolWiz.school.ncessch, bellData, user.idToken);
    }
    const colors=[...SUBJECT_COLORS];
    const newClasses=[];
    let colorIdx=0;
    schoolWiz.periods.forEach((p,i)=>{
      const className=p.fixed?p.label:(p.name||p.label);
      if(p.dayGroups){
        // Create one class entry per day group so timetable shows correct times per day
        const color=colors[colorIdx%colors.length]; colorIdx++;
        p.dayGroups.forEach((dg,dgi)=>{
          newClasses.push({
            id:Date.now().toString()+i+"_"+dgi,
            name:className,
            days:dg.days,
            startTime:dg.start,
            endTime:dg.end,
            room:"",
            color,
          });
        });
      } else {
        newClasses.push({
          id:Date.now().toString()+i,
          name:className,
          days:p.days||["Mon","Tue","Wed","Thu","Fri"],
          startTime:p.start,
          endTime:p.end,
          room:"",
          color:colors[colorIdx%colors.length],
        });
        colorIdx++;
      }
    });
    setClasses(prev=>[...prev,...newClasses]);
    if(user)fbIncrementStat("totalClasses",newClasses.length,user.idToken);
    setSchoolWiz(null);
  }
  function delClass(id){setClasses(p=>p.filter(x=>x.id!==id));}

  const subjects=[...new Set([...classes.map(c=>c.name),...assignments.map(a=>a.subject)])].filter(Boolean);
  const todayC=classes.filter(c=>c.days.includes(todayAbbr()));
  const upcoming=[...assignments].filter(a=>a.progress<100).sort((a,b)=>new Date(a.dueDate)-new Date(b.dueDate));
  const overdue=assignments.filter(a=>daysUntil(a.dueDate)<0&&a.progress<100);
  const dueToday=assignments.filter(a=>daysUntil(a.dueDate)===0&&a.progress<100);
  const completed=assignments.filter(a=>a.progress>=100);
  const filteredA=filter==="all"?assignments:assignments.filter(a=>a.subject===filter);
  const sortedA=[...filteredA].sort((a,b)=>{if(!a.dueDate)return 1;if(!b.dueDate)return -1;return new Date(a.dueDate)-new Date(b.dueDate);});

  function ACard({a,compact}){
    const color=subjectColor(a.subject,classes);
    const days=daysUntil(a.dueDate);
    const done=a.progress>=100;
    const ov=days<0&&!done;
    let dueText="",dueColor="var(--text4)";
    if(done){dueText="✓ Done";dueColor="#16a34a";}
    else if(ov){dueText=Math.abs(days)+"d overdue";dueColor="#ef4444";}
    else if(days===0){dueText="Due today";dueColor="#f59e0b";}
    else if(days===1){dueText="Tomorrow";dueColor="#f59e0b";}
    else if(a.dueDate){dueText=fmtDate(a.dueDate);}
    const PC={high:{bg:"#fef2f2",c:"#dc2626"},medium:{bg:"#fffbeb",c:"#d97706"},low:{bg:"#f0fdf4",c:"#16a34a"}};
    const DPC={high:{bg:"#350000",c:"#f87171"},medium:{bg:"#261200",c:"#fbbf24"},low:{bg:"#001400",c:"#4ade80"}};
    const pc=(darkMode?DPC:PC)[a.priority]||(darkMode?DPC.medium:PC.medium);
    const submitRef=useRef(null);
    // Grade color
    const gradeColor=!a.grade?null:a.grade>=90?"#16a34a":a.grade>=80?"#2563eb":a.grade>=70?"#d97706":"#dc2626";
    return(
      <div className={"acard"+(ov?" ov":"")} style={{opacity:done?.6:1}}>
        <div className="stripe" style={{background:color,opacity:done?.5:1}}/>
        <div className="amain">
          <div className="atitle" style={{textDecoration:done?"line-through":"none",opacity:done?.7:1}}>{a.title}</div>
          <div className="ameta">
            <span className="mtag" style={{color}}>● {a.subject}</span>
            <span className="ppill" style={{background:pc.bg,color:pc.c}}>{PRIORITY[a.priority]?.label||"Medium"}</span>
            {dueText&&<span className="dbadge" style={{color:dueColor}}>{dueText}</span>}
            {a.grade!=null&&<span style={{fontSize:".7rem",fontWeight:800,color:gradeColor,background:darkMode?"rgba(0,0,0,.3)":"rgba(0,0,0,.06)",padding:"2px 7px",borderRadius:6}}>{a.grade}%{a.gradeRaw&&<span style={{fontWeight:400,opacity:.7}}> ({a.gradeRaw})</span>}</span>}
          </div>
          {!compact&&<div className="qbtns">{[0,25,50,75,100].map(v=><button key={v} className={"qbtn"+(a.progress===v?" on":"")} onClick={()=>updateA(a.id,{progress:v})}>{v}%</button>)}</div>}
        </div>
        {!compact&&<div className="pbar-wrap"><div className="pbar-track"><div className="pbar-fill" style={{width:a.progress+"%",background:done?"#16a34a":color}}/></div><div className="plabel">{a.progress}%</div></div>}
        {!done&&<button ref={submitRef} className={"submit-btn"+(compact?" compact":"")} onClick={()=>{launchConfetti(submitRef.current);updateA(a.id,{progress:100});}}>✓ Submit</button>}
        {done&&<span className={"submit-btn done"+(compact?" compact":"")}>✓ Done</span>}
        <button className="ibtn" onClick={()=>delAssignment(a.id)}>✕</button>
      </div>
    );
  }

  function SubjectPicker({value,onChange}){
    const schSubs=classes.map(c=>c.name);
    const prevSubs=[...new Set(assignments.map(a=>a.subject).filter(Boolean))].filter(s=>!schSubs.includes(s));
    const all=[...schSubs,...prevSubs];
    if(all.length===0||subjMode==="type"){
      return(
        <div style={{display:"flex",gap:6}}>
          <input className="finp" style={{flex:1}} value={value} onChange={e=>onChange(e.target.value)} placeholder="Type subject name..." autoFocus={subjMode==="type"}/>
          {all.length>0&&<button type="button" className="btn btn-sm btn-g" onClick={()=>{setSubjMode("select");onChange("");}}>← Back</button>}
        </div>
      );
    }
    return(
      <select className="fsel" value={value} onChange={e=>{if(e.target.value==="__new"){setSubjMode("type");onChange("");}else onChange(e.target.value);}}>
        <option value="">— Select class —</option>
        {schSubs.length>0&&<optgroup label="📅 From Schedule">{schSubs.map(s=><option key={s} value={s}>{s}</option>)}</optgroup>}
        {prevSubs.length>0&&<optgroup label="📝 Previous">{prevSubs.map(s=><option key={s} value={s}>{s}</option>)}</optgroup>}
        <option value="__new">＋ Type a new one…</option>
      </select>
    );
  }

  const dateStr=new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
  const todayStr2=new Date().toISOString().split("T")[0];
  const todayCnt=game.dailyDate===todayStr2?game.dailyCount:0;

  // ── /admin route — checked BEFORE authLoading so it never shows blank/spinner ──
  if(isAdminRoute){
    if(!user){
      return <AuthScreen adminMode adminEmail={ADMIN_EMAIL} onAuth={u=>{
        setUser(u);
        fbLoadData(u.uid,u.idToken).then(d=>{
          if(d){setAssignments(d.a||[]);setClasses(d.c||[]);if(d.g)setGame(d.g);}
          saveReady.current=true;
        });
        if(u.email!==ADMIN_EMAIL){
          // Wrong account — boot them
          setTimeout(()=>{fbClearSession();setUser(null);},100);
        }
      }}/>;
    }
    if(user.email!==ADMIN_EMAIL){
      return(
        <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0F1117",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
          <div style={{background:"#161921",border:"1.5px solid #262B3C",borderRadius:20,padding:"40px 32px",textAlign:"center",maxWidth:380}}>
            <div style={{fontSize:"2.5rem",marginBottom:12}}>🚫</div>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:"1.3rem",fontWeight:700,color:"#DDE2F5",marginBottom:8}}>Access Denied</div>
            <div style={{fontSize:".85rem",color:"#5C6480",marginBottom:24}}>
              <b style={{color:"#DDE2F5"}}>{user.email}</b> doesn't have admin access.
            </div>
            <button onClick={()=>{fbClearSession();setUser(null);}}
              style={{padding:"10px 24px",borderRadius:12,border:"none",background:"#6366f1",color:"#fff",fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,cursor:"pointer",fontSize:".85rem"}}>
              ↩ Sign in with a different account
            </button>
          </div>
        </div>
      );
    }
    // Correct email — show full admin panel
    return(
      <div style={{minHeight:"100vh",background:"#0F1117",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}`}</style>
        <div style={{padding:"14px 24px",borderBottom:"1px solid #262B3C",display:"flex",alignItems:"center",gap:12,background:"#161921",position:"sticky",top:0,zIndex:10}}>
          <div style={{fontFamily:"'Fraunces',serif",fontSize:"1.15rem",fontWeight:700,color:"#DDE2F5"}}>📊 StudyDesk Admin</div>
          <div style={{marginLeft:"auto",fontSize:".74rem",color:"#5C6480"}}>{user.email}</div>
          <button onClick={()=>{fbClearSession();setUser(null);window.location.hash="";}}
            style={{padding:"6px 14px",borderRadius:9,border:"1.5px solid #262B3C",background:"transparent",color:"#5C6480",fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:600,fontSize:".78rem",cursor:"pointer"}}>
            ↩ Exit
          </button>
        </div>
        <div style={{padding:"28px 24px",maxWidth:960,margin:"0 auto"}}>
          <AdminPanel user={user} onClose={()=>{}} inline/>
        </div>
      </div>
    );
  }

  if(authLoading) return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--bg)",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600&display=swap');*{box-sizing:border-box;margin:0;padding:0}:root{--bg:#F5F2EC}.dark{--bg:#0F1117}body{background:var(--bg)}`}</style>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:"2.5rem",marginBottom:12,animation:"spin 1s linear infinite",display:"inline-block"}}>📚</div>
        <div style={{fontSize:".9rem",color:"#888",fontWeight:600}}>Loading...</div>
      </div>
    </div>
  );

  if(!user) return <AuthScreen onAuth={u=>{setUser(u);fbLoadData(u.uid,u.idToken).then(d=>{if(d){setAssignments(d.a||[]);setClasses(d.c||[]);if(d.g)setGame(d.g);}saveReady.current=true;setLoaded(true);const sv=localStorage.getItem("studydesk-seen-version");if(sv!==APP_VERSION)setShowReleases(true);});}}/>;

  return(
    <>
      <style>{css}</style>
      <div className={"dk"+(darkMode?" dark":"")}>
      <div className="app">

        {/* HEADER */}
        <div className="hdr">
          <div>
            <div className="hdr-title" onClick={handleLogoClick} style={{cursor:"default",userSelect:"none"}} title="Study Desk">Study Desk</div>
            <div className="hdr-sub">{dateStr}</div>
          </div>
          <div className="hdr-r">
            {game.streak>0&&<div className="streak-pill">🔥 {game.streak}d</div>}
            <div className="pts-pill">⭐ {game.points}</div>
            {canvasToken&&(
              <div onClick={()=>{if(canvasSync.error)setCanvasSync(s=>({...s,error:""}));else syncCanvas(canvasToken,canvasBaseUrl);}} title={canvasSync.error?"Click to dismiss":"Click to sync Canvas now"}
                style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:20,border:"1.5px solid",
                  borderColor:canvasSync.error?"#fca5a5":canvasSync.newSubmissions>0?"#86efac":"var(--border2)",
                  background:canvasSync.error?"#fef2f2":canvasSync.newSubmissions>0?"#f0fdf4":"var(--bg3)",
                  cursor:"pointer",fontSize:".72rem",fontWeight:700,
                  color:canvasSync.error?"#dc2626":canvasSync.newSubmissions>0?"#16a34a":"var(--text3)"}}>
                <span style={{animation:canvasSync.syncing?"spin .8s linear infinite":"",display:"inline-block"}}>
                  {canvasSync.syncing?"⟳":canvasSync.error?"⚠️":canvasSync.newSubmissions>0?"✅":"🎓"}
                </span>
                {canvasSync.syncing?"Syncing...":canvasSync.error?"Sync error — tap to dismiss":canvasSync.newSubmissions>0?`${canvasSync.newSubmissions} submitted!`:canvasSync.lastSync?`Synced ${new Date(canvasSync.lastSync).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}`:canvasToken?"Canvas connected":""}
              </div>
            )}
            {!canvasToken&&<button className="btn btn-g btn-sm" onClick={()=>setShowCanvasSetup(true)} style={{borderColor:"#c7d2fe",color:"#4338ca"}}>🎓 Canvas</button>}
            <button className="btn btn-p btn-sm" onClick={()=>{setImportMode("canvas");setImportOpen(true);}}>＋ Import</button>
            <button className="hdr-icon-btn" onClick={()=>setDarkMode(d=>!d)} title={darkMode?"Light mode":"Dark mode"}>{darkMode?"🌙":"☀️"}</button>
            <button className="hdr-icon-btn" title="What's new" onClick={()=>setShowReleases(true)}>
              🚀{localStorage.getItem("studydesk-seen-version")!==APP_VERSION&&<span className="notif-dot"/>}
            </button>
            <a href="https://docs.google.com/forms/d/e/1FAIpQLSeadDtMTet9ZndDOsF9hNtViwRK7tU-nzK38CjVWZZmeRtqGA/viewform?usp=publish-editor" target="_blank" rel="noreferrer" className="hdr-icon-btn" style={{textDecoration:"none"}} title="Suggest a feature">💡</a>
            <button className="hdr-icon-btn" onClick={()=>setShowAbout(true)} title="About">ℹ️</button>
            {user&&(
              <div style={{position:"relative"}}>
                <div className="auth-user-pill" onClick={()=>setShowUserMenu(m=>!m)}
                  style={{cursor:"pointer",userSelect:"none",paddingRight:12}}>
                  <div className="auth-avatar">
                    {user.photoURL?<img src={user.photoURL} width="22" height="22" style={{borderRadius:"50%"}}/>:(user.displayName||user.email||"?")[0].toUpperCase()}
                  </div>
                  <span style={{maxWidth:90,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.displayName||user.email.split("@")[0]}</span>
                  <span style={{fontSize:".6rem",opacity:.5,marginLeft:2}}>{showUserMenu?"▲":"▼"}</span>
                </div>
                {showUserMenu&&(
                  <>
                    <div style={{position:"fixed",inset:0,zIndex:99}} onClick={()=>setShowUserMenu(false)}/>
                    <div style={{position:"absolute",right:0,top:"calc(100% + 6px)",background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:12,boxShadow:"0 8px 24px var(--sh)",zIndex:100,minWidth:160,overflow:"hidden"}}>
                      <div style={{padding:"10px 14px",borderBottom:"1px solid var(--border)"}}>
                        <div style={{fontWeight:700,fontSize:".82rem",color:"var(--text)"}}>{user.displayName||user.email.split("@")[0]}</div>
                        <div style={{fontSize:".7rem",color:"var(--text4)",marginTop:1}}>{user.email}</div>
                      </div>
                      <button onClick={()=>{setShowUserMenu(false);fbClearSession();setUser(null);setAssignments([]);setClasses([]);setGame({points:0,streak:0,lastStreakDate:"",dailyDate:"",dailyCount:0,owned:[],equipped:{hat:"",face:"",body:"",special:""}});saveReady.current=false;}}
                        style={{width:"100%",padding:"10px 14px",background:"transparent",border:"none",textAlign:"left",cursor:"pointer",fontSize:".82rem",fontWeight:600,color:"#dc2626",fontFamily:"'Plus Jakarta Sans',sans-serif",display:"flex",alignItems:"center",gap:8}}>
                        ↩ Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* TABS */}
        <div className="tabs">
          {[["dashboard","📊 Dashboard"],["assignments","📝 Assignments"],["grades","📈 Grades"],["schedule","📅 Schedule"],["buddy","🐣 Buddy"],["shop","🛍️ Shop"]].map(([t,l])=>(
            <button key={t} className={"tab"+(tab===t?" on":"")} onClick={()=>setTab(t)}>{l}</button>
          ))}
        </div>

        {/* ═══ DASHBOARD ═══════════════════════════════════════════════ */}
        {tab==="dashboard"&&(
          <div>
            <div className="stats">
              <div className="stat"><div className="sacc" style={{background:"#6366f1"}}/><div className="stat-ico">📝</div><div className="stat-n">{assignments.filter(a=>a.progress<100).length}</div><div className="stat-l">Pending</div></div>
              <div className="stat" style={{borderColor:overdue.length?"#fca5a5":""}}><div className="sacc" style={{background:overdue.length?"#ef4444":"#10b981"}}/><div className="stat-ico">⚠️</div><div className="stat-n" style={{color:overdue.length?"#ef4444":""}}>{overdue.length}</div><div className="stat-l">Overdue</div></div>
              <div className="stat"><div className="sacc" style={{background:"#f59e0b"}}/><div className="stat-ico">📅</div><div className="stat-n">{dueToday.length}</div><div className="stat-l">Due Today</div></div>
              <div className="stat"><div className="sacc" style={{background:"#10b981"}}/><div className="stat-ico">✅</div><div className="stat-n">{completed.length}</div><div className="stat-l">Done</div></div>
              <div className="stat"><div className="sacc" style={{background:"#8b5cf6"}}/><div className="stat-ico">🏫</div><div className="stat-n">{classes.length}</div><div className="stat-l">Classes</div></div>
            </div>

            {todayCnt>0&&(
              <div className="quest-strip">
                <div style={{display:"flex",gap:8}}>
                  {[0,1,2].map(n=><div key={n} className={"qpip"+(todayCnt>n?" lit":"")}>{todayCnt>n?"✓":""}</div>)}
                </div>
                <div>
                  <div style={{fontSize:".7rem",fontWeight:800,color:"#D97706",textTransform:"uppercase",letterSpacing:".07em"}}>Daily Quest</div>
                  <div style={{fontSize:".84rem",fontWeight:600,color:"var(--text)"}}>{todayCnt>=3?"🔥 Streak extended to "+game.streak+" days!":(3-todayCnt)+" more assignment"+(3-todayCnt!==1?"s":"")+" for streak bonus"}</div>
                </div>
              </div>
            )}

            <div className="dash-grid">
              <div className="dcard">
                <div className="dcard-hdr">
                  <span>📋</span><span className="dcard-title">Upcoming Work</span>
                  <span style={{marginLeft:"auto",fontSize:".72rem",fontWeight:700,color:"var(--text3)"}}>{upcoming.length} pending</span>
                </div>
                <div className="dcard-body">
                  {upcoming.slice(0,8).map(a=>{
                    return <ACard key={a.id} a={a} compact/>;
                  })}
                  {upcoming.length===0&&<div className="empty"><div className="empty-i">🎉</div><div className="empty-t">All caught up!</div></div>}
                </div>
              </div>

              <div className="dcard">
                <div className="dcard-hdr">
                  <span>🏫</span><span className="dcard-title">Today — {todayAbbr()}</span>
                  <span style={{marginLeft:"auto",fontSize:".72rem",fontWeight:700,color:"var(--text3)"}}>{todayC.length} class{todayC.length!==1?"es":""}</span>
                </div>
                <div className="dcard-body">
                  {[...todayC].sort((a,b)=>a.startTime.localeCompare(b.startTime)).map(c=>{
                    const ca=assignments.filter(a=>a.subject===c.name&&a.progress<100&&daysUntil(a.dueDate)<=3);
                    return(
                      <div key={c.id} className="tccard">
                        <div className="tcdot" style={{background:c.color}}/>
                        <div style={{flex:1,minWidth:0}}>
                          <div className="tcname">{c.name}</div>
                          {c.room&&<div className="tcroom">📍 {c.room}</div>}
                          {ca.length>0&&<div style={{fontSize:".66rem",color:c.color,fontWeight:700,marginTop:2}}>{ca.length} due soon</div>}
                        </div>
                        <div className="tctime">{fmt12(c.startTime)}<br/><span style={{fontSize:".62rem",color:"var(--text4)"}}>–{fmt12(c.endTime)}</span></div>
                      </div>
                    );
                  })}
                  {todayC.length===0&&<div className="empty"><div className="empty-i">📅</div><div className="empty-t">No classes today</div></div>}
                </div>
              </div>
            </div>

            {overdue.length>0&&(
              <div style={{marginTop:20}}>
                <div className="sec-hd"><div className="sec-t" style={{color:"#ef4444"}}>⚠️ Overdue</div><span style={{fontSize:".75rem",color:"#ef4444",fontWeight:700}}>{overdue.length} item{overdue.length!==1?"s":""}</span></div>
                <div className="alist">{overdue.map(a=><ACard key={a.id} a={a}/>)}</div>
              </div>
            )}
          </div>
        )}

        {/* ═══ ASSIGNMENTS ════════════════════════════════════════════ */}
        {tab==="assignments"&&(()=>{
          const pending=sortedA.filter(a=>a.progress<100);
          const done=sortedA.filter(a=>a.progress>=100);
          return(
          <div>
            <div className="sec-hd">
              <div className="sec-t">Assignments</div>
              <div style={{display:"flex",gap:7,alignItems:"center"}}>
                <span style={{fontSize:".75rem",color:"var(--text3)",fontWeight:600}}>{pending.length} pending · {done.length} done</span>
                <button className="btn btn-p btn-sm" onClick={()=>{setSubjMode("select");setAddingA(true);}}>＋ Add</button>
              </div>
            </div>
            <div className="sfilt">
              {["all",...subjects].map(s=>(
                <button key={s} className="sfbtn" onClick={()=>setFilter(s)}
                  style={filter===s?{background:s==="all"?"var(--accent)":subjectColor(s,classes),borderColor:s==="all"?"var(--accent)":subjectColor(s,classes),color:"#fff"}:{}}>
                  {s==="all"?"✦ All":s}
                </button>
              ))}
            </div>
            {pending.length>0&&(
              <div style={{marginBottom:22}}>
                <div className="sec-lbl">Pending — {pending.length}</div>
                <div className="alist">{pending.map(a=><ACard key={a.id} a={a}/>)}</div>
              </div>
            )}
            {done.length>0&&(
              <div>
                <div className="sec-lbl">Completed — {done.length}</div>
                <div className="alist" style={{opacity:.55}}>{done.map(a=><ACard key={a.id} a={a}/>)}</div>
              </div>
            )}
            {sortedA.length===0&&(
              <div className="empty" style={{background:"var(--card)",border:"1.5px dashed var(--border2)",borderRadius:18,padding:"52px 20px"}}>
                <div className="empty-i">📝</div>
                <div className="empty-t">No assignments yet</div>
                <div style={{fontSize:".78rem",color:"var(--text4)",marginTop:8,marginBottom:18}}>Add assignments manually or import from Canvas or Google Slides</div>
                <button className="btn btn-p" onClick={()=>{setSubjMode("select");setAddingA(true);}}>＋ Add First Assignment</button>
              </div>
            )}
          </div>
          );
        })()}

        {/* ═══ GRADES ════════════════════════════════════════════════ */}
        {tab==="grades"&&(()=>{
          // Build per-class grade data from assignments that have a grade
          const graded=assignments.filter(a=>a.grade!=null);

          // Per-class stats
          const classStats=classes.map(cls=>{
            const clsGraded=graded.filter(a=>a.subject===cls.name);
            const clsAll=assignments.filter(a=>a.subject===cls.name);
            if(clsGraded.length===0) return{cls,avg:null,grades:[],total:clsAll.length,pending:clsAll.filter(a=>a.progress<100).length};
            // Weighted average if gradeRaw available, else simple average
            let totalPts=0,totalPoss=0,simpleSum=0;
            for(const a of clsGraded){
              if(a.gradeRaw){
                const m=a.gradeRaw.match(/^([\d.]+)\/([\d.]+)$/);
                if(m){totalPts+=parseFloat(m[1]);totalPoss+=parseFloat(m[2]);}
                else simpleSum+=a.grade;
              } else simpleSum+=a.grade;
            }
            const avg=totalPoss>0?Math.round((totalPts/totalPoss)*100):Math.round(simpleSum/clsGraded.length);
            return{cls,avg,grades:clsGraded,total:clsAll.length,pending:clsAll.filter(a=>a.progress<100).length};
          });

          // Include subjects from assignments not in schedule
          const schedSubjects=new Set(classes.map(c=>c.name));
          const extraSubjects=[...new Set(graded.map(a=>a.subject).filter(s=>s&&!schedSubjects.has(s)))];
          const extraStats=extraSubjects.map(subj=>{
            const clsGraded=graded.filter(a=>a.subject===subj);
            const clsAll=assignments.filter(a=>a.subject===subj);
            let totalPts=0,totalPoss=0,simpleSum=0;
            for(const a of clsGraded){
              if(a.gradeRaw){const m=a.gradeRaw.match(/^([\d.]+)\/([\d.]+)$/);if(m){totalPts+=parseFloat(m[1]);totalPoss+=parseFloat(m[2]);}else simpleSum+=a.grade;}
              else simpleSum+=a.grade;
            }
            const avg=totalPoss>0?Math.round((totalPts/totalPoss)*100):Math.round(simpleSum/clsGraded.length);
            return{cls:{name:subj,color:subjectColor(subj,classes)},avg,grades:clsGraded,total:clsAll.length,pending:clsAll.filter(a=>a.progress<100).length};
          });

          const allStats=[...classStats,...extraStats].filter(s=>s.total>0||s.grades.length>0);
          const withGrades=allStats.filter(s=>s.avg!==null);

          // Overall GPA (simple average of class averages)
          const overallAvg=withGrades.length>0?Math.round(withGrades.reduce((s,c)=>s+c.avg,0)/withGrades.length):null;

          function letterGrade(g){if(!g)return"—";if(g>=97)return"A+";if(g>=93)return"A";if(g>=90)return"A−";if(g>=87)return"B+";if(g>=83)return"B";if(g>=80)return"B−";if(g>=77)return"C+";if(g>=73)return"C";if(g>=70)return"C−";if(g>=67)return"D+";if(g>=63)return"D";if(g>=60)return"D−";return"F";}
          function gradeColor(g){if(!g)return"var(--text4)";if(g>=90)return"#16a34a";if(g>=80)return"#2563eb";if(g>=70)return"#d97706";return"#dc2626";}
          function gradeBg(g){if(!g)return"var(--bg3)";if(g>=90)return darkMode?"#001a0a":"#f0fdf4";if(g>=80)return darkMode?"#00102a":"#eff6ff";if(g>=70)return darkMode?"#1a1000":"#fffbeb";return darkMode?"#1a0000":"#fef2f2";}

          const [expandedClass, setExpandedClass] = [expandedGradeClass, setExpandedGradeClass];

          return(
            <div>
              {/* Overall GPA banner */}
              {overallAvg!==null&&(
                <div style={{background:`linear-gradient(135deg,${darkMode?"#1a1d2e":"#f8f6ff"},${darkMode?"#0f1117":"#fff"})`,border:`1.5px solid ${darkMode?"#2d2f4a":"#e0d7ff"}`,borderRadius:20,padding:"20px 24px",marginBottom:22,display:"flex",alignItems:"center",gap:20}}>
                  <div style={{textAlign:"center",minWidth:80}}>
                    <div style={{fontFamily:"'Fraunces',serif",fontSize:"3rem",fontWeight:700,color:gradeColor(overallAvg),lineHeight:1}}>{overallAvg}%</div>
                    <div style={{fontSize:"1.1rem",fontWeight:800,color:gradeColor(overallAvg)}}>{letterGrade(overallAvg)}</div>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"'Fraunces',serif",fontSize:"1.1rem",fontWeight:700,color:"var(--text)",marginBottom:4}}>Overall Average</div>
                    <div style={{fontSize:".78rem",color:"var(--text3)",marginBottom:10}}>{withGrades.length} class{withGrades.length!==1?"es":""} with grades · {graded.length} graded assignment{graded.length!==1?"s":""}</div>
                    {/* Mini bar showing grade distribution */}
                    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                      {withGrades.sort((a,b)=>b.avg-a.avg).map((s,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:20,background:gradeBg(s.avg),border:`1px solid ${gradeColor(s.avg)}33`}}>
                          <div style={{width:6,height:6,borderRadius:"50%",background:s.cls.color||"var(--accent)"}}/>
                          <span style={{fontSize:".68rem",fontWeight:700,color:gradeColor(s.avg)}}>{s.cls.name.length>12?s.cls.name.slice(0,12)+"…":s.cls.name} {s.avg}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {!canvasToken&&<button className="btn btn-g btn-sm" onClick={()=>setShowCanvasSetup(true)} style={{borderColor:"#c7d2fe",color:"#4338ca",whiteSpace:"nowrap",flexShrink:0}}>🎓 Auto-sync grades</button>}
                </div>
              )}

              {/* No grades yet */}
              {graded.length===0&&(
                <div className="empty" style={{background:"var(--card)",border:"1.5px dashed var(--border2)",borderRadius:18,padding:"52px 20px",marginBottom:20}}>
                  <div className="empty-i">📈</div>
                  <div className="empty-t">No grades yet</div>
                  <div style={{fontSize:".78rem",color:"var(--text4)",marginTop:8,marginBottom:18}}>Connect Canvas to auto-sync grades, or add them manually on each assignment</div>
                  {!canvasToken&&<button className="btn btn-p" style={{background:"#4338ca"}} onClick={()=>setShowCanvasSetup(true)}>🎓 Connect Canvas</button>}
                </div>
              )}

              {/* Per-class cards */}
              {allStats.length>0&&(
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  <div className="sec-lbl">{withGrades.length>0?"Classes":"All Classes"}</div>
                  {allStats.map((s,si)=>{
                    const isExpanded=expandedClass===s.cls.name;
                    const color=s.cls.color||subjectColor(s.cls.name,classes);
                    return(
                      <div key={si} style={{background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:18,overflow:"hidden",boxShadow:"0 2px 12px var(--sh)",transition:"box-shadow .15s"}}>
                        {/* Class header row */}
                        <div onClick={()=>setExpandedClass(isExpanded?null:s.cls.name)}
                          style={{display:"flex",alignItems:"center",gap:14,padding:"16px 18px",cursor:"pointer",userSelect:"none"}}>
                          <div style={{width:44,height:44,borderRadius:12,background:color,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:"1rem",flexShrink:0}}>
                            {s.cls.name[0]}
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontWeight:700,color:"var(--text)",fontSize:".95rem",marginBottom:2}}>{s.cls.name}</div>
                            <div style={{fontSize:".72rem",color:"var(--text3)"}}>{s.grades.length} graded · {s.pending} pending · {s.total} total</div>
                          </div>
                          {s.avg!==null?(
                            <div style={{textAlign:"right",flexShrink:0}}>
                              <div style={{fontFamily:"'Fraunces',serif",fontSize:"1.7rem",fontWeight:700,color:gradeColor(s.avg),lineHeight:1}}>{s.avg}%</div>
                              <div style={{fontSize:".8rem",fontWeight:800,color:gradeColor(s.avg)}}>{letterGrade(s.avg)}</div>
                            </div>
                          ):(
                            <div style={{fontSize:".76rem",color:"var(--text4)",fontWeight:600}}>No grades yet</div>
                          )}
                          <div style={{color:"var(--text4)",fontSize:".9rem",marginLeft:4}}>{isExpanded?"▲":"▼"}</div>
                        </div>

                        {/* Grade bar */}
                        {s.avg!==null&&(
                          <div style={{height:4,background:"var(--bg3)",margin:"0 18px 0"}}>
                            <div style={{width:s.avg+"%",height:"100%",background:gradeColor(s.avg),borderRadius:99,transition:"width .6s ease"}}/>
                          </div>
                        )}

                        {/* Expanded: assignment list */}
                        {isExpanded&&s.grades.length>0&&(
                          <div style={{padding:"12px 18px 16px",borderTop:"1.5px solid var(--border)",marginTop:8}}>
                            <div style={{fontSize:".68rem",fontWeight:800,color:"var(--text3)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:10}}>Graded Assignments</div>
                            <div style={{display:"flex",flexDirection:"column",gap:7}}>
                              {[...s.grades].sort((a,b)=>new Date(b.dueDate||0)-new Date(a.dueDate||0)).map((a,ai)=>(
                                <div key={ai} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:"var(--bg3)",borderRadius:10}}>
                                  <div style={{flex:1,minWidth:0}}>
                                    <div style={{fontWeight:600,color:"var(--text)",fontSize:".84rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.title}</div>
                                    {a.dueDate&&<div style={{fontSize:".69rem",color:"var(--text4)",marginTop:1}}>{fmtDate(a.dueDate)}</div>}
                                  </div>
                                  <div style={{textAlign:"right",flexShrink:0}}>
                                    <div style={{fontWeight:800,color:gradeColor(a.grade),fontSize:".9rem"}}>{a.grade}%</div>
                                    {a.gradeRaw&&<div style={{fontSize:".65rem",color:"var(--text4)"}}>{a.gradeRaw}</div>}
                                    <div style={{fontSize:".7rem",fontWeight:700,color:gradeColor(a.grade)}}>{letterGrade(a.grade)}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {isExpanded&&s.grades.length===0&&(
                          <div style={{padding:"12px 18px 16px",borderTop:"1.5px solid var(--border)",marginTop:8,fontSize:".8rem",color:"var(--text4)",textAlign:"center"}}>
                            No graded assignments yet for this class.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Manual grade add tip */}
              {graded.length>0&&!canvasToken&&(
                <div style={{marginTop:16,padding:"12px 16px",background:"var(--bg3)",border:"1.5px solid var(--border)",borderRadius:12,fontSize:".78rem",color:"var(--text3)",display:"flex",alignItems:"center",gap:10}}>
                  <span>💡</span>
                  <span>Connect Canvas to auto-sync grades, or set progress to 100% on an assignment and manually enter a grade by editing it.</span>
                  <button className="btn btn-g btn-sm" style={{marginLeft:"auto",flexShrink:0,borderColor:"#c7d2fe",color:"#4338ca"}} onClick={()=>setShowCanvasSetup(true)}>🎓 Connect</button>
                </div>
              )}
            </div>
          );
        })()}

        {/* ═══ SCHEDULE ══════════════════════════════════════════════ */}
        {tab==="schedule"&&(
          <div>
            <div className="sec-hd"><div className="sec-t">Class Schedule</div><div style={{display:"flex",gap:8}}><button className="btn btn-g btn-sm" onClick={()=>setSchoolWiz({step:"search",query:"",results:null,school:null,numPeriods:7,periods:[],currentPeriod:0})}>🏫 Import from School</button><button className="btn btn-p btn-sm" onClick={()=>setAddingC(true)}>＋ Add Class</button></div></div>
            {classes.length===0?(
              <div className="empty" style={{background:"var(--card)",border:"1.5px dashed var(--border2)",borderRadius:18,padding:"52px 20px"}}>
                <div className="empty-i">📅</div>
                <div className="empty-t">No classes yet</div>
                <div style={{fontSize:".78rem",color:"var(--text4)",marginTop:8,marginBottom:18}}>Add your weekly classes to see them on the timetable</div>
                <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}><button className="btn btn-g" onClick={()=>setSchoolWiz({step:"search",query:"",results:null,school:null,numPeriods:7,periods:[],currentPeriod:0})}>🏫 Import from School</button><button className="btn btn-p" onClick={()=>setAddingC(true)}>＋ Add Manually</button></div>
              </div>
            ):(
              <div className="sched-layout">
                <div>
                  <div className="sec-lbl">Your Classes</div>
                  <div className="sc-classes">
                    {[...classes].sort((a,b)=>a.startTime.localeCompare(b.startTime)).map(c=>{
                      const ca=assignments.filter(a=>a.subject===c.name&&a.progress<100);
                      return(
                        <div key={c.id} className="sc-card">
                          <div className="sc-dot" style={{background:c.color}}/>
                          <div style={{flex:1,minWidth:0}}>
                            <div className="sc-name">{c.name}</div>
                            <div className="sc-meta">{c.days.join(", ")} · {fmt12(c.startTime)}–{fmt12(c.endTime)}{c.room&&" · 📍"+c.room}</div>
                            {ca.length>0&&<div className="sc-badge" style={{color:c.color}}>{ca.length} pending</div>}
                          </div>
                          <button className="ibtn" onClick={()=>delClass(c.id)}>✕</button>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div className="sec-lbl">Weekly Timetable</div>
                  <div className="sgrid">
                    <div className="shdr">
                      <div className="shcell"/>
                      {DAYS.map(d=><div key={d} className={"shcell"+(d===todayAbbr()?" tdy":"")}>{d}</div>)}
                    </div>
                    {HOURS.map(h=>(
                      <div key={h} className="srow">
                        <div className="stime">{fmt12h(h)}</div>
                        {DAYS.map(d=>{
                          const ccs=classes.filter(c=>{
                            if(!c.days.includes(d))return false;
                            const[sh,sm]=c.startTime.split(":").map(Number);
                            const[eh,em]=c.endTime.split(":").map(Number);
                            // use floor of start hour so 7:45 shows in the 7am row
                            return h>=sh&&h<Math.ceil(eh+em/60);
                          });
                          return(
                            <div key={d} className={"scell"+(d===todayAbbr()?" tdy":"")}>
                              {ccs.map(c=><div key={c.id} className="cblock" style={{background:c.color}}><span style={{fontWeight:700}}>{c.name}</span>{c.room&&<span style={{opacity:.8,fontSize:".58rem"}}>📍{c.room}</span>}</div>)}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ BUDDY ════════════════════════════════════════════════ */}
        {tab==="buddy"&&(()=>{
          const st=getBuddyStage(game.streak);
          const info=BUDDY_STAGES[st];
          const pct=info.next?Math.min(100,Math.round(((game.streak-info.min)/(info.next-info.min))*100)):100;
          const eq=game.equipped||{};
          const eqItems=Object.values(eq).filter(Boolean).map(id=>SHOP_ITEMS.find(i=>i.id===id)).filter(Boolean);
          return(
            <div>
              <div className="buddy-shell">
                <div className="buddy-stage-name">{info.name}</div>
                <div className="buddy-stage-desc">{info.desc}</div>
                <div className="buddy-wrap"><div className="buddy-bounce" style={{width:"100%",height:"100%"}}><BuddyCreature stage={st} eq={eq}/></div></div>
                {eqItems.length>0&&<div className="eq-row">{eqItems.map(it=><span key={it.id} className="eq-chip">{it.emoji} {it.name}</span>)}</div>}
                {info.next&&<div style={{marginTop:14}}><div className="bplbl"><span>Next: {BUDDY_STAGES[st+1].name}</span><span>{game.streak}/{info.next} days</span></div><div className="bpbar"><div className="bpfill" style={{width:pct+"%"}}/></div></div>}
                {!info.next&&<div style={{textAlign:"center",marginTop:12,fontSize:".8rem",color:"#F59E0B",fontWeight:700}}>🌟 Legendary status achieved!</div>}
              </div>
              <div className="bstat-row">
                <div className="stat"><div className="sacc" style={{background:"#f59e0b"}}/><div className="stat-n" style={{fontSize:"1.4rem"}}>⭐{game.points}</div><div className="stat-l">Points</div></div>
                <div className="stat"><div className="sacc" style={{background:"#ea580c"}}/><div className="stat-n" style={{fontSize:"1.4rem"}}>🔥{game.streak}</div><div className="stat-l">Streak</div></div>
                <div className="stat"><div className="sacc" style={{background:"#8b5cf6"}}/><div className="stat-n" style={{fontSize:"1.4rem"}}>{st}/5</div><div className="stat-l">Stage</div></div>
              </div>
              <div className="quest-card">
                <div className="quest-title">📋 Daily Quest</div>
                <div className="quest-text">Complete 3 assignments today to {game.streak>0?"extend your "+game.streak+"-day streak!":"start your streak!"}</div>
                <div className="quest-pips">
                  {[0,1,2].map(n=><div key={n} className={"quest-pip"+(todayCnt>n?" lit":"")}>{todayCnt>n?"✓":"📝"}</div>)}
                  <div style={{marginLeft:10,fontSize:".78rem",color:"var(--text2)",fontWeight:600}}>{todayCnt>=3?<span style={{color:"#F59E0B"}}>+{Math.round(10+game.streak*4)} ⭐ earned!</span>:<span>{3-todayCnt} more</span>}</div>
                </div>
              </div>
              <div className="pts-how">
                <div style={{fontSize:".68rem",fontWeight:800,color:"var(--text3)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:10}}>How Points Work</div>
                <div className="pts-how-row"><span>✅ Complete an assignment</span><span className="pts-how-amt">+15 ⭐</span></div>
                <div style={{height:1,background:"var(--border)",margin:"6px 0"}}/>
                <div className="pts-how-row"><span>🔥 Daily streak bonus (3 per day)</span><span className="pts-how-amt">+{Math.round(10+game.streak*4)} ⭐</span></div>
                <div style={{height:1,background:"var(--border)",margin:"6px 0"}}/>
                <div style={{fontSize:".72rem",color:"var(--text4)",lineHeight:1.5}}>Higher streaks = bigger bonuses!</div>
              </div>
            </div>
          );
        })()}

        {/* ═══ SHOP ═════════════════════════════════════════════════ */}
        {tab==="shop"&&(
          <div>
            <div className="sec-hd"><div className="sec-t">🛍️ Shop</div><div className="pts-pill">⭐ {game.points}</div></div>
            <div className="shop-filter">
              {[["all","✦ All"],["hat","🎩 Hats"],["face","👓 Face"],["body","🎀 Body"],["special","✨ Special"]].map(([cat,lbl])=>(
                <button key={cat} className="sfbtn" onClick={()=>setShopCat(cat)} style={shopCat===cat?{background:"var(--accent)",color:"#fff",borderColor:"var(--accent)"}:{}}>{lbl}</button>
              ))}
            </div>
            <div className="shop-grid">
              {SHOP_ITEMS.filter(i=>shopCat==="all"||i.cat===shopCat).map(item=>{
                const owned=game.owned.includes(item.id);
                const equipped=game.equipped[item.cat]===item.id;
                const ok=game.points>=item.price;
                return(
                  <div key={item.id} className={"shop-card"+(owned?" owned":"")+(equipped?" equipped":"")}>
                    {owned&&<div className="shop-badge" style={{background:equipped?"var(--accent)":"#16a34a"}}>{equipped?"ON":"✓"}</div>}
                    <span className="shop-icon">{item.emoji}</span>
                    <div className="shop-name">{item.name}</div>
                    <div className="shop-cat">{item.cat}</div>
                    <div className="shop-desc">{item.desc}</div>
                    {owned?(
                      <button className={"btn btn-sm"+(equipped?" btn-p":" btn-g")} style={{width:"100%",justifyContent:"center"}} onClick={()=>equipItem(item.id)}>{equipped?"✓ Equipped":"Equip"}</button>
                    ):(
                      <button className="btn btn-sm btn-p" style={{width:"100%",justifyContent:"center",background:ok?"var(--accent)":"var(--bg3)",color:ok?"#fff":"var(--text4)",cursor:ok?"pointer":"not-allowed"}} onClick={()=>buyItem(item.id)} disabled={!ok}>{ok?"Buy — ⭐"+item.price:"Need ⭐"+item.price}</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {adminOpen&&<AdminPanel user={user} onClose={()=>setAdminOpen(false)}/>}
        {floats.map(f=><div key={f.id} className="pts-float" style={{color:f.streak?"#EA580C":"#F59E0B"}}>+{f.pts}{f.streak?"🔥":"⭐"}</div>)}
        {confetti.map(p=>(
          <div key={p.id} className="confetti-piece" style={{
            left:p.x,top:p.y,width:p.w,height:p.h,
            background:p.color,
            '--tx':p.tx+'px','--ty':p.ty+'px',
            '--rot':p.rot+'deg','--dur':p.dur+'s',
          }}/>
        ))}

      </div>{/* .app */}
      </div>{/* .dk */}

      {/* SCHEDULE PROMPT */}
      {schedPrompt&&(
        <div className="prompt-overlay" onClick={e=>e.target===e.currentTarget&&setSchedPrompt(null)}>
          <div className="prompt-modal">
            <div className="modal-t" style={{marginBottom:12}}>Add to Schedule?</div>
            <div style={{background:"var(--bg3)",border:"1.5px solid var(--border)",borderRadius:13,padding:"13px 15px",marginBottom:18,display:"flex",gap:12,alignItems:"center"}}>
              <span style={{fontSize:"1.5rem"}}>📚</span>
              <div style={{fontSize:".84rem",color:"var(--text2)",lineHeight:1.5}}><b style={{color:"var(--text)"}}>&ldquo;{schedPrompt.subject}&rdquo;</b> isn&apos;t in your schedule yet.<br/>Want to add it so it shows in your timetable?</div>
            </div>
            <div className="mactions">
              <button className="btn btn-g" onClick={()=>setSchedPrompt(null)}>Skip</button>
              <button className="btn btn-p" onClick={()=>{setCf(schedPrompt.pf);setSchedPrompt(null);setAddingC(true);}}>Yes, add to schedule →</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD ASSIGNMENT */}
      {addingA&&(
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&(setAddingA(false),setAf(emptyAF),setSubjMode("select"))}>
          <div className="modal">
            <div className="modal-t">New Assignment</div>
            <div className="fg"><label className="flbl">Title *</label><input className="finp" autoFocus value={af.title} onChange={e=>setAf({...af,title:e.target.value})} placeholder="e.g. Chapter 5 Essay"/></div>
            <div className="fg"><label className="flbl">Class / Subject *</label><SubjectPicker value={af.subject} onChange={v=>setAf({...af,subject:v})}/></div>
            <div className="frow">
              <div className="fg"><label className="flbl">Due Date</label><input className="finp" type="date" value={af.dueDate} onChange={e=>setAf({...af,dueDate:e.target.value})}/></div>
              <div className="fg"><label className="flbl">Priority</label><select className="fsel" value={af.priority} onChange={e=>setAf({...af,priority:e.target.value})}><option value="high">🔴 High</option><option value="medium">🟡 Medium</option><option value="low">🟢 Low</option></select></div>
            </div>
            <div className="fg"><label className="flbl">Progress — {af.progress}%</label><input className="range" type="range" min="0" max="100" step="5" value={af.progress} onChange={e=>setAf({...af,progress:+e.target.value})}/></div>
            <div className="fg"><label className="flbl">Notes</label><textarea className="ftxt" value={af.notes} onChange={e=>setAf({...af,notes:e.target.value})} placeholder="Any notes..."/></div>
            <div className="mactions"><button className="btn btn-g" onClick={()=>{setAddingA(false);setAf(emptyAF);setSubjMode("select");}}>Cancel</button><button className="btn btn-p" onClick={addAssignment} disabled={!af.title||!af.subject}>Add Assignment</button></div>
          </div>
        </div>
      )}

      {/* ADD CLASS */}
      {/* SCHOOL WIZARD */}
      {schoolWiz&&(()=>{
        const wiz=schoolWiz;
        const bg2=darkMode?"rgba(0,0,0,.75)":"rgba(0,0,0,.5)";
        const card2=darkMode?"#161921":"#fff";
        const bd2=darkMode?"#262B3C":"#E2DDD6";
        const txt2c=darkMode?"#DDE2F5":"#1B1F3B";
        const txt3c=darkMode?"#5C6480":"#888";
        const bg3c=darkMode?"#1C1F2B":"#F0EDE7";
        const inp2={width:"100%",padding:"10px 13px",border:`1.5px solid ${bd2}`,borderRadius:11,background:bg3c,color:txt2c,fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:".88rem",outline:"none",boxSizing:"border-box"};

        return(
          <div style={{position:"fixed",inset:0,background:bg2,zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(4px)"}}
            onClick={e=>{if(e.target===e.currentTarget)setSchoolWiz(null);}}>
            <div style={{background:card2,border:`1.5px solid ${bd2}`,borderRadius:22,width:"100%",maxWidth:480,boxShadow:`0 24px 60px rgba(0,0,0,.25)`,fontFamily:"'Plus Jakarta Sans',sans-serif",overflow:"hidden"}}>

              {/* Progress bar */}
              <div style={{height:4,background:bg3c}}>
                <div style={{height:"100%",background:"var(--accent)",transition:"width .3s",
                  width:wiz.step==="search"?"10%":wiz.step==="confirm"?"35%":wiz.step==="periods"?`${35+((wiz.currentPeriod)/(wiz.numPeriods||1))*55}%`:"100%"}}/>
              </div>

              <div style={{padding:"24px 26px"}}>

                {/* ── STEP: SEARCH ─────────────────── */}
                {wiz.step==="search"&&(
                  <>
                    <div style={{fontFamily:"'Fraunces',serif",fontSize:"1.2rem",fontWeight:700,color:txt2c,marginBottom:4}}>🏫 Find Your School</div>
                    <div style={{fontSize:".8rem",color:txt3c,marginBottom:18}}>Search by school name or city to auto-fill your schedule.</div>
                    <div style={{display:"flex",gap:8,marginBottom:14}}>
                      <input style={{...inp2,flex:1}} value={wiz.query} autoFocus
                        onChange={e=>setSchoolWiz(w=>({...w,query:e.target.value,results:null}))}
                        placeholder="e.g. Naperville Central..."
                        onKeyDown={async e=>{if(e.key==="Enter"&&wiz.query.trim()){const r=await searchSchools(wiz.query.trim());setSchoolWiz(w=>({...w,results:r}));}}}/>
                      <button onClick={async()=>{if(wiz.query.trim()){const r=await searchSchools(wiz.query.trim());setSchoolWiz(w=>({...w,results:r}));}}}
                        style={{padding:"10px 16px",borderRadius:11,border:"none",background:"var(--accent)",color:"#fff",fontWeight:700,fontSize:".85rem",cursor:"pointer",whiteSpace:"nowrap"}}>
                        Search
                      </button>
                    </div>

                    {wiz.results===null&&<div style={{color:txt3c,fontSize:".8rem",textAlign:"center",padding:"20px 0"}}>Type a school name and press Search</div>}
                    {wiz.results&&wiz.results.length===0&&<div style={{color:txt3c,fontSize:".8rem",textAlign:"center",padding:"20px 0"}}>No schools found. Try a different name.</div>}
                    {wiz.results&&wiz.results.length>0&&(
                      <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:240,overflow:"auto"}}>
                        {wiz.results.map((s,i)=>(
                          <div key={i} onClick={()=>setSchoolWiz(w=>({...w,step:"confirm",school:s}))}
                            style={{padding:"11px 14px",border:`1.5px solid ${bd2}`,borderRadius:12,cursor:"pointer",transition:"all .12s",background:bg3c,display:"flex",alignItems:"center",gap:12}}
                            onMouseEnter={e=>e.currentTarget.style.borderColor="var(--accent)"}
                            onMouseLeave={e=>e.currentTarget.style.borderColor=bd2}>
                            <div style={{width:36,height:36,borderRadius:10,background:"var(--accent)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.1rem",flexShrink:0}}>🏫</div>
                            <div>
                              <div style={{fontWeight:700,color:txt2c,fontSize:".88rem"}}>{s.name}</div>
                              <div style={{fontSize:".72rem",color:txt3c,marginTop:2}}>{s.city}, {s.state}</div>
                            </div>
                            <div style={{marginLeft:"auto",color:"var(--accent)",fontSize:".8rem",fontWeight:700}}>Select →</div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{marginTop:16,paddingTop:14,borderTop:`1px solid ${bd2}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:".74rem",color:txt3c}}>Can't find your school?</span>
                      <button onClick={()=>setSchoolWiz(null)} style={{padding:"7px 14px",borderRadius:9,border:`1.5px solid ${bd2}`,background:"transparent",color:txt2c,fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:".78rem",fontWeight:600,cursor:"pointer"}}>Cancel</button>
                    </div>
                  </>
                )}

                {/* ── STEP: CONFIRM ────────────────── */}
                {wiz.step==="confirm"&&wiz.school&&(
                  <>
                    <div style={{fontFamily:"'Fraunces',serif",fontSize:"1.2rem",fontWeight:700,color:txt2c,marginBottom:4}}>✅ Confirm School</div>
                    <div style={{padding:"14px 16px",border:`1.5px solid ${bd2}`,borderRadius:14,background:bg3c,marginBottom:18}}>
                      <div style={{fontWeight:700,color:txt2c,fontSize:".95rem"}}>{wiz.school.name}</div>
                      <div style={{fontSize:".76rem",color:txt3c,marginTop:3}}>{wiz.school.city}, {wiz.school.state} · NCES ID: {wiz.school.ncessch}</div>
                    </div>
                    <div style={{fontSize:".8rem",fontWeight:700,color:txt2c,marginBottom:8}}>How many periods per day?</div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
                      {[4,5,6,7,8,9,10].map(n=>(
                        <button key={n} onClick={()=>setSchoolWiz(w=>({...w,numPeriods:n}))}
                          style={{width:44,height:44,borderRadius:10,border:`1.5px solid ${wiz.numPeriods===n?"var(--accent)":bd2}`,
                            background:wiz.numPeriods===n?"var(--accent)":bg3c,
                            color:wiz.numPeriods===n?"#fff":txt2c,fontWeight:700,fontSize:".9rem",cursor:"pointer"}}>
                          {n}
                        </button>
                      ))}
                    </div>
                    <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                      <button onClick={()=>setSchoolWiz(w=>({...w,step:"search"}))} style={{padding:"9px 16px",borderRadius:10,border:`1.5px solid ${bd2}`,background:"transparent",color:txt2c,fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:600,fontSize:".84rem",cursor:"pointer"}}>← Back</button>
                      <button onClick={async()=>{
                        const sched=await fetchBellSchedule(wiz.school.ncessch, user?.idToken);
                        if(sched){
                          // Pre-fill times — handle both dayGroups format and flat format
                          const periods=sched.periods.map(p=>({
                            name:"",
                            label:p.label||"",
                            fixed:p.fixed||false,
                            // Keep dayGroups if present, otherwise use flat start/end/days
                            ...(p.dayGroups
                              ? {dayGroups:p.dayGroups, start:p.dayGroups[0]?.start||"", end:p.dayGroups[0]?.end||"", days:p.dayGroups[0]?.days||[]}
                              : {start:p.start||"", end:p.end||"", days:p.days||["Mon","Tue","Wed","Thu","Fri"]}
                            )
                          }));
                          setSchoolWiz(w=>({...w,step:"periods",periods,numPeriods:periods.filter(p=>!p.fixed).length,currentPeriod:0,bellNote:sched.note,bellFound:true}));
                        } else {
                          // No bell schedule found — ask user to enter times (first person from this school)
                          const blanks=Array.from({length:wiz.numPeriods},(_,i)=>({name:"",start:"",end:"",days:["Mon","Tue","Wed","Thu","Fri"],label:`Period ${i+1}`}));
                          setSchoolWiz(w=>({...w,step:"periods",periods:blanks,currentPeriod:0,bellFound:false}));
                        }
                      }} style={{padding:"9px 20px",borderRadius:10,border:"none",background:"var(--accent)",color:"#fff",fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:".84rem",cursor:"pointer"}}>
                        Set Up Classes →
                      </button>
                    </div>
                  </>
                )}

                {/* ── STEP: PERIODS ─────────────────── */}
                {wiz.step==="periods"&&(()=>{
                  if(!wiz.periods||wiz.periods.length===0) return null;
                  const idx=wiz.currentPeriod;
                  const ordinals=["1st","2nd","3rd","4th","5th","6th","7th","8th","9th","10th"];
                  // Check allDone BEFORE accessing p — p is undefined when idx===periods.length
                  const allDone=idx>=wiz.periods.length;
                  const p=wiz.periods[idx];
                  if(!allDone&&!p) return null;
                  function updatePeriod(patch){setSchoolWiz(w=>{const ps=[...w.periods];ps[idx]={...ps[idx],...patch};return{...w,periods:ps};});}
                  // Count only non-fixed periods for user input
                  const inputPeriods=wiz.periods.filter(p=>!p.fixed);
                  const inputIdx=p?inputPeriods.indexOf(p):inputPeriods.length;
                  if(allDone){
                    // Deduplicate by name for review display
                    const reviewPeriods=[...new Map(wiz.periods.map(p=>[p.label,p])).values()];
                    return(
                      <>
                        <div style={{fontFamily:"'Fraunces',serif",fontSize:"1.2rem",fontWeight:700,color:txt2c,marginBottom:4}}>🎉 Ready to add!</div>
                        <div style={{fontSize:".8rem",color:txt3c,marginBottom:16}}>Here's your schedule for {wiz.school?.name}:</div>
                        <div style={{display:"flex",flexDirection:"column",gap:7,maxHeight:220,overflow:"auto",marginBottom:18}}>
                          {reviewPeriods.map((pd,i)=>(
                            <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:bg3c,borderRadius:10,border:`1px solid ${bd2}`}}>
                              <div style={{width:28,height:28,borderRadius:8,background:SUBJECT_COLORS[i%SUBJECT_COLORS.length],display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:".7rem",flexShrink:0}}>{i+1}</div>
                              <div style={{flex:1}}>
                                <div style={{fontWeight:700,color:txt2c,fontSize:".83rem"}}>{pd.fixed?pd.label:(pd.name||`Period ${i+1}`)}</div>
                                <div style={{fontSize:".7rem",color:txt3c}}>
                                  {pd.dayGroups?pd.dayGroups.map(dg=>dg.days.join("/")+": "+dg.start+"–"+dg.end).join(" · "):(pd.start+"–"+pd.end+" · "+(pd.days||[]).join(", "))}
                                </div>
                              </div>
                              {pd.fixed&&<span style={{fontSize:".65rem",padding:"2px 7px",borderRadius:5,background:bg3c,border:`1px solid ${bd2}`,color:txt3c}}>auto</span>}
                            </div>
                          ))}
                        </div>
                        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                          <button onClick={()=>setSchoolWiz(w=>({...w,currentPeriod:w.periods.length-1}))} style={{padding:"9px 16px",borderRadius:10,border:`1.5px solid ${bd2}`,background:"transparent",color:txt2c,fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:600,fontSize:".84rem",cursor:"pointer"}}>← Back</button>
                          <button onClick={wizAddClasses} style={{padding:"9px 20px",borderRadius:10,border:"none",background:"#16a34a",color:"#fff",fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:".84rem",cursor:"pointer"}}>
                            ✓ Add to Schedule
                          </button>
                        </div>
                      </>
                    );
                  }
                  return(
                    <>
                      {/* Auto-skip fixed periods like SOAR */}
                      {p.fixed&&(()=>{
                        // Use a one-time effect workaround — advance on next tick
                        Promise.resolve().then(()=>setSchoolWiz(w=>w.currentPeriod===idx?{...w,currentPeriod:w.currentPeriod+1}:w));
                        return <div style={{padding:20,textAlign:"center",color:txt3c,fontSize:".8rem"}}>⏭ Skipping {p.label}...</div>;
                      })()}
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                        <div style={{fontFamily:"'Fraunces',serif",fontSize:"1.15rem",fontWeight:700,color:txt2c}}>{p.label||`${ordinals[inputIdx]||`${inputIdx+1}th`} Period`}</div>
                        <div style={{fontSize:".74rem",color:txt3c,fontWeight:600}}>{inputIdx+1} of {inputPeriods.length}</div>
                      </div>
                      <div style={{fontSize:".78rem",color:txt3c,marginBottom:18}}>What class do you have {p.label?.toLowerCase()||`${ordinals[inputIdx]||`${inputIdx+1}th`} period`}?</div>

                      {/* Bell schedule banner */}
                      {idx===0&&wiz.bellFound&&<div style={{padding:"8px 12px",background:darkMode?"#001a00":"#f0fdf4",border:`1px solid ${darkMode?"#14532d":"#bbf7d0"}`,borderRadius:9,fontSize:".74rem",color:darkMode?"#4ade80":"#16a34a",fontWeight:600,marginBottom:14}}>
                        ✅ Bell times loaded automatically — just enter your class names!{wiz.bellNote&&<span style={{fontWeight:400,color:darkMode?"#4ade80":"#16a34a"}}> ({wiz.bellNote})</span>}
                      </div>}
                      {idx===0&&!wiz.bellFound&&<div style={{padding:"8px 12px",background:bg3c,border:`1px solid ${bd2}`,borderRadius:9,fontSize:".74rem",color:txt3c,marginBottom:14}}>
                        ⏰ First person from this school! Enter times once and they'll be saved for everyone else.
                      </div>}

                      {/* Time display (if known) or input (if not) */}
                      {wiz.bellFound?(
                        <div style={{background:bg3c,borderRadius:11,border:`1.5px solid ${bd2}`,marginBottom:14,overflow:"hidden"}}>
                          {(p.dayGroups||[{days:p.days,start:p.start,end:p.end}]).map((dg,dgi)=>(
                            <div key={dgi} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 14px",borderBottom:dgi<(p.dayGroups||[]).length-1?`1px solid ${bd2}`:"none"}}>
                              <div style={{display:"flex",gap:4,flexWrap:"wrap",flex:1}}>
                                {dg.days.map(d=><span key={d} style={{padding:"2px 7px",borderRadius:5,background:"var(--accent)",color:"#fff",fontSize:".65rem",fontWeight:700}}>{d}</span>)}
                              </div>
                              <div style={{fontSize:".82rem",fontWeight:700,color:txt2c,whiteSpace:"nowrap"}}>{dg.start} – {dg.end}</div>
                            </div>
                          ))}
                        </div>
                      ):(
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
                          <div>
                            <label style={{display:"block",fontSize:".68rem",fontWeight:800,color:txt3c,textTransform:"uppercase",letterSpacing:".06em",marginBottom:5}}>Start Time</label>
                            <input type="time" style={inp2} value={p.start} onChange={e=>updatePeriod({start:e.target.value})}/>
                          </div>
                          <div>
                            <label style={{display:"block",fontSize:".68rem",fontWeight:800,color:txt3c,textTransform:"uppercase",letterSpacing:".06em",marginBottom:5}}>End Time</label>
                            <input type="time" style={inp2} value={p.end} onChange={e=>updatePeriod({end:e.target.value})}/>
                          </div>
                        </div>
                      )}

                      <div style={{marginBottom:14}}>
                        <label style={{display:"block",fontSize:".68rem",fontWeight:800,color:txt3c,textTransform:"uppercase",letterSpacing:".06em",marginBottom:5}}>Class Name</label>
                        <input style={inp2} value={p.name} autoFocus
                          onChange={e=>updatePeriod({name:e.target.value})}
                          placeholder={`e.g. AP Chemistry, Math, English...`}
                          onKeyDown={e=>{ if(e.key==="Enter"){ if(idx+1>=wiz.numPeriods)setSchoolWiz(w=>({...w,currentPeriod:w.numPeriods})); else setSchoolWiz(w=>({...w,currentPeriod:w.currentPeriod+1})); } }}/>
                      </div>

                      {!wiz.bellFound&&<div style={{marginBottom:20}}>
                        <label style={{display:"block",fontSize:".68rem",fontWeight:800,color:txt3c,textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>Days</label>
                        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=>{
                            const on=p.days.includes(d);
                            return <button key={d} onClick={()=>updatePeriod({days:on?p.days.filter(x=>x!==d):[...p.days,d]})}
                              style={{padding:"6px 12px",borderRadius:8,border:`1.5px solid ${on?"var(--accent)":bd2}`,background:on?"var(--accent)":bg3c,color:on?"#fff":txt2c,fontWeight:600,fontSize:".78rem",cursor:"pointer"}}>{d}</button>;
                          })}
                        </div>
                      </div>}

                      <div style={{display:"flex",gap:8,justifyContent:"space-between"}}>
                        <button onClick={()=>setSchoolWiz(w=>({...w,currentPeriod:Math.max(0,w.currentPeriod-1)}))} disabled={idx===0}
                          style={{padding:"9px 16px",borderRadius:10,border:`1.5px solid ${bd2}`,background:"transparent",color:idx===0?"#bbb":txt2c,fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:600,fontSize:".84rem",cursor:idx===0?"not-allowed":"pointer"}}>
                          ← Back
                        </button>
                        <button onClick={()=>{
                            const isLast=idx+1>=wiz.periods.length||wiz.periods.slice(idx+1).every(p=>p.fixed);
                            // Always advance to periods.length to trigger review
                            setSchoolWiz(w=>({...w,currentPeriod:isLast?w.periods.length:w.currentPeriod+1}));
                          }}
                          style={{padding:"9px 20px",borderRadius:10,border:"none",background:"var(--accent)",color:"#fff",fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:".84rem",cursor:"pointer"}}>
                          {idx+1>=wiz.periods.length||wiz.periods.slice(idx+1).every(p=>p.fixed)?"Review →":"Next →"}
                        </button>
                      </div>
                    </>
                  );
                })()}

              </div>
            </div>
          </div>
        );
      })()}

      {addingC&&(
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&(setAddingC(false),setCf(emptyCF))}>
          <div className="modal">
            <div className="modal-t">New Class</div>
            <div className="fg"><label className="flbl">Class Name *</label><input className="finp" autoFocus value={cf.name} onChange={e=>setCf({...cf,name:e.target.value})} placeholder="e.g. Calculus II"/></div>
            <div className="fg"><label className="flbl">Days</label><div className="dtogglerow">{DAYS.map(d=><button key={d} className={"dtoggle"+(cf.days.includes(d)?" on":"")} onClick={()=>setCf({...cf,days:cf.days.includes(d)?cf.days.filter(x=>x!==d):[...cf.days,d]})}>{d}</button>)}</div></div>
            <div className="frow">
              <div className="fg"><label className="flbl">Start Time</label><input className="finp" type="time" value={cf.startTime} onChange={e=>setCf({...cf,startTime:e.target.value})}/></div>
              <div className="fg"><label className="flbl">End Time</label><input className="finp" type="time" value={cf.endTime} onChange={e=>setCf({...cf,endTime:e.target.value})}/></div>
            </div>
            <div className="fg"><label className="flbl">Room</label><input className="finp" value={cf.room} onChange={e=>setCf({...cf,room:e.target.value})} placeholder="e.g. Room 204"/></div>
            <div className="fg"><label className="flbl">Color</label><div className="swatches">{SUBJECT_COLORS.map(col=><div key={col} className={"swatch"+(cf.color===col?" on":"")} style={{background:col}} onClick={()=>setCf({...cf,color:col})}/>)}</div></div>
            <div className="mactions"><button className="btn btn-g" onClick={()=>{setAddingC(false);setCf(emptyCF);}}>Cancel</button><button className="btn btn-p" onClick={addClass}>Add Class</button></div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {importOpen&&(
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&!importing&&(setImportOpen(false),resetImport())}>
          <div className="modal">
            <div className="modal-t">📥 Import Assignments</div>

            {!importing&&!importResult&&(
              <div className="itabs">
                <button className={`itab${importMode==="canvas"?" canvas-on":""}`} onClick={()=>{setImportMode("canvas");setImportResult(null);}}>🎓 Canvas</button>
                <button className={`itab${importMode==="slides"?" on":""}`} onClick={()=>{setImportMode("slides");setImportResult(null);}}>📊 Google Slides</button>
                <button className={`itab${importMode==="agenda"?" agenda-on":""}`} onClick={()=>{setImportMode("agenda");setImportResult(null);}}>📋 Agenda</button>
              </div>
            )}

            {/* CANVAS */}
            {importMode==="canvas"&&!importResult&&!importing&&(
              <>
                {canvasToken?(
                  /* ── Connected: one-click import ── */
                  <>
                    <div style={{background:"#EEF2FF",border:"1.5px solid #c7d2fe",borderRadius:12,padding:"14px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
                      <div style={{width:36,height:36,borderRadius:10,background:"#4338ca",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.1rem",flexShrink:0}}>🎓</div>
                      <div>
                        <div style={{fontWeight:700,color:"#4338ca",fontSize:".85rem"}}>Canvas connected</div>
                        <div style={{fontSize:".72rem",color:"#6366f1",marginTop:2}}>{canvasBaseUrl}</div>
                      </div>
                      <div style={{marginLeft:"auto",fontSize:".7rem",color:"#6366f1",fontWeight:600,cursor:"pointer",textDecoration:"underline"}} onClick={()=>{setImportOpen(false);resetImport();setShowCanvasSetup(true);}}>Change</div>
                    </div>
                    <div style={{fontSize:".8rem",color:"var(--text3)",marginBottom:18,lineHeight:1.6}}>
                      This will fetch <b>all upcoming assignments</b> from Canvas and add them to StudyDesk. Assignments already in your list will be updated with the latest Canvas data.
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:18}}>
                      {[
                        ["📥","Fetches every upcoming assignment, quiz, and discussion"],
                        ["🔄","Updates due dates, grades, and submission status on existing assignments"],
                        ["✅","Marks submitted assignments as 100% complete"],
                        ["📚","Pulls the class name from Canvas automatically"],
                      ].map(([icon,text])=>(
                        <div key={text} style={{display:"flex",gap:10,alignItems:"center",fontSize:".8rem",color:"var(--text2)"}}>
                          <span style={{fontSize:"1rem"}}>{icon}</span>{text}
                        </div>
                      ))}
                    </div>
                    <div className="mactions">
                      <button className="btn btn-g" onClick={()=>{setImportOpen(false);resetImport();}}>Cancel</button>
                      <button className="btn btn-p" style={{background:"#4338ca",minWidth:160}} onClick={importFromCanvasAPI}>
                        🎓 Import All Assignments
                      </button>
                    </div>
                  </>
                ):(
                  /* ── Not connected: show connect prompt + manual paste fallback ── */
                  <>
                    <div style={{background:"#EEF2FF",border:"1.5px solid #c7d2fe",borderRadius:12,padding:"13px 15px",marginBottom:14}}>
                      <div style={{fontWeight:700,color:"#4338ca",fontSize:".84rem",marginBottom:6}}>🎓 Connect Canvas for one-click import</div>
                      <div style={{fontSize:".77rem",color:"#6366f1",marginBottom:10}}>Connect your Canvas API token once and import all assignments with a single button — no copy-pasting ever again.</div>
                      <button className="btn btn-p" style={{background:"#4338ca"}} onClick={()=>{setImportOpen(false);resetImport();setShowCanvasSetup(true);}}>Connect Canvas →</button>
                    </div>
                    <div style={{fontSize:".72rem",fontWeight:700,color:"var(--text4)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:10}}>Or import manually</div>
                    <div style={{background:"var(--bg3)",border:"1.5px solid var(--border)",borderRadius:12,padding:"12px 14px",marginBottom:14,fontSize:".78rem",color:"var(--text3)"}}>
                      <div style={{marginBottom:8}}><b style={{color:"var(--text2)"}}>Step 1:</b> Open this link while logged into Canvas:</div>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
                        <a href={CANVAS_URL} target="_blank" rel="noreferrer" style={{fontSize:".68rem",fontFamily:"monospace",color:"#4338ca",wordBreak:"break-all",flex:1}}>{CANVAS_URL}</a>
                        <CopyBtn text={CANVAS_URL}/>
                      </div>
                      <div><b style={{color:"var(--text2)"}}>Step 2:</b> Press Ctrl+A, Ctrl+C, then paste below</div>
                    </div>
                    <div className="fg">
                      <textarea className="ftxt" style={{minHeight:70,fontFamily:"monospace",fontSize:".75rem"}} value={canvasPaste} onChange={e=>setCanvasPaste(e.target.value)} placeholder="Paste Canvas page contents here..."/>
                    </div>
                    <div className="mactions">
                      <button className="btn btn-g" onClick={()=>{setImportOpen(false);resetImport();}}>Cancel</button>
                      <button className="btn btn-p" style={{background:"#4338ca"}} onClick={importFromCanvasPaste} disabled={!canvasPaste.trim()}>Import</button>
                    </div>
                  </>
                )}
              </>
            )}

            {/* GOOGLE SLIDES */}
            {importMode==="slides"&&!importResult&&!importing&&(
              <>
                <div className="fg">
                  <label className="flbl">Google Slides URL</label>
                  <input className="finp" value={importUrl} onChange={e=>setImportUrl(e.target.value)} placeholder="https://docs.google.com/presentation/d/..."/>
                </div>
                {importUrl&&!extractId(importUrl)&&<div className="err-box" style={{marginBottom:10}}>⚠️ Not a valid Google Slides URL</div>}
                {extractId(importUrl)&&(
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:4}}>
                    <button onClick={importFromSlidesUrl}
                      style={{padding:"12px 10px",borderRadius:11,border:"1.5px solid #EDE9E2",background:"#fff",cursor:"pointer",textAlign:"center",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                      <div style={{fontSize:"1.2rem",marginBottom:4}}>⚡</div>
                      <div style={{fontSize:".8rem",fontWeight:700,color:"#1B1F3B",marginBottom:3}}>Auto Fetch</div>
                      <div style={{fontSize:".7rem",color:"#aaa",lineHeight:1.4}}>Works if slides are public</div>
                    </button>
                    <div style={{position:"relative"}}>
                      <button onClick={()=>window.open(`https://docs.google.com/presentation/d/${extractId(importUrl)}/export/txt`,"_blank")}
                        style={{width:"100%",padding:"12px 10px",borderRadius:11,border:"2px solid #1B1F3B",background:"#f8f8ff",cursor:"pointer",textAlign:"center",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                        <div style={{fontSize:"1.2rem",marginBottom:4}}>📄</div>
                        <div style={{fontSize:".8rem",fontWeight:700,color:"#1B1F3B",marginBottom:3}}>Upload File</div>
                        <div style={{fontSize:".7rem",color:"#555",lineHeight:1.4}}>Works with school accounts</div>
                        <div style={{position:"absolute",top:-9,left:"50%",transform:"translateX(-50%)",background:"#1B1F3B",color:"#fff",fontSize:".6rem",fontWeight:700,padding:"2px 8px",borderRadius:20,whiteSpace:"nowrap"}}>✦ Recommended</div>
                      </button>
                    </div>
                  </div>
                )}
                {extractId(importUrl)&&(
                  <div style={{background:"#EEF2FF",border:"1.5px solid #c7d2fe",borderRadius:10,padding:"12px 13px",fontSize:".75rem",color:"#4338ca",lineHeight:1.6,marginTop:10}}>
                    <div style={{fontWeight:700,marginBottom:8}}>📥 Step 1 — File downloaded! Now upload it here:</div>
                    <label style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"11px",border:"2px dashed #c7d2fe",borderRadius:10,cursor:"pointer",background:"#fff",fontSize:".82rem",color:"#4338ca",fontWeight:600}}>
                      <input type="file" accept=".txt" style={{display:"none"}} onChange={handleFileUpload}/>
                      📄 Select the downloaded .txt file
                    </label>
                  </div>
                )}
                <div className="mactions" style={{marginTop:12}}>
                  <button className="btn btn-g" onClick={()=>{setImportOpen(false);resetImport();}}>Cancel</button>
                </div>
              </>
            )}

            {/* AGENDA */}
            {importMode==="agenda"&&!importResult&&!importing&&(
              <>
                {agendaStep==="url"&&(
                  <>
                    <div style={{background:"#FFF7ED",border:"1.5px solid #fed7aa",borderRadius:12,padding:"11px 14px",marginBottom:14,fontSize:".79rem",color:"#92400e",lineHeight:1.6}}>
                      <b>📋 Agenda Import</b> — works with school Google accounts.<br/>
                      We'll read your agenda doc, find all the linked agendas from today onwards, and bundle them into one file for you to download.
                      <span style={{display:"inline-block",marginTop:6,fontSize:".7rem",background:"#fed7aa",color:"#7c2d12",padding:"2px 8px",borderRadius:20,fontWeight:700}}>Currently only supports Google Docs</span>
                    </div>
                    <div style={{background:"#f8f8f6",border:"1.5px solid #EDE9E2",borderRadius:10,padding:"10px 13px",marginBottom:14,fontSize:".75rem",color:"#555",lineHeight:1.8}}>
                      <b style={{color:"#1B1F3B"}}>How it works:</b><br/>
                      1. Paste your main calendar/agenda doc link<br/>
                      2. Download it as HTML (to preserve the links)<br/>
                      3. Upload it — app finds all agenda links from today onward<br/>
                      4. Download a small fetcher page, open it in your browser<br/>
                      5. It auto-downloads all agendas into one file<br/>
                      6. Upload that combined file — AI extracts all homework ✨
                    </div>
                    <div className="fg">
                      <label className="flbl">Google Docs Agenda URL</label>
                      <input className="finp" value={agendaUrl} onChange={e=>setAgendaUrl(e.target.value)} placeholder="https://docs.google.com/document/d/..."/>
                    </div>
                    {agendaUrl&&getDocExportUrl(agendaUrl)&&(
                      <div style={{background:"#f0fdf4",border:"1.5px solid #86efac",borderRadius:10,padding:"10px 13px",marginBottom:12}}>
                        <div style={{fontSize:".75rem",fontWeight:700,color:"#15803d",marginBottom:6}}>Step 1 — Download your agenda as HTML (preserves links):</div>
                        <a href={getDocExportUrl(agendaUrl)} target="_blank" rel="noreferrer" className="btn btn-p" style={{display:"inline-flex",alignItems:"center",gap:6,textDecoration:"none",fontSize:".82rem",padding:"7px 14px",borderRadius:9,background:"#16a34a"}}>⬇️ Download Agenda HTML</a>
                        <div style={{fontSize:".7rem",color:"#888",marginTop:8}}>Then upload the .html file below ↓</div>
                      </div>
                    )}
                    {agendaUrl&&!getDocExportUrl(agendaUrl)&&<div className="err-box" style={{marginBottom:12}}>⚠️ Not a valid Google Docs URL</div>}
                    {agendaUrl&&getDocExportUrl(agendaUrl)&&(
                      <>
                        <div style={{fontSize:".78rem",fontWeight:700,color:"#1B1F3B",marginBottom:8}}>Step 2 — Upload the downloaded HTML file:</div>
                        <label style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"13px",border:"2px dashed #fed7aa",borderRadius:12,cursor:"pointer",background:"#fffbeb",fontSize:".82rem",color:"#92400e",fontWeight:600}}>
                          <input type="file" accept=".html,.htm" style={{display:"none"}} onChange={handleAgendaDocUpload}/>
                          📄 Upload agenda .html file
                        </label>
                      </>
                    )}
                    <div className="mactions" style={{marginTop:14}}>
                      <button className="btn btn-g" onClick={()=>{setImportOpen(false);resetImport();}}>Cancel</button>
                    </div>
                  </>
                )}

                {agendaStep==="fetcher"&&(
                  <>
                    <div style={{background:"#f0fdf4",border:"1.5px solid #86efac",borderRadius:12,padding:"11px 14px",marginBottom:14,fontSize:".79rem",color:"#15803d",lineHeight:1.6}}>
                      ✅ Found <b>{agendaSlideLinks.length} agenda{agendaSlideLinks.length!==1?"s":""}</b> from today onwards! Click each one to download, then upload them all below.
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:14,maxHeight:200,overflowY:"auto"}}>
                      {agendaSlideLinks.map((l,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:10,background:"#f8f8f6",border:"1.5px solid #EDE9E2",borderRadius:9,padding:"7px 10px"}}>
                          <span style={{flex:1,fontSize:".78rem",fontWeight:600,color:"#1B1F3B"}}>{l.label}</span>
                          <a href={l.exportUrl} target="_blank" rel="noreferrer"
                            style={{fontSize:".72rem",padding:"4px 10px",borderRadius:7,background:"#4338ca",color:"#fff",textDecoration:"none",fontWeight:700,whiteSpace:"nowrap"}}>
                            ⬇️ Download
                          </a>
                        </div>
                      ))}
                    </div>
                    <div style={{borderTop:"1.5px solid #EDE9E2",paddingTop:12,marginBottom:8}}>
                      <div style={{fontSize:".78rem",fontWeight:700,color:"#1B1F3B",marginBottom:6}}>Upload all downloaded files at once:</div>
                      <label style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"13px",border:"2px dashed #c7d2fe",borderRadius:12,cursor:"pointer",background:"#EEF2FF",fontSize:".82rem",color:"#4338ca",fontWeight:600}}>
                        <input type="file" accept=".txt" multiple style={{display:"none"}} onChange={e=>{
                          const files=[...e.target.files];
                          if(!files.length)return;
                          Promise.all(files.map(f=>f.text())).then(texts=>{
                            runAgendaScan(texts.join("\n\n"));
                          });
                        }}/>
                        📄 Upload .txt files (select all at once)
                      </label>
                      <div style={{fontSize:".7rem",color:"#aaa",marginTop:5}}>Hold Ctrl/Cmd to select multiple files at once</div>
                    </div>
                    <div className="mactions" style={{marginTop:10}}>
                      <button className="btn btn-g" onClick={()=>setAgendaStep("url")}>← Back</button>
                    </div>
                  </>
                )}
              </>
            )}

            {/* LOADING */}
            {importing&&(
              <div className="loading-box">
                <div style={{fontSize:"2rem"}} className="spin">{importMode==="canvas"?"🎓":importMode==="agenda"?"📋":"📊"}</div>
                <p><b>{importMode==="canvas"?"Reading Canvas data...":importMode==="agenda"?"Scanning agenda...":"Fetching slides..."}</b><br/><span style={{fontSize:".78rem",color:"#bbb"}}>{fetchStatus||canvasStatus||"Just a moment..."}</span></p>
              </div>
            )}

            {/* ERROR */}
            {importResult?.error&&(
              <>
                <div className="err-box">⚠️ {importResult.error}</div>
                <div className="mactions">
                  <button className="btn btn-g" onClick={()=>{setImportResult(null);setCanvasStatus("");setFetchStatus("");}}>← Try Again</button>
                  <button className="btn btn-g" onClick={()=>{setImportOpen(false);resetImport();}}>Close</button>
                </div>
              </>
            )}

            {/* RESULTS */}
            {importResult?.assignments&&(
              <>
                <div className="success-box">
                  ✅ Found {importResult.assignments.length} assignment{importResult.assignments.length!==1?"s":""}
                  {importResult.source==="canvas"?` from Canvas (${importResult.total||importResult.assignments.length} total)`:importResult.source==="agenda"?` from agenda${importResult.slideCount>0?` + ${importResult.slideCount} slide deck${importResult.slideCount!==1?"s":""}`:""}`:" from slides"}
                  {" — remove any you don't want"}
                </div>
                <div className="apreview">
                  <div className="apreview-hd">Review before adding</div>
                  <div className="apreview-list">
                    {importResult.assignments.map((a,i)=>(
                      <div key={i} className="apreview-item" style={{flexDirection:"column",alignItems:"stretch",gap:5}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <div className="apreview-dot" style={{background:PRIORITY[a.priority]?.text||"#888",flexShrink:0}}/>
                          <div style={{flex:1,minWidth:0}}>
                            <div className="apreview-name">{a.title}</div>
                          </div>
                          <div className="apreview-due">{a.dueDate?fmtDate(a.dueDate):"No date"}</div>
                          <button onClick={()=>setImportResult(r=>({...r,assignments:r.assignments.filter((_,j)=>j!==i)}))}
                            style={{background:"none",border:"none",cursor:"pointer",color:"#ccc",fontSize:"1rem",lineHeight:1,padding:"0 2px",flexShrink:0}}
                            title="Remove">✕</button>
                        </div>
                        <select value={a.subject}
                          onChange={e=>{const v=e.target.value;setImportResult(r=>({...r,assignments:r.assignments.map((x,j)=>j===i?{...x,subject:v}:x)}));}}
                          style={{fontSize:".72rem",border:"1.5px solid #EDE9E2",borderRadius:7,padding:"3px 6px",background:"#fafaf8",color:"#1B1F3B",marginLeft:16,fontFamily:"'Plus Jakarta Sans',sans-serif",cursor:"pointer"}}>
                          {a.subject&&!classes.find(c=>c.name===a.subject)&&<option value={a.subject}>{a.subject} (detected)</option>}
                          {classes.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
                          <option value="">— No class —</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mactions">
                  <button className="btn btn-g" onClick={()=>{setImportResult(null);setFetchStatus("");setCanvasStatus("");}}>← Redo</button>
                  <button className="btn btn-p" onClick={confirmImport} disabled={!importResult.assignments.length}>Add {importResult.assignments.length} to Tracker →</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {/* ABOUT MODAL */}
      {showAbout&&(
        <div className="release-overlay" onClick={e=>{if(e.target===e.currentTarget)setShowAbout(false);}}>
          <div className="release-box">
            <div className="release-hd">
              <div>
                <div className="release-title">About</div>
                <div className="release-sub">StudyDesk v{APP_VERSION}</div>
              </div>
              <button onClick={()=>setShowAbout(false)} style={{background:"none",border:"none",cursor:"pointer",color:"#bbb",fontSize:"1.3rem",lineHeight:1,padding:4}}>✕</button>
            </div>
            <div className="about-body">
              <div className="about-hero">
                <div className="about-logo">📚</div>
                <div className="about-name">Study Desk</div>
                <div className="about-tagline">Your homework, organized.</div>
              </div>

              <div className="about-section">
                <div className="about-section-title">About the App</div>
                <div className="about-card">
                  Study Desk is a free homework tracker built for students. It helps you stay on top of assignments across all your classes — with smart import tools that read your teacher's Google Slides agendas so you never miss what's due.
                </div>
              </div>

              <div className="about-section">
                <div className="about-section-title">Features</div>
                <div className="about-card" style={{padding:"4px 14px"}}>
                  <div className="about-feature">
                    <span className="about-feature-icon">📥</span>
                    <div className="about-feature-text"><b>Smart Import</b> — reads Google Slides, Docs agendas, and Canvas to pull in homework automatically</div>
                  </div>
                  <div className="about-feature">
                    <span className="about-feature-icon">📅</span>
                    <div className="about-feature-text"><b>Schedule</b> — add your weekly classes with times, rooms, and colors</div>
                  </div>
                  <div className="about-feature">
                    <span className="about-feature-icon">📊</span>
                    <div className="about-feature-text"><b>Dashboard</b> — see what's due today, what's overdue, and your progress at a glance</div>
                  </div>
                  <div className="about-feature">
                    <span className="about-feature-icon">✦</span>
                    <div className="about-feature-text"><b>Works on Chromebook</b> — no install needed, runs entirely in your browser</div>
                  </div>
                </div>
              </div>

              <div className="about-made">Made by <span>Amar G.</span> · Free forever</div>
            </div>
          </div>
        </div>
      )}

      {/* RELEASE MODAL */}
      {showReleases&&(
        <div className="release-overlay" onClick={e=>{if(e.target===e.currentTarget)dismissReleases();}}>
          <div className="release-box">
            <div className="release-hd">
              <div>
                <div className="release-title">
                  {localStorage.getItem("studydesk-seen-version")!==APP_VERSION?"🎉 What's New":"📋 Release Notes"}
                </div>
                <div className="release-sub">StudyDesk v{APP_VERSION}</div>
              </div>
              <button onClick={dismissReleases} style={{background:"none",border:"none",cursor:"pointer",color:"#bbb",fontSize:"1.3rem",lineHeight:1,padding:4}}>✕</button>
            </div>
            <div className="release-body">
              {RELEASES.map((r,i)=>(
                <div key={r.version} className="release-entry">
                  <div className="release-ver">
                    <span className="release-badge">v{r.version}</span>
                    <span className="release-date">{r.date}</span>
                    {i===0&&<span style={{background:"#f0fdf4",color:"#16a34a",fontSize:".65rem",fontWeight:700,padding:"2px 8px",borderRadius:20}}>Latest</span>}
                  </div>
                  <div className="release-name">{r.title}</div>
                  <div className="release-changes">
                    {r.changes.map((c,j)=>(
                      <div key={j} className="release-change">
                        <span className="release-dot">✦</span>
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                  {i<RELEASES.length-1&&<div style={{borderBottom:"1.5px solid #EDE9E2",marginTop:20}}/>}
                </div>
              ))}
            </div>
            <div style={{padding:"14px 24px",borderTop:"1.5px solid #EDE9E2"}}>
              <button className="btn btn-p" style={{width:"100%",justifyContent:"center"}} onClick={dismissReleases}>
                Got it ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANVAS SETUP MODAL */}
      {showCanvasSetup&&(
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowCanvasSetup(false)}>
          <div className="modal" style={{maxWidth:500}}>
            <div className="modal-t">🎓 Connect Canvas</div>
            {isChromebook?(
              <div style={{textAlign:"center",padding:"24px 12px"}}>
                <div style={{fontSize:"2.5rem",marginBottom:12}}>🚫</div>
                <div style={{fontFamily:"'Fraunces',serif",fontSize:"1.1rem",fontWeight:700,color:"var(--text)",marginBottom:8}}>Not supported on Chromebooks</div>
                <div style={{fontSize:".84rem",color:"var(--text2)",lineHeight:1.6,marginBottom:20}}>Canvas sync requires a direct connection to your school's Canvas server, which school Chromebooks block for security reasons.<br/><br/>Please connect Canvas on a <b>personal device</b> — your data will sync to this account automatically.</div>
                <button className="btn btn-g" onClick={()=>setShowCanvasSetup(false)}>Got it</button>
              </div>
            ):(
              <>
            <div style={{background:"#EEF2FF",border:"1.5px solid #c7d2fe",borderRadius:12,padding:"13px 15px",marginBottom:16,fontSize:".8rem",color:"#4338ca",lineHeight:1.7}}>
              <b>StudyDesk will check Canvas every 3 minutes</b> and automatically mark assignments as done when you submit them. Grades are shown on cards when posted.
            </div>

            <div style={{fontSize:".7rem",fontWeight:800,color:"var(--text3)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:12}}>How to get your Canvas API token:</div>
            {[
              ["1","Open Canvas and click your profile picture (top-left)"],
              ["2","Go to Settings → scroll down to Approved Integrations"],
              ["3","Click 'New Access Token' → purpose: 'StudyDesk' → Generate"],
              ["4","Copy the token and paste it below (you only see it once!)"],
            ].map(([n,t])=>(
              <div key={n} style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:9}}>
                <div style={{width:22,height:22,borderRadius:"50%",background:"#4338ca",color:"#fff",fontSize:".68rem",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>{n}</div>
                <div style={{fontSize:".82rem",color:"var(--text2)",lineHeight:1.5}}>{t}</div>
              </div>
            ))}

            <div className="fg" style={{marginTop:16}}>
              <label className="flbl">Canvas School URL</label>
              <input className="finp" value={canvasBaseUrl}
                onChange={e=>setCanvasBaseUrl(e.target.value)}
                placeholder="https://naperville.instructure.com"/>
              <div style={{fontSize:".69rem",color:"var(--text4)",marginTop:4}}>The base URL of your school's Canvas (no trailing slash)</div>
            </div>
            <div className="fg">
              <label className="flbl">Canvas API Token</label>
              <input className="finp" type="password" value={canvasToken}
                onChange={e=>setCanvasToken(e.target.value)}
                placeholder="Paste your token here..."/>
            </div>

            {canvasSync.error&&<div className="err-box" style={{marginBottom:10}}>⚠️ {canvasSync.error}</div>}

            <div className="mactions">
              {canvasToken&&<button className="btn btn-g" onClick={()=>{setCanvasToken("");setCanvasBaseUrl("https://naperville.instructure.com");}}>🗑 Disconnect</button>}
              <button className="btn btn-g" onClick={()=>setShowCanvasSetup(false)}>Cancel</button>
              <button className="btn btn-p" style={{background:"#4338ca"}} disabled={!canvasToken||!canvasBaseUrl}
                onClick={()=>{
                  setShowCanvasSetup(false);
                  syncCanvas(canvasToken,canvasBaseUrl);
                }}>
                Connect & Sync →
              </button>
            </div>
              </>
            )}
          </div>
        </div>
      )}

    </>
  );
}