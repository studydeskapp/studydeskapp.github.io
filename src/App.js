import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "hw-tracker-v1";
const APP_VERSION = "1.2.0";
const RELEASES = [
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
:root{--bg:#F5F2EC;--bg2:#FFFFFF;--bg3:#F0EDE7;--bg4:#E8E4DC;--border:#E2DDD6;--border2:#C8C3BA;--text:#1B1F3B;--text2:#555;--text3:#888;--text4:#bbb;--accent:#1B1F3B;--accent2:#2d3260;--card:#FFFFFF;--card2:#FAF8F4;--sh:rgba(27,31,59,.07);--sh2:rgba(27,31,59,.14);--mbg:#F5F2EC;--ibg:#FFFFFF;--sg:linear-gradient(135deg,#FFFFFF,#FAF8F4);--hb:#1B1F3B;--tb:#EDE9E2;--tc:#F8F6F0;--schdr:#1B1F3B}
.dark{--bg:#0F1117;--bg2:#161921;--bg3:#1C1F2B;--bg4:#232738;--border:#262B3C;--border2:#323848;--text:#DDE2F5;--text2:#909BBB;--text3:#5C6480;--text4:#353C58;--accent:#7B83F7;--accent2:#9199FF;--card:#161921;--card2:#1A1D28;--sh:rgba(0,0,0,.3);--sh2:rgba(0,0,0,.5);--mbg:#161921;--ibg:#1C1F2B;--sg:linear-gradient(135deg,#1C1F2B,#161921);--hb:#262B3C;--tb:#1A1D28;--tc:#181B26;--schdr:#161921}
body{font-family:'Plus Jakarta Sans',sans-serif;background:var(--bg);min-height:100vh;color:var(--text);transition:background .25s,color .25s}
.dk{background:var(--bg);min-height:100vh;transition:background .25s}
.app{max-width:1100px;margin:0 auto;padding:0 22px 100px}
.hdr{padding:24px 0 18px;display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid var(--hb);margin-bottom:22px;gap:12px;flex-wrap:wrap}
.hdr-title{font-family:'Fraunces',serif;font-size:2rem;font-weight:700;color:var(--text);letter-spacing:-.5px;line-height:1}
.hdr-sub{font-size:.78rem;color:var(--text3);margin-top:4px;font-weight:500}
.hdr-r{display:flex;gap:7px;align-items:center;flex-wrap:wrap}
.dm-btn{width:46px;height:26px;border-radius:13px;border:1.5px solid var(--border2);background:var(--bg3);cursor:pointer;position:relative;transition:all .2s;flex-shrink:0;padding:0}
.dm-knob{width:20px;height:20px;border-radius:50%;background:var(--text2);position:absolute;top:2px;left:2px;transition:transform .2s;display:flex;align-items:center;justify-content:center;font-size:.65rem;line-height:1}
.dark .dm-knob{transform:translateX(20px)}
.tabs{display:flex;gap:3px;margin-bottom:24px;background:var(--tb);padding:4px;border-radius:13px;width:fit-content;overflow-x:auto;max-width:100%;scrollbar-width:none}
.tabs::-webkit-scrollbar{display:none}
.tab{padding:7px 16px;border-radius:10px;border:none;background:transparent;font-family:'Plus Jakarta Sans',sans-serif;font-size:.82rem;font-weight:600;color:var(--text3);cursor:pointer;transition:all .15s;white-space:nowrap}
.tab.on{background:var(--accent);color:#fff;box-shadow:0 2px 8px var(--sh2)}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:22px}
.stat{background:var(--sg);border-radius:18px;padding:17px 17px 13px;border:1.5px solid var(--border);position:relative;overflow:hidden;transition:transform .15s,box-shadow .15s}
.stat:hover{transform:translateY(-2px);box-shadow:0 6px 22px var(--sh2)}
.sacc{position:absolute;top:0;left:0;right:0;height:4px;border-radius:18px 18px 0 0}
.stat-n{font-family:'Fraunces',serif;font-size:2rem;font-weight:700;color:var(--text);line-height:1;margin-top:2px}
.stat-l{font-size:.7rem;color:var(--text3);margin-top:6px;font-weight:700;text-transform:uppercase;letter-spacing:.06em}
.stat-ico{position:absolute;right:13px;top:13px;font-size:1.4rem;opacity:.16}
.sec-hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
.sec-t{font-family:'Fraunces',serif;font-size:1.15rem;font-weight:600;color:var(--text)}
.sec-lbl{font-size:.67rem;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px}
.alist{display:flex;flex-direction:column;gap:9px}
.acard{background:var(--card);border-radius:16px;padding:14px 16px;border:1.5px solid var(--border);display:flex;align-items:center;gap:12px;transition:transform .15s,box-shadow .15s}
.acard:hover{transform:translateY(-1px);box-shadow:0 5px 22px var(--sh)}
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
.btn{padding:8px 16px;border-radius:11px;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-weight:600;font-size:.82rem;transition:all .15s;display:inline-flex;align-items:center;gap:5px}
.btn-p{background:var(--accent);color:#fff}
.btn-p:hover{background:var(--accent2);transform:translateY(-1px)}
.btn-g{background:transparent;color:var(--text2);border:1.5px solid var(--border)}
.btn-g:hover{background:var(--bg3);color:var(--text)}
.btn-sm{padding:5px 11px;font-size:.76rem;border-radius:8px}
.overlay{position:fixed;inset:0;background:rgba(8,10,18,.62);backdrop-filter:blur(6px);z-index:100;display:flex;align-items:center;justify-content:center;padding:16px}
.modal{background:var(--mbg);border-radius:22px;padding:26px;width:100%;max-width:460px;max-height:92vh;overflow-y:auto;border:1.5px solid var(--border);box-shadow:0 24px 60px var(--sh2)}
.modal-t{font-family:'Fraunces',serif;font-size:1.3rem;font-weight:700;color:var(--text);margin-bottom:20px}
.fg{margin-bottom:13px}
.flbl{display:block;font-size:.69rem;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px}
.finp,.fsel,.ftxt{width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:10px;font-family:'Plus Jakarta Sans',sans-serif;font-size:.86rem;background:var(--ibg);color:var(--text);outline:none;transition:border-color .15s}
.finp:focus,.fsel:focus,.ftxt:focus{border-color:var(--accent)}
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
  const [filter, setFilter] = useState("all");
  const [darkMode, setDarkMode] = useState(()=>{try{return localStorage.getItem("sd-dark")==="1";}catch{return false;}});
  const [game, setGame] = useState({points:0,streak:0,lastStreakDate:"",dailyDate:"",dailyCount:0,owned:[],equipped:{hat:"",face:"",body:"",special:""}});
  const [shopCat, setShopCat] = useState("all");
  const [floats, setFloats] = useState([]);
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
  const [fetchStatus, setFetchStatus] = useState("");

  const emptyAF = {title:"",subject:"",dueDate:"",priority:"medium",progress:0,notes:""};
  const emptyCF = {name:"",days:[],startTime:"09:00",endTime:"10:00",room:"",color:SUBJECT_COLORS[0]};
  const [af, setAf] = useState(emptyAF);
  const [cf, setCf] = useState(emptyCF);

  const saveReady=useRef(false);

  useEffect(()=>{
    try{
      const d=localStorage.getItem(STORAGE_KEY);
      if(d){const p=JSON.parse(d);setAssignments(p.a||[]);setClasses(p.c||[]);if(p.g)setGame(p.g);}
    }catch{}
    // Use timeout so state updates from above settle before we allow saving
    setTimeout(()=>{
      saveReady.current=true;
      setLoaded(true);
    },50);
    const seenVersion=localStorage.getItem("studydesk-seen-version");
    if(seenVersion!==APP_VERSION) setShowReleases(true);
  },[]);

  useEffect(()=>{
    if(!saveReady.current)return;
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify({a:assignments,c:classes,g:game}));}catch{}
  },[assignments,classes,game,loaded]);
  useEffect(()=>{try{localStorage.setItem("sd-dark",darkMode?"1":"0");}catch{}},[darkMode]);

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

  function confirmImport(){const toAdd=(importResult?.assignments||[]).map(a=>({...a,id:Date.now().toString()+Math.random(),progress:0}));setAssignments(p=>[...p,...toAdd]);setImportOpen(false);resetImport();setTab("assignments");checkUnknown(toAdd);}

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


  function addAssignment(){if(!af.title||!af.subject)return;const na={...af,id:Date.now().toString()};setAssignments(p=>[...p,na]);checkUnknown([na]);setAf(emptyAF);setAddingA(false);}
  function delAssignment(id){setAssignments(p=>p.filter(x=>x.id!==id));}
  function updateA(id,patch){setAssignments(prev=>{const a=prev.find(x=>x.id===id);if(a&&patch.progress!==undefined)handleComplete(a.progress,patch.progress);return prev.map(x=>x.id===id?{...x,...patch}:x);});}
  function addClass(){if(!cf.name)return;setClasses(p=>[...p,{...cf,id:Date.now().toString()}]);setCf(emptyCF);setAddingC(false);}
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
    return(
      <div className={"acard"+(ov?" ov":"")} style={{opacity:done?.6:1}}>
        <div className="stripe" style={{background:color,opacity:done?.5:1}}/>
        <div className="amain">
          <div className="atitle" style={{textDecoration:done?"line-through":"none",opacity:done?.7:1}}>{a.title}</div>
          <div className="ameta">
            <span className="mtag" style={{color}}>● {a.subject}</span>
            <span className="ppill" style={{background:pc.bg,color:pc.c}}>{PRIORITY[a.priority]?.label||"Medium"}</span>
            {dueText&&<span className="dbadge" style={{color:dueColor}}>{dueText}</span>}
          </div>
          {!compact&&<div className="qbtns">{[0,25,50,75,100].map(v=><button key={v} className={"qbtn"+(a.progress===v?" on":"")} onClick={()=>updateA(a.id,{progress:v})}>{v}%</button>)}</div>}
        </div>
        {!compact&&<div className="pbar-wrap"><div className="pbar-track"><div className="pbar-fill" style={{width:a.progress+"%",background:done?"#16a34a":color}}/></div><div className="plabel">{a.progress}%</div></div>}
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

  return(
    <>
      <style>{css}</style>
      <div className={"dk"+(darkMode?" dark":"")}>
      <div className="app">

        {/* HEADER */}
        <div className="hdr">
          <div>
            <div className="hdr-title">Study Desk</div>
            <div className="hdr-sub">{dateStr}</div>
          </div>
          <div className="hdr-r">
            {game.streak>0&&<div className="streak-pill">🔥 {game.streak}d</div>}
            <div className="pts-pill">⭐ {game.points}</div>
            <button className="dm-btn" onClick={()=>setDarkMode(d=>!d)} title={darkMode?"Light mode":"Dark mode"} aria-label="Toggle dark mode">
              <div className="dm-knob">{darkMode?"🌙":"☀️"}</div>
            </button>
            <button className="btn btn-g btn-sm" onClick={()=>setShowAbout(true)}>About</button>
            <button className="btn btn-g btn-sm" style={{position:"relative"}} onClick={()=>setShowReleases(true)}>
              🚀 Releases
              {localStorage.getItem("studydesk-seen-version")!==APP_VERSION&&<span style={{position:"absolute",top:-4,right:-4,width:8,height:8,background:"#ef4444",borderRadius:"50%",border:"2px solid var(--bg)"}}/>}
            </button>
            <button className="btn btn-p btn-sm" onClick={()=>{setImportMode("canvas");setImportOpen(true);}}>📥 Import</button>
            <button className="btn btn-p btn-sm" onClick={()=>{setSubjMode("select");setAddingA(true);}}>＋ Add</button>
          </div>
        </div>

        {/* TABS */}
        <div className="tabs">
          {[["dashboard","📊 Dashboard"],["assignments","📝 Assignments"],["schedule","📅 Schedule"],["buddy","🐣 Buddy"],["shop","🛍️ Shop"]].map(([t,l])=>(
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
                    const col=subjectColor(a.subject,classes);
                    const d=daysUntil(a.dueDate);
                    const dc=d<0?"#ef4444":d<=1?"#f59e0b":"var(--text3)";
                    const dt=d<0?Math.abs(d)+"d overdue":d===0?"Today":d===1?"Tomorrow":fmtDate(a.dueDate);
                    return(
                      <div key={a.id} className="cacard">
                        <div className="castripe" style={{background:col}}/>
                        <div style={{flex:1,minWidth:0}}>
                          <div className="catitle">{a.title}</div>
                          <div style={{fontSize:".68rem",color:col,fontWeight:700,marginTop:1}}>{a.subject}</div>
                        </div>
                        {dt&&<div className="cadue" style={{color:dc}}>{dt}</div>}
                      </div>
                    );
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

        {/* ═══ SCHEDULE ══════════════════════════════════════════════ */}
        {tab==="schedule"&&(
          <div>
            <div className="sec-hd"><div className="sec-t">Class Schedule</div><button className="btn btn-p btn-sm" onClick={()=>setAddingC(true)}>＋ Add Class</button></div>
            {classes.length===0?(
              <div className="empty" style={{background:"var(--card)",border:"1.5px dashed var(--border2)",borderRadius:18,padding:"52px 20px"}}>
                <div className="empty-i">📅</div>
                <div className="empty-t">No classes yet</div>
                <div style={{fontSize:".78rem",color:"var(--text4)",marginTop:8,marginBottom:18}}>Add your weekly classes to see them on the timetable</div>
                <button className="btn btn-p" onClick={()=>setAddingC(true)}>＋ Add First Class</button>
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
                            return h>=(sh+sm/60)&&h<(eh+em/60);
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

        {floats.map(f=><div key={f.id} className="pts-float" style={{color:f.streak?"#EA580C":"#F59E0B"}}>+{f.pts}{f.streak?"🔥":"⭐"}</div>)}

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
                <div style={{background:"#EEF2FF",border:"1.5px solid #c7d2fe",borderRadius:12,padding:"12px 14px",marginBottom:14}}>
                  <div style={{fontSize:".79rem",fontWeight:700,color:"#4338ca",marginBottom:10}}>3 steps — no console needed:</div>
                  <div className="import-step"><div className="import-num" style={{background:"#4338ca"}}>1</div>
                    <div className="import-txt">
                      Make sure you're logged into Canvas, then open this link in a new tab:
                      <div style={{display:"flex",alignItems:"center",gap:6,marginTop:6,position:"relative"}}>
                        <a href={CANVAS_URL} target="_blank" rel="noreferrer" style={{fontSize:".68rem",fontFamily:"monospace",color:"#4338ca",wordBreak:"break-all",flex:1}}>{CANVAS_URL}</a>
                        <CopyBtn text={CANVAS_URL}/>
                      </div>
                    </div>
                  </div>
                  <div className="import-step"><div className="import-num" style={{background:"#4338ca"}}>2</div><div className="import-txt">You'll see a page full of text — press <b>Ctrl+A</b> then <b>Ctrl+C</b> to copy all of it</div></div>
                  <div className="import-step"><div className="import-num" style={{background:"#4338ca"}}>3</div><div className="import-txt">Paste it in the box below and hit Import!</div></div>
                </div>
                <div className="fg">
                  <label className="flbl">Paste Canvas data here</label>
                  <textarea className="ftxt" style={{minHeight:80,fontFamily:"monospace",fontSize:".75rem"}} value={canvasPaste} onChange={e=>setCanvasPaste(e.target.value)} placeholder="Paste the page contents here..."/>
                </div>
                <div className="mactions">
                  <button className="btn btn-g" onClick={()=>{setImportOpen(false);resetImport();}}>Cancel</button>
                  <button className="btn btn-p" style={{background:"#4338ca"}} onClick={importFromCanvasPaste} disabled={!canvasPaste.trim()}>🎓 Import Assignments</button>
                </div>
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
                  {importResult.source==="canvas"?" from Canvas":importResult.source==="agenda"?` from agenda${importResult.slideCount>0?` + ${importResult.slideCount} slide deck${importResult.slideCount!==1?"s":""}`:""}`:" from slides"}
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

    </>
  );
}