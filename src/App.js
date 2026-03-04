import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "hw-tracker-v1";
const APP_VERSION = "1.0.0";
const RELEASES = [
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
body{font-family:'Plus Jakarta Sans',sans-serif;background:#FAF7F2;min-height:100vh}
.app{max-width:1080px;margin:0 auto;padding:0 20px 80px}
.release-overlay{position:fixed;inset:0;background:rgba(27,31,59,.55);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px}
.release-box{background:#fff;border-radius:20px;width:100%;max-width:500px;max-height:85vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(27,31,59,.2)}
.release-hd{padding:22px 24px 16px;border-bottom:1.5px solid #EDE9E2;display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.release-title{font-family:'Fraunces',serif;font-size:1.4rem;font-weight:700;color:#1B1F3B}
.release-sub{font-size:.75rem;color:#aaa;margin-top:3px}
.release-body{overflow-y:auto;padding:20px 24px;flex:1}
.release-entry{margin-bottom:24px}
.release-entry:last-child{margin-bottom:0}
.release-ver{display:inline-flex;align-items:center;gap:8px;margin-bottom:10px}
.release-badge{background:#1B1F3B;color:#fff;font-size:.7rem;font-weight:700;padding:3px 10px;border-radius:20px}
.release-date{font-size:.72rem;color:#aaa;font-weight:500}
.release-name{font-size:.95rem;font-weight:700;color:#1B1F3B;margin-bottom:8px}
.release-changes{display:flex;flex-direction:column;gap:5px}
.release-change{display:flex;gap:8px;font-size:.8rem;color:#555;line-height:1.5}
.release-dot{color:#f5a623;font-size:.9rem;flex-shrink:0;margin-top:1px}
.hdr{padding:28px 0 18px;display:flex;align-items:flex-start;justify-content:space-between;border-bottom:2px solid #1B1F3B;margin-bottom:24px;gap:12px;flex-wrap:wrap}
.hdr-title{font-family:'Fraunces',serif;font-size:2.1rem;font-weight:700;color:#1B1F3B;letter-spacing:-0.5px;line-height:1}
.hdr-sub{font-size:.8rem;color:#aaa;margin-top:4px}
.tabs{display:flex;gap:4px;margin-bottom:24px;background:#F0EDE7;padding:4px;border-radius:12px;width:fit-content}
.tab{padding:7px 20px;border-radius:9px;border:none;background:transparent;font-family:'Plus Jakarta Sans',sans-serif;font-size:.85rem;font-weight:600;color:#888;cursor:pointer;transition:all .15s}
.tab.on{background:#1B1F3B;color:#fff}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:24px}
.stat{background:#fff;border-radius:14px;padding:14px 16px;border:1.5px solid #EDE9E2}
.stat-n{font-family:'Fraunces',serif;font-size:1.9rem;font-weight:700;color:#1B1F3B;line-height:1}
.stat-l{font-size:.75rem;color:#aaa;margin-top:4px;font-weight:500}
.sec-hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.sec-t{font-family:'Fraunces',serif;font-size:1.2rem;font-weight:600;color:#1B1F3B}
.alist{display:flex;flex-direction:column;gap:8px}
.acard{background:#fff;border-radius:13px;padding:12px 14px;border:1.5px solid #EDE9E2;display:flex;align-items:center;gap:11px;transition:transform .15s,box-shadow .15s}
.acard:hover{transform:translateY(-1px);box-shadow:0 4px 18px rgba(27,31,59,.07)}
.acard.ov{border-color:#fca5a5;background:#fff8f8}
.stripe{width:4px;border-radius:4px;align-self:stretch;min-height:36px;flex-shrink:0}
.amain{flex:1;min-width:0}
.atitle{font-weight:600;color:#1B1F3B;font-size:.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ameta{display:flex;gap:6px;align-items:center;margin-top:3px;flex-wrap:wrap}
.mtag{font-size:.72rem;color:#888;font-weight:500}
.ppill{font-size:.67rem;font-weight:700;padding:2px 7px;border-radius:20px}
.dbadge{font-size:.72rem;font-weight:600}
.pbar-wrap{width:100px;flex-shrink:0}
.pbar-track{height:5px;background:#F0EDE7;border-radius:4px;overflow:hidden}
.pbar-fill{height:100%;border-radius:4px;transition:width .4s ease}
.plabel{font-size:.68rem;color:#aaa;text-align:right;margin-top:2px;font-weight:600}
.qbtns{display:flex;gap:3px;margin-top:5px}
.qbtn{font-size:.66rem;padding:2px 5px;border-radius:5px;border:1px solid #EDE9E2;background:#fff;cursor:pointer;color:#888;font-weight:600;transition:all .12s;font-family:'Plus Jakarta Sans',sans-serif}
.qbtn.on{background:#1B1F3B;color:#fff;border-color:#1B1F3B}
.qbtn:hover:not(.on){background:#F0EDE7}
.ibtn{width:26px;height:26px;border-radius:7px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.75rem;background:transparent;color:#ddd;transition:all .15s}
.ibtn:hover{background:#fef2f2;color:#dc2626}
.btn{padding:7px 15px;border-radius:10px;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-weight:600;font-size:.82rem;transition:all .15s}
.btn-p{background:#1B1F3B;color:#fff}
.btn-p:hover{background:#2d3260}
.btn-g{background:transparent;color:#888;padding:7px 13px}
.btn-g:hover{background:#F0EDE7;color:#1B1F3B}
.overlay{position:fixed;inset:0;background:rgba(27,31,59,.55);backdrop-filter:blur(4px);z-index:100;display:flex;align-items:center;justify-content:center;padding:16px}
.modal{background:#FAF7F2;border-radius:18px;padding:24px;width:100%;max-width:450px;max-height:92vh;overflow-y:auto}
.modal-t{font-family:'Fraunces',serif;font-size:1.35rem;font-weight:700;color:#1B1F3B;margin-bottom:18px}
.fg{margin-bottom:12px}
.flbl{display:block;font-size:.72rem;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}
.finp,.fsel,.ftxt{width:100%;padding:8px 10px;border:1.5px solid #EDE9E2;border-radius:9px;font-family:'Plus Jakarta Sans',sans-serif;font-size:.86rem;background:#fff;color:#1B1F3B;outline:none;transition:border-color .15s}
.finp:focus,.fsel:focus,.ftxt:focus{border-color:#1B1F3B}
.ftxt{resize:vertical;min-height:60px}
.frow{display:grid;grid-template-columns:1fr 1fr;gap:9px}
.range{width:100%;accent-color:#1B1F3B}
.mactions{display:flex;gap:7px;justify-content:flex-end;margin-top:16px}
.dtoggle{padding:5px 9px;border-radius:7px;border:1.5px solid #EDE9E2;cursor:pointer;font-size:.76rem;font-weight:600;background:#fff;color:#888;transition:all .15s;font-family:'Plus Jakarta Sans',sans-serif}
.dtoggle.on{border-color:#1B1F3B;background:#1B1F3B;color:#fff}
.dtogglerow{display:flex;gap:4px;flex-wrap:wrap}
.swatches{display:flex;gap:6px;flex-wrap:wrap}
.swatch{width:24px;height:24px;border-radius:50%;cursor:pointer;border:2.5px solid transparent;transition:transform .1s}
.swatch.on{border-color:#1B1F3B;transform:scale(1.15)}
.sgrid{background:#fff;border-radius:14px;border:1.5px solid #EDE9E2;overflow:auto}
.shdr{display:grid;grid-template-columns:52px repeat(7,1fr);background:#1B1F3B;color:#fff;min-width:480px}
.shcell{padding:8px 3px;text-align:center;font-size:.75rem;font-weight:600}
.srow{display:grid;grid-template-columns:52px repeat(7,1fr);border-top:1px solid #F0EDE7;min-height:38px;min-width:480px}
.stime{padding:3px 6px 0 0;font-size:.65rem;color:#bbb;text-align:right;font-weight:500;padding-top:4px}
.scell{border-left:1px solid #F0EDE7;position:relative;padding:1px}
.cblock{border-radius:4px;padding:2px 4px;font-size:.65rem;font-weight:600;color:#fff;height:100%;display:flex;flex-direction:column;justify-content:center;line-height:1.3}
.sfilt{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:12px}
.sfbtn{padding:4px 11px;border-radius:20px;border:1.5px solid #EDE9E2;background:#fff;font-size:.75rem;font-weight:600;cursor:pointer;color:#888;transition:all .12s;font-family:'Plus Jakarta Sans',sans-serif}
.twocol{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.tclass{display:flex;flex-direction:column;gap:7px}
.tccard{display:flex;align-items:center;gap:10px;background:#fff;border-radius:11px;padding:10px 12px;border:1.5px solid #EDE9E2}
.tcdot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
.tcname{font-weight:600;color:#1B1F3B;font-size:.86rem}
.tctime{font-size:.74rem;color:#aaa;margin-left:auto;white-space:nowrap}
.empty{text-align:center;padding:40px 20px;color:#ccc}
.empty-i{font-size:2rem;margin-bottom:8px}
.empty-t{font-family:'Fraunces',serif;font-size:1rem;color:#ccc}
.clsrow{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:13px}
.clstag{display:flex;align-items:center;gap:5px;padding:4px 10px;background:#fff;border-radius:9px;border:1.5px solid #EDE9E2}
.import-step{display:flex;align-items:flex-start;gap:9px;margin-bottom:11px}
.import-num{width:22px;height:22px;border-radius:50%;background:#1B1F3B;color:#fff;font-size:.68rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px}
.import-txt{font-size:.81rem;color:#555;line-height:1.5}
.import-txt b{color:#1B1F3B}
.apreview{border:1.5px solid #EDE9E2;border-radius:11px;overflow:hidden;margin-top:10px}
.apreview-hd{background:#1B1F3B;color:#fff;padding:7px 12px;font-size:.76rem;font-weight:600}
.apreview-list{max-height:200px;overflow-y:auto}
.apreview-item{display:flex;align-items:center;gap:8px;padding:7px 12px;border-bottom:1px solid #F0EDE7}
.apreview-item:last-child{border-bottom:none}
.apreview-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.apreview-name{font-size:.82rem;font-weight:600;color:#1B1F3B;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.apreview-sub{font-size:.71rem;color:#aaa}
.apreview-due{font-size:.7rem;color:#888;white-space:nowrap}
.spin{animation:spin .8s linear infinite;display:inline-block}
@keyframes spin{to{transform:rotate(360deg)}}
.err-box{background:#fef2f2;border:1.5px solid #fca5a5;border-radius:9px;padding:10px 12px;font-size:.8rem;color:#dc2626;margin-top:8px;line-height:1.5}
.success-box{background:#f0fdf4;border:1.5px solid #86efac;border-radius:9px;padding:9px 12px;font-size:.8rem;color:#16a34a;margin-top:6px;font-weight:600}
.loading-box{display:flex;flex-direction:column;align-items:center;padding:30px;gap:12px;color:#888}
.loading-box p{font-size:.82rem;text-align:center;max-width:260px;line-height:1.5}
.itabs{display:flex;gap:4px;background:#F0EDE7;padding:4px;border-radius:10px;margin-bottom:16px}
.itab{flex:1;padding:7px 0;border-radius:7px;border:none;font-family:'Plus Jakarta Sans',sans-serif;font-size:.82rem;font-weight:600;color:#888;cursor:pointer;transition:all .15s;background:transparent}
.itab.on{background:#1B1F3B;color:#fff}
.itab.canvas-on{background:#4338ca;color:#fff}
.itab.agenda-on{background:#ea580c;color:#fff}
@media(max-width:650px){.twocol{grid-template-columns:1fr}.hdr-title{font-size:1.6rem}.pbar-wrap{display:none}.frow{grid-template-columns:1fr}}
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

export default function StudyDesk() {
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [tab, setTab] = useState("dashboard");
  const [showReleases, setShowReleases] = useState(false);
  const [releaseViewed, setReleaseViewed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [addingA, setAddingA] = useState(false);
  const [addingC, setAddingC] = useState(false);
  const [filter, setFilter] = useState("all");

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
      if(d){const p=JSON.parse(d);setAssignments(p.a||[]);setClasses(p.c||[]);}
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
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify({a:assignments,c:classes}));}catch{}
  },[assignments,classes,loaded]);

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

  function resetImport(){setImportUrl("");setPasteText("");setCanvasPaste("");setImportResult(null);setImportStep("url");setCanvasStatus("");setAgendaUrl("");setFetchStatus("");setAgendaStep("url");setAgendaDocText("");setAgendaSlideLinks([]);setAgendaSlideTexts([]);}

  function dismissReleases(){
    localStorage.setItem("studydesk-seen-version", APP_VERSION);
    setShowReleases(false);
    setReleaseViewed(true);
  }

  function confirmImport(){
    const toAdd=(importResult?.assignments||[]).map(a=>({...a,id:Date.now().toString()+Math.random(),progress:0}));
    setAssignments(p=>[...p,...toAdd]);
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


  function addAssignment(){if(!af.title||!af.subject)return;setAssignments(p=>[...p,{...af,id:Date.now().toString()}]);setAf(emptyAF);setAddingA(false);}
  function delAssignment(id){setAssignments(p=>p.filter(x=>x.id!==id));}
  function updateA(id,patch){setAssignments(p=>p.map(a=>a.id===id?{...a,...patch}:a));}
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
    let dueText="",dueColor="#aaa";
    if(done){dueText="✓ Done";dueColor="#16a34a";}
    else if(ov){dueText=`${Math.abs(days)}d overdue`;dueColor="#dc2626";}
    else if(days===0){dueText="Due today!";dueColor="#d97706";}
    else if(days===1){dueText="Tomorrow";dueColor="#d97706";}
    else if(a.dueDate){dueText=fmtDate(a.dueDate);}
    return(
      <div className={`acard${ov?" ov":""}`} style={{opacity:done?.65:1}}>
        <div className="stripe" style={{background:color}}/>
        <div className="amain">
          <div className="atitle" style={{textDecoration:done?"line-through":"none"}}>{a.title}</div>
          <div className="ameta">
            <span className="mtag" style={{color}}>● {a.subject}</span>
            <span className="ppill" style={{background:PRIORITY[a.priority]?.bg,color:PRIORITY[a.priority]?.text}}>{PRIORITY[a.priority]?.label}</span>
            {dueText&&<span className="dbadge" style={{color:dueColor}}>{dueText}</span>}
          </div>
          {!compact&&<div className="qbtns">{[0,25,50,75,100].map(v=><button key={v} className={`qbtn${a.progress===v?" on":""}`} onClick={()=>updateA(a.id,{progress:v})}>{v}%</button>)}</div>}
        </div>
        {!compact&&<div className="pbar-wrap"><div className="pbar-track"><div className="pbar-fill" style={{width:a.progress+"%",background:done?"#16a34a":color}}/></div><div className="plabel">{a.progress}%</div></div>}
        <button className="ibtn" onClick={()=>delAssignment(a.id)}>✕</button>
      </div>
    );
  }

  const dateStr=new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});

  return(
    <>
      <style>{css}</style>
      <div className="app">
        <div className="hdr">
          <div>
            <div className="hdr-title">Study Desk</div>
            <div className="hdr-sub">{dateStr}</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
            <button className="btn btn-g" onClick={()=>{setShowReleases(true);}} style={{fontSize:".75rem",padding:"6px 12px",position:"relative"}}>
              🚀 Releases
              {localStorage.getItem("studydesk-seen-version")!==APP_VERSION&&<span style={{position:"absolute",top:-4,right:-4,width:8,height:8,background:"#ef4444",borderRadius:"50%",border:"2px solid #FAF7F2"}}/>}
            </button>
            <button className="btn btn-p" style={{background:"#1B1F3B"}} onClick={()=>{setImportMode("canvas");setImportOpen(true);}}>📥 Import</button>
            <button className="btn btn-p" onClick={()=>setAddingA(true)}>+ Add</button>
          </div>
        </div>

        <div className="tabs">
          {["dashboard","assignments","schedule"].map(t=>(
            <button key={t} className={`tab${tab===t?" on":""}`} onClick={()=>setTab(t)}>{t[0].toUpperCase()+t.slice(1)}</button>
          ))}
        </div>

        {tab==="dashboard"&&(
          <div>
            <div className="stats">
              <div className="stat"><div className="stat-n">{assignments.filter(a=>a.progress<100).length}</div><div className="stat-l">Pending</div></div>
              <div className="stat" style={{borderColor:overdue.length>0?"#fca5a5":""}}><div className="stat-n" style={{color:overdue.length>0?"#dc2626":""}}>{overdue.length}</div><div className="stat-l">Overdue</div></div>
              <div className="stat"><div className="stat-n">{dueToday.length}</div><div className="stat-l">Due Today</div></div>
              <div className="stat"><div className="stat-n">{completed.length}</div><div className="stat-l">Completed</div></div>
              <div className="stat"><div className="stat-n">{classes.length}</div><div className="stat-l">Classes</div></div>
            </div>
            <div className="twocol">
              <div>
                <div className="sec-hd"><div className="sec-t">Upcoming Work</div></div>
                <div className="alist">
                  {upcoming.slice(0,6).map(a=><ACard key={a.id} a={a} compact/>)}
                  {upcoming.length===0&&<div className="empty"><div className="empty-i">🎉</div><div className="empty-t">All caught up!</div></div>}
                </div>
              </div>
              <div>
                <div className="sec-hd"><div className="sec-t">Today — {todayAbbr()}</div></div>
                <div className="tclass">
                  {[...todayC].sort((a,b)=>a.startTime.localeCompare(b.startTime)).map(c=>(
                    <div key={c.id} className="tccard">
                      <div className="tcdot" style={{background:c.color}}/>
                      <div><div className="tcname">{c.name}</div>{c.room&&<div style={{fontSize:".7rem",color:"#bbb"}}>{c.room}</div>}</div>
                      <div className="tctime">{fmt12(c.startTime)}–{fmt12(c.endTime)}</div>
                    </div>
                  ))}
                  {todayC.length===0&&<div className="empty"><div className="empty-i">📅</div><div className="empty-t">No classes today</div></div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab==="assignments"&&(
          <div>
            <div className="sec-hd"><div className="sec-t">All Assignments</div></div>
            <div className="sfilt">
              {["all",...subjects].map(s=>(
                <button key={s} className="sfbtn" onClick={()=>setFilter(s)} style={filter===s?{background:s==="all"?"#1B1F3B":subjectColor(s,classes),borderColor:s==="all"?"#1B1F3B":subjectColor(s,classes),color:"#fff"}:{}}>
                  {s==="all"?"All":s}
                </button>
              ))}
            </div>
            <div className="alist">
              {sortedA.map(a=><ACard key={a.id} a={a}/>)}
              {sortedA.length===0&&<div className="empty"><div className="empty-i">📝</div><div className="empty-t">No assignments yet</div></div>}
            </div>
          </div>
        )}

        {tab==="schedule"&&(
          <div>
            <div className="sec-hd"><div className="sec-t">Class Schedule</div><button className="btn btn-p" onClick={()=>setAddingC(true)}>+ Add Class</button></div>
            {classes.length>0&&(
              <div className="clsrow">
                {classes.map(c=>(
                  <div key={c.id} className="clstag">
                    <div style={{width:8,height:8,borderRadius:"50%",background:c.color,flexShrink:0}}/>
                    <span style={{fontSize:".8rem",fontWeight:600,color:"#1B1F3B"}}>{c.name}</span>
                    <span style={{fontSize:".7rem",color:"#aaa"}}>{c.days.join(", ")} · {fmt12(c.startTime)}–{fmt12(c.endTime)}</span>
                    {c.room&&<span style={{fontSize:".68rem",color:"#bbb"}}>📍{c.room}</span>}
                    <button className="ibtn" onClick={()=>delClass(c.id)} style={{width:18,height:18,fontSize:".65rem"}}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <div className="sgrid">
              <div className="shdr">
                <div className="shcell"/>
                {DAYS.map(d=><div key={d} className="shcell" style={{background:d===todayAbbr()?"#2d3260":""}}>{d}</div>)}
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
                      <div key={d} className="scell" style={{background:d===todayAbbr()?"#FAFAF8":""}}>
                        {ccs.map(c=><div key={c.id} className="cblock" style={{background:c.color}}><span>{c.name}</span>{c.room&&<span style={{opacity:.8,fontSize:".58rem"}}>{c.room}</span>}</div>)}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Assignment */}
      {addingA&&(
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&(setAddingA(false),setAf(emptyAF))}>
          <div className="modal">
            <div className="modal-t">New Assignment</div>
            <div className="fg"><label className="flbl">Title *</label><input className="finp" value={af.title} onChange={e=>setAf({...af,title:e.target.value})} placeholder="e.g. Chapter 5 Essay"/></div>
            <div className="frow">
              <div className="fg"><label className="flbl">Subject *</label><input className="finp" list="slist" value={af.subject} onChange={e=>setAf({...af,subject:e.target.value})} placeholder="e.g. Math"/><datalist id="slist">{subjects.map(s=><option key={s} value={s}/>)}</datalist></div>
              <div className="fg"><label className="flbl">Due Date</label><input className="finp" type="date" value={af.dueDate} onChange={e=>setAf({...af,dueDate:e.target.value})}/></div>
            </div>
            <div className="fg"><label className="flbl">Priority</label><select className="fsel" value={af.priority} onChange={e=>setAf({...af,priority:e.target.value})}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></div>
            <div className="fg"><label className="flbl">Progress — {af.progress}%</label><input className="range" type="range" min="0" max="100" step="5" value={af.progress} onChange={e=>setAf({...af,progress:+e.target.value})}/></div>
            <div className="fg"><label className="flbl">Notes</label><textarea className="ftxt" value={af.notes} onChange={e=>setAf({...af,notes:e.target.value})} placeholder="Any notes..."/></div>
            <div className="mactions"><button className="btn btn-g" onClick={()=>{setAddingA(false);setAf(emptyAF);}}>Cancel</button><button className="btn btn-p" onClick={addAssignment}>Add Assignment</button></div>
          </div>
        </div>
      )}

      {/* Add Class */}
      {addingC&&(
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&(setAddingC(false),setCf(emptyCF))}>
          <div className="modal">
            <div className="modal-t">New Class</div>
            <div className="fg"><label className="flbl">Class Name *</label><input className="finp" value={cf.name} onChange={e=>setCf({...cf,name:e.target.value})} placeholder="e.g. Calculus II"/></div>
            <div className="fg"><label className="flbl">Days</label><div className="dtogglerow">{DAYS.map(d=><button key={d} className={`dtoggle${cf.days.includes(d)?" on":""}`} onClick={()=>setCf({...cf,days:cf.days.includes(d)?cf.days.filter(x=>x!==d):[...cf.days,d]})}>{d}</button>)}</div></div>
            <div className="frow">
              <div className="fg"><label className="flbl">Start Time</label><input className="finp" type="time" value={cf.startTime} onChange={e=>setCf({...cf,startTime:e.target.value})}/></div>
              <div className="fg"><label className="flbl">End Time</label><input className="finp" type="time" value={cf.endTime} onChange={e=>setCf({...cf,endTime:e.target.value})}/></div>
            </div>
            <div className="fg"><label className="flbl">Room</label><input className="finp" value={cf.room} onChange={e=>setCf({...cf,room:e.target.value})} placeholder="e.g. Room 204"/></div>
            <div className="fg"><label className="flbl">Color</label><div className="swatches">{SUBJECT_COLORS.map(col=><div key={col} className={`swatch${cf.color===col?" on":""}`} style={{background:col}} onClick={()=>setCf({...cf,color:col})}/>)}</div></div>
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