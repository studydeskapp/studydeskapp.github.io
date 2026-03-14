/* eslint-disable */
// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                        STUDYDESK — App.js                                   ║
// ║                                                                              ║
// ║  QUICK NAVIGATION (Ctrl+F the section name):                                ║
// ║    § FIREBASE CONFIG       — constants, auth, Firestore REST helpers        ║
// ║    § CANVAS PROXY          — Cloudflare Worker proxy + fetchWithFallback    ║
// ║    § FIREBASE AUTH         — signUp, signIn, Google SSO, session            ║
// ║    § FIREBASE DATA         — load/save/presence/admin                       ║
// ║    § CSS                   — all styles (one big template string)           ║
// ║    § CONSTANTS             — colors, shop items, release notes              ║
// ║    § HELPER FUNCTIONS      — date utils, color utils, subject utils         ║
// ║    § SMALL COMPONENTS      — CopyBtn, FetcherCopyBox, BuddyCreature         ║
// ║    § AUTH SCREEN           — login / signup / Google SSO UI                 ║
// ║    § ADMIN PANEL           — stats dashboard, user management               ║
// ║    § MAIN COMPONENT        — StudyDesk() — all state lives here            ║
// ║      ├─ STATE              — useState declarations (grouped by feature)     ║
// ║      ├─ REFS               — useRef declarations                            ║
// ║      ├─ EFFECTS            — useEffect hooks (load, save, sync, etc.)       ║
// ║      ├─ CANVAS SYNC        — syncCanvas(), importFromCanvasAPI()            ║
// ║      ├─ IMPORT LOGIC       — parseHomeworkFromText(), importFromDoc()       ║
// ║      ├─ GAME LOGIC         — handleComplete(), spawnFloat()                 ║
// ║      ├─ TIMER LOGIC        — startTimer(), resetTimer(), fmtTimer()        ║
// ║      ├─ LEADERBOARD        — fetchLeaderboard()                             ║
// ║      └─ RENDER             — JSX (tabs, modals, bottom nav)                 ║
// ║           ├─ MOBILE HEADER                                                  ║
// ║           ├─ DESKTOP HEADER                                                 ║
// ║           ├─ TAB: DASHBOARD                                                 ║
// ║           ├─ TAB: ASSIGNMENTS                                               ║
// ║           ├─ TAB: GRADES                                                    ║
// ║           ├─ TAB: SCHEDULE                                                  ║
// ║           ├─ TAB: TIMER                                                     ║
// ║           ├─ TAB: BUDDY                                                     ║
// ║           ├─ TAB: SHOP                                                      ║
// ║           ├─ MODALS (add assignment, add class, import, canvas setup...)    ║
// ║           ├─ PWA BANNER                                                     ║
// ║           ├─ LEADERBOARD MODAL                                              ║
// ║           └─ MOBILE BOTTOM NAV                                              ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

import React, { useState, useEffect, useRef, useMemo } from "react";

// ── Extracted Modules ────────────────────────────────────────────────────────────
import { css } from './styles/styles';
import { 
  FB_KEY, FB_PROJECT, FB_AUTH, FB_FS, GOOGLE_CLIENT_ID,
  fbSignUp, fbSignIn, fbResetPassword, fbSendVerificationEmail, 
  fbCheckEmailVerified, fbDeleteAccount, fbAdminDeleteUserData,
  fbGoogleSignIn, fbLoadData, fbSaveData, fbGetSession, 
  fbSetSession, fbClearSession, fbIncrementStat, fbUpdatePresence, 
  fbGetAdminStats, fbEnsureValidToken, fbSaveNote, fbDeleteNote, fbGetNotes
} from './utils/firebase';
import { callGemini, callGeminiStream, getGeminiKey } from './utils/gemini';
import { 
  CF_PROXY, fetchWithFallback, getBuddyStage, daysUntil, 
  fmtDate, fmt12, fmt12h, todayAbbr, subjectColor, extractId 
} from './utils/helpers';
import { 
  RELEASES, PRIORITY, SHOP_ITEMS, BUDDY_STAGES, 
  DAYS, HOURS, SUBJECT_COLORS 
} from './constants';
import AuthScreen from './components/auth/AuthScreen';
import AdminPanel from './components/admin/AdminPanel';
import BuddyCreature from './components/shared/BuddyCreature';
import PhoneUploadPage from './components/shared/PhoneUploadPage';
import Header from './components/shared/Header';
import { CopyBtn, FetcherCopyBox } from './components/shared/UtilityComponents';
import KeyboardShortcutsPanel from './components/shared/KeyboardShortcutsPanel';
import NotificationCenter from './components/shared/NotificationCenter';
import MultiSelectBar from './components/shared/MultiSelectBar';
import Router from './components/landing/Router';

// ── Tab Components ───────────────────────────────────────────────────────────────
import DashboardTab from './components/tabs/DashboardTab';
import AssignmentsTab from './components/tabs/AssignmentsTab';
import GradesTab from './components/tabs/GradesTab';
import ScheduleTab from './components/tabs/ScheduleTab';
import TimerTab from './components/tabs/TimerTab';
import BuddyTab from './components/tabs/BuddyTab';
import ShopTab from './components/tabs/ShopTab';
import AITab from './components/tabs/AITab';
import AnalyticsTab from './components/tabs/AnalyticsTab';
import NotesTab from './components/tabs/NotesTab';
import CalendarTab from './components/tabs/CalendarTab';
import MobileApp from './components/mobile/MobileApp';

// ── Service Modules ──────────────────────────────────────────────────────────────
import { handleComplete, buyItem, equipItem, addFloat, launchConfetti, checkUnknown } from './services/gameLogic';
import { startTimer, resetTimer, fmtTimer, playDoneSound, onTimerComplete } from './services/timerLogic';
import { syncCanvas } from './services/canvasSync';
import { 
  resetImport, parseHomeworkFromText, importFromCanvasPaste, importFromCanvasAPI, 
  importFromSlides, extractDocId, fetchViaProxy, confirmImport 
} from './services/importLogic';
import { fetchLeaderboard } from './services/leaderboardLogic';
import { getBuddyQuote, getBuddyMood, getBuddyReaction, getBuddyTip } from './services/buddyLogic';
import { getSmartRecommendations, getTimeBasedSuggestion } from './services/smartPriority';
import { checkAndCreateFromTemplates, createTemplateFromAssignment, validateTemplate, getTemplatePreview } from './services/templateLogic';
import { useTimerState } from './hooks/useTimerState';
import { useToast } from './contexts/ToastContext';

// ── Local Constants (not extracted) ─────────────────────────────────────────────
const IS_PREVIEW = false;
const isChromebook = navigator.userAgentData?.platform === "Chrome OS" || navigator.userAgent.includes("CrOS");
const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const STORAGE_KEY = "hw-tracker-v1";
const APP_VERSION = "1.7.0";


export default function StudyDesk() {
  const { toast } = useToast();
  // ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
  // STATE — Core data (persisted to Firestore)
  
  // Restore path from 404.html redirect - must run BEFORE route detection
  const [pathRestored, setPathRestored] = useState(false);
  
  useEffect(()=>{
    if(!pathRestored){
      const savedPath = sessionStorage.getItem('spa-path');
      if(savedPath){
        console.log("Restoring path:", savedPath);
        sessionStorage.removeItem('spa-path');
        window.history.replaceState(null, '', savedPath);
      }
      setPathRestored(true);
    }
  },[pathRestored]);
  // ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [chats, setChats] = useState([]);
  const [notes, setNotes] = useState([]);
  // ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
  // STATE — UI / Navigation
  // ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
  const [tab, setTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [pwaPrompt, setPwaPrompt] = useState(null);
  // ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
  // STATE — Study Timer + Leaderboard
  // ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
  const timerState = useTimerState();
  const {
    timerMode, setTimerMode, timerSeconds, setTimerSeconds, timerRunning, setTimerRunning,
    timerInterval, setTimerInterval, timerSessions, setTimerSessions, showCustomTimer, setShowCustomTimer,
    customFocus, setCustomFocus, customShort, setCustomShort, customLong, setCustomLong,
    customRounds, setCustomRounds, autoStartBreaks, setAutoStartBreaks, sessionCount, setSessionCount,
  } = timerState;
  const [leaderboard, setLeaderboard] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showReleases, setShowReleases] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [releaseViewed, setReleaseViewed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [addingA, setAddingA] = useState(false);
  const [validatingAssignment, setValidatingAssignment] = useState(false);
  const [addingC, setAddingC] = useState(false);
  const [schoolWiz, setSchoolWiz] = useState(null);
  // schoolWiz = null | {step:"search"|"confirm"|"periods", query, results, school, numPeriods, periods:[{name,start,end,days}], currentPeriod}
  const [filter, setFilter] = useState("all");
  const [darkMode, setDarkMode] = useState(()=>{try{return localStorage.getItem("sd-dark")==="1";}catch{return false;}});
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedAssignments, setSelectedAssignments] = useState([]);
  // ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
  // STATE — Auth + User session
  // ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
  const [user, setUser] = useState(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [showAuthScreen, setShowAuthScreen] = useState(false);
  const [authMode, setAuthMode] = useState('signup'); // 'signin' or 'signup'
  const logoClicks = useRef(0);
  const logoTimer = useRef(null);
  const [proxyBlocked, setProxyBlocked] = useState(false);
  const [isMobile, setIsMobile] = useState(()=>window.innerWidth<=768);
  useEffect(()=>{
    const handler=()=>setIsMobile(window.innerWidth<=768);
    window.addEventListener("resize",handler);
    return()=>window.removeEventListener("resize",handler);
  },[]);
  // Proxy test removed - will detect blocking when actually needed
  
  function handleLogoClick(){
    logoClicks.current+=1;
    clearTimeout(logoTimer.current);
    logoTimer.current=setTimeout(()=>{logoClicks.current=0;},1800);
    // 5-click logo trick disabled — use /admin route instead
  }
  // /admin route detection - check pathname directly like upload route
  const ADMIN_EMAIL = "asgoyal1@stu.naperville203.org";
  const pathname = window.location.pathname;
  const isAdminRoute = pathname === "/admin" || pathname === "/admin/" || window.location.hash === "#admin" || new URLSearchParams(window.location.search).get("admin")==="1";
  
  // Debug logging
  if(pathname.includes("admin")){
    console.log("Admin route check:", {pathname, isAdminRoute, user: !!user});
  }
  
  // /upload/:id route detection for phone uploads
  const uploadMatch = window.location.pathname.match(/^\/upload\/([a-zA-Z0-9]+)$/);
  const isUploadRoute = !!uploadMatch;
  const uploadId = uploadMatch?.[1];
  
  // Force clear any existing session on admin route so non-admins can't auto-login

  const [adminRouteAuthed, setAdminRouteAuthed] = useState(false);

  const [authLoading, setAuthLoading] = useState(true);
  // ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
  // STATE — Game / Buddy / Shop
  // game.points  = total XP earned
  // game.streak  = consecutive days with assignments done
  // game.owned   = array of purchased shop item IDs
  // game.equipped = {hat, face, body, special} item IDs
  // ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
  const [game, setGame] = useState({points:0,streak:0,lastStreakDate:"",dailyDate:"",dailyCount:0,owned:[],equipped:{hat:"",face:"",body:"",special:""}});
  const [shopCat, setShopCat] = useState("all");
  const [floats, setFloats] = useState([]);
  const [confetti, setConfetti] = useState([]);

  // Animation handlers moved to service
  const [schedPrompt, setSchedPrompt] = useState(null);
  const [subjMode, setSubjMode] = useState("select");
  
  // ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
  // STATE — Templates & Smart Features
  // ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
  const [templates, setTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [buddyReaction, setBuddyReaction] = useState(null);
  const [lastBuddyQuote, setLastBuddyQuote] = useState(null);
  const [showSmartSuggestions, setShowSmartSuggestions] = useState(false);
  
  // ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
  // STATE — Assignment Detail View & Sorting
  // ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [editingAssignment, setEditingAssignment] = useState(false);
  const [sortBy, setSortBy] = useState("date"); // date | priority
  const [sortOrder, setSortOrder] = useState("asc"); // asc | desc

  // ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
  // STATE — Import wizard (Canvas paste, doc, agenda)
  // ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
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
  // ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
  // STATE — Canvas LMS integration
  // canvasToken   = API token (stored in localStorage)
  // canvasBaseUrl = school Canvas URL (e.g. naperville.instructure.com)
  // canvasSync    = { lastSync, syncing, newSubmissions, error, everSucceeded }
  // tokenDraft    = temp value while user types in the Canvas setup modal
  // ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
  const [canvasToken, setCanvasToken] = useState(()=>{try{return localStorage.getItem("sd-canvas-token")||"";}catch{return "";}});
  const [canvasBaseUrl, setCanvasBaseUrl] = useState(()=>{try{return localStorage.getItem("sd-canvas-url")||"https://naperville.instructure.com";}catch{return "https://naperville.instructure.com";}});
  const [canvasSync, setCanvasSync] = useState({lastSync:null,syncing:false,newSubmissions:0,error:"",everSucceeded:false});
  const [showCanvasSetup, setShowCanvasSetup] = useState(false);
  const [tokenDraft, setTokenDraft] = useState("");
  const [expandedGradeClass, setExpandedGradeClass] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const [showSidebarUserMenu, setShowSidebarUserMenu] = useState(false);
  const canvasSyncRef = useRef(false);
  const [fetchStatus, setFetchStatus] = useState("");

  const emptyAF = {title:"",subject:"",dueDate:"",priority:"medium",progress:0,notes:""};
  const emptyCF = {name:"",days:[],startTime:"09:00",endTime:"10:00",room:"",color:SUBJECT_COLORS[0]};
  const [af, setAf] = useState(emptyAF);
  const [cf, setCf] = useState(emptyCF);
  
  // Memoize subject lists to prevent flickering when typing in add assignment modal
  const schSubs = useMemo(()=>[...new Set(classes.map(c=>c.name))],[classes]);
  const prevSubs = useMemo(()=>[...new Set(assignments.map(a=>a.subject).filter(Boolean))].filter(s=>!schSubs.includes(s)),[assignments,schSubs]);
  const allSubs = useMemo(()=>[...schSubs,...prevSubs],[schSubs,prevSubs]);

  // ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
  // REFS
  // saveReady — blocks Firestore saves until initial data has loaded
  // logoClicks — tracks clicks on the logo for the easter egg
  // ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
  const saveReady=useRef(false);

  // Restore session on mount — always force fresh login on /admin route
  useEffect(()=>{
    const onAdminRoute = window.location.pathname === "/admin" || new URLSearchParams(window.location.search).get("admin")==="1";
    if(onAdminRoute){
      // Clear any existing session so admin must always sign in fresh
      fbClearSession();
      setAuthLoading(false);
      return;
    }
    const session=fbGetSession();
    if(session){
      // Check if token needs refreshing before using it
      fbEnsureValidToken(session).then(validUser => {
        setUser(validUser);
        return fbLoadData(validUser.uid, validUser.idToken);
      }).then(d=>{
        if(d){setAssignments(d.a||[]);setClasses(d.c||[]);if(d.g)setGame(d.g);if(d.cv?.url){setCanvasBaseUrl(d.cv.url)};if(d.t)setTemplates(d.t);if(d.chats)setChats(d.chats);if(d.n)setNotes(d.n);}
        saveReady.current=true;
        setLoaded(true);
        // Don't auto-show release notes anymore
        // const seenVersion=localStorage.getItem("studydesk-seen-version");
        // if(seenVersion!==APP_VERSION) setShowReleases(true);
      }).catch((error)=>{
        console.warn("Session restore failed:", error);
        // If token refresh fails, clear session and show auth screen
        fbClearSession();
        setUser(null);
        setLoaded(true);
        saveReady.current=true;
      });
    } else {
      setAuthLoading(false);
    }
    setAuthLoading(false);
  },[]);

  // Save to Firestore debounced
  useEffect(()=>{
    if(!saveReady.current||!user) return;
    const t=setTimeout(async ()=>{
      try {
        const validUser = await fbEnsureValidToken(user);
        if (validUser !== user) {
          setUser(validUser);
        }
        await fbSaveData(validUser.uid, validUser.idToken, {a:assignments,c:classes,g:game,cv:{url:canvasBaseUrl},t:templates,chats:chats});
      } catch (error) {
        console.warn("Save failed:", error);
        if (error.message.includes("Session expired")) {
          setUser(null);
        }
      }
    },800); // debounce 800ms
    return()=>clearTimeout(t);
  },[assignments,classes,game,canvasBaseUrl,templates,chats,loaded,user]);

  // ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
  // EFFECTS — localStorage persistence (dark mode, Canvas token/URL)
  // ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
  useEffect(()=>{try{localStorage.setItem("sd-dark",darkMode?"1":"0");}catch{}},[darkMode]);
  useEffect(()=>{try{if(canvasToken)localStorage.setItem("sd-canvas-token",canvasToken);else localStorage.removeItem("sd-canvas-token");}catch{}},[canvasToken]);
  useEffect(()=>{try{localStorage.setItem("sd-canvas-url",canvasBaseUrl);}catch{}},[canvasBaseUrl]);

  // Sidebar navigation items (used for rendering and keyboard shortcuts)
  const sidebarNav = useMemo(() => [
    ["dashboard","Dashboard",<svg key="d" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>],
    ["assignments","Assignments",<svg key="a" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>],
    ["grades","Grades",<svg key="g" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>],
    ["schedule","Schedule",<svg key="s" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>],
    ["calendar","Calendar",<svg key="c" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/></svg>],
    ["notes","Notes",<svg key="n" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>],
    ["timer","Timer",<svg key="t" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M9 1h6M12 1v3"/></svg>],
    ["buddy","Buddy",<svg key="b" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>],
    ["shop","Shop",<svg key="sh" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>],
    ["ai","AI",<svg key="ai" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 8v4l3 3"/><circle cx="18" cy="5" r="3" fill="currentColor" stroke="none"/></svg>],
    ["analytics","Analytics",<svg key="an" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>],
  ], []);

  // Keyboard shortcuts
  useEffect(()=>{
    function handleKeyPress(e){
      // Ignore if typing in input/textarea
      if(e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA") return;
      // Ignore if modal is open (but allow Escape to close)
      if(addingA||addingC||importOpen||showCanvasSetup||showAbout||showReleases||showLeaderboard||showKeyboardShortcuts||showNotifications) {
        if(e.key==="Escape"){
          e.preventDefault();
          if(showKeyboardShortcuts) setShowKeyboardShortcuts(false);
          else if(showNotifications) setShowNotifications(false);
          else if(addingA) setAddingA(false);
          else if(addingC) setAddingC(false);
          else if(importOpen) setImportOpen(false);
          else if(showCanvasSetup) setShowCanvasSetup(false);
          else if(showAbout) setShowAbout(false);
          else if(showReleases) setShowReleases(false);
          else if(showLeaderboard) setShowLeaderboard(false);
        }
        return;
      }
      
      if(e.key==="n"||e.key==="N"){
        e.preventDefault();
        setAddingA(true);
      }
      else if(e.key==="c"||e.key==="C"){
        e.preventDefault();
        setAddingC(true);
      }
      else if(e.key==="i"||e.key==="I"){
        e.preventDefault();
        setImportOpen(true);
      }
      else if(e.key==="s"||e.key==="S"){
        e.preventDefault();
        if(canvasToken) handleSyncCanvas(canvasToken, canvasBaseUrl);
      }
      else if(e.key==="m"||e.key==="M"){
        e.preventDefault();
        if(tab === "assignments") {
          setMultiSelectMode(m => !m);
          if(multiSelectMode) setSelectedAssignments([]);
        }
      }
      else if(e.key==="?"){
        e.preventDefault();
        setShowKeyboardShortcuts(true);
      }
      else if(e.key==="j"||e.key==="J"){
        e.preventDefault();
        const tabs = sidebarNav.map(([t]) => t);
        const idx=tabs.indexOf(tab);
        if(idx<tabs.length-1) setTab(tabs[idx+1]);
      }
      else if(e.key==="k"||e.key==="K"){
        e.preventDefault();
        const tabs = sidebarNav.map(([t]) => t);
        const idx=tabs.indexOf(tab);
        if(idx>0) setTab(tabs[idx-1]);
      }
      // Number keys for direct tab switching (based on sidebar order)
      else if(e.key>="1"&&e.key<="9"){
        const tabs = sidebarNav.map(([t]) => t);
        const idx = parseInt(e.key) - 1;
        if(idx < tabs.length){
          e.preventDefault();
          setTab(tabs[idx]);
        }
      }
    }
    window.addEventListener("keydown",handleKeyPress);
    return()=>window.removeEventListener("keydown",handleKeyPress);
  },[tab,addingA,addingC,importOpen,showCanvasSetup,showAbout,showReleases,showLeaderboard,showKeyboardShortcuts,showNotifications,canvasToken,canvasBaseUrl,sidebarNav]);

  // Presence heartbeat — updates every 60s while logged in
  useEffect(()=>{
    if(!user) return;
    const updatePresence = async () => {
      try {
        const validUser = await fbEnsureValidToken(user);
        if (validUser !== user) {
          setUser(validUser); // Update user state if token was refreshed
        }
        await fbUpdatePresence(validUser);
      } catch (error) {
        console.warn("Presence update failed:", error);
        if (error.message.includes("Session expired")) {
          setUser(null); // Force re-login
        }
      }
    };
    
    updatePresence();
    const t=setInterval(updatePresence, 60000);
    return()=>clearInterval(t);
  },[user]);

  // Check templates daily and create assignments
  useEffect(()=>{
    if(!loaded || templates.length === 0) return;
    
    // Check once per day
    const lastCheck = localStorage.getItem('sd-template-check');
    const today = new Date().toISOString().split('T')[0];
    
    if(lastCheck !== today){
      const created = checkAndCreateFromTemplates(templates, assignments, setAssignments);
      if(created.length > 0){
        console.log(`Created ${created.length} assignments from templates`);
        // Show buddy reaction
        setBuddyReaction(getBuddyReaction('login'));
      }
      localStorage.setItem('sd-template-check', today);
    }
  },[loaded, templates, assignments]);

  // Show buddy quote on login
  useEffect(()=>{
    if(!user || !loaded) return;
    
    const lastQuote = localStorage.getItem('sd-last-buddy-quote');
    const now = new Date().getTime();
    
    // Show quote if more than 4 hours since last one
    if(!lastQuote || (now - parseInt(lastQuote)) > 4 * 60 * 60 * 1000){
      setBuddyReaction(getBuddyReaction('login'));
      localStorage.setItem('sd-last-buddy-quote', now.toString());
    }
  },[user, loaded]);

  // URL routing for tabs when logged in - sync URL to tab state on mount only
  useEffect(() => {
    if (!user) return;
    
    const path = window.location.pathname;
    const tabRoutes = {
      '/dashboard': 'dashboard',
      '/assignments': 'assignments',
      '/grades': 'grades',
      '/schedule': 'schedule',
      '/calendar': 'calendar',
      '/notes': 'notes',
      '/timer': 'timer',
      '/buddy': 'buddy',
      '/shop': 'shop',
      '/ai': 'ai',
      '/analytics': 'analytics'
    };
    
    const matchedTab = tabRoutes[path] || tabRoutes[path + '/'];
    if (matchedTab && matchedTab !== tab) {
      setTab(matchedTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Only run on mount and when user changes

  // Update URL when tab changes - sync tab state to URL
  useEffect(() => {
    if (!user) return;
    
    const tabPaths = {
      'dashboard': '/dashboard',
      'assignments': '/assignments',
      'grades': '/grades',
      'schedule': '/schedule',
      'calendar': '/calendar',
      'notes': '/notes',
      'timer': '/timer',
      'buddy': '/buddy',
      'shop': '/shop',
      'ai': '/ai',
      'analytics': '/analytics'
    };
    
    const newPath = tabPaths[tab];
    if (newPath && window.location.pathname !== newPath) {
      window.history.pushState({}, '', newPath);
    }
  }, [tab, user]);

  // ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
  // CANVAS SYNC
  // Canvas sync handler
  // ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
  const handleSyncCanvas = (token, baseUrl, silent = false) => 
    syncCanvas(token, baseUrl, silent, isLocalhost, proxyBlocked, canvasSyncRef, setCanvasSync, setAssignments, setCanvasToken, setGame);

  // Auto-sync every 3 minutes if token is set
  useEffect(()=>{
    if(!canvasToken||!user) return;
    handleSyncCanvas(canvasToken, canvasBaseUrl, true);
    const t=setInterval(()=>handleSyncCanvas(canvasToken, canvasBaseUrl, true), 3*60*1000);
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

  // Animation handlers moved to service
  // ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
  // EFFECTS — Startup (PWA, timer, responsive breakpoint, leaderboard)
  // ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
  // PWA install prompt — capture beforeinstallprompt for "Add to Home Screen"
  useEffect(()=>{
    const handler = e => { e.preventDefault(); setPwaPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  },[]);

  // Timer — timestamp-based so backgrounding/throttling can't drift it
  const timerStartRef   = useRef(null); // Date.now() when timer last started
  const timerSecsAtStart= useRef(0);    // timerSeconds value when timer last started
  const [timerDone, setTimerDone] = useState(false); // in-app completion banner

  // Timer completion handler
  const handleTimerComplete = () => onTimerComplete(setTimerRunning, setTimerSessions, setGame, setTimerDone, playDoneSound);

  useEffect(()=>{
    if(timerRunning){
      timerStartRef.current    = Date.now();
      timerSecsAtStart.current = timerSeconds;

      const id = setInterval(()=>{
        const elapsed = Math.floor((Date.now()-timerStartRef.current)/1000);
        const remaining = timerSecsAtStart.current - elapsed;
        if(remaining<=0){
          clearInterval(id);
          setTimerSeconds(0);
          handleTimerComplete();
        } else {
          setTimerSeconds(remaining);
        }
      },500); // poll every 500ms for accuracy
      setTimerInterval(id);
      return()=>clearInterval(id);
    }
  },[timerRunning]);

  // When app comes back from background, recalculate elapsed time immediately
  useEffect(()=>{
    function onVisible(){
      if(!timerRunning||!timerStartRef.current) return;
      const elapsed = Math.floor((Date.now()-timerStartRef.current)/1000);
      const remaining = timerSecsAtStart.current - elapsed;
      if(remaining<=0){
        clearInterval(timerInterval);
        setTimerSeconds(0);
        handleTimerComplete();
      } else {
        setTimerSeconds(remaining);
      }
    }
    document.addEventListener("visibilitychange",onVisible);
    return()=>document.removeEventListener("visibilitychange",onVisible);
  },[timerRunning,timerInterval]);

  // Timer control functions
  const handleStartTimer = (secs) => startTimer(secs, setTimerSeconds, setTimerRunning);
  const handleResetTimer = (secs) => resetTimer(secs, timerInterval, setTimerRunning, setTimerSeconds, setTimerDone);
  const handleFmtTimer = (s) => fmtTimer(s);

  // Leaderboard handler
  const handleFetchLeaderboard = () => fetchLeaderboard(user, setLeaderboard);

  // Save points/streak to presence for leaderboard
  useEffect(()=>{
    if(!user||!saveReady.current) return;
    const t = setTimeout(async ()=>{
      try {
        const validUser = await fbEnsureValidToken(user);
        if (validUser !== user) {
          setUser(validUser); // Update user state if token was refreshed
        }
        await fbUpdatePresence(validUser, {points:game.points, streak:game.streak});
      } catch (error) {
        console.warn("Points/streak save failed:", error);
      }
    }, 2000);
    return()=>clearTimeout(t);
  },[game.points, game.streak, user]);

  // ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
  // GAME LOGIC
  // Game logic handlers moved to service
  // ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
  // IMPORT LOGIC
  // resetImport()          — clears all import wizard state
  // parseHomeworkFromText() — AI-powered text → assignment parser
  // importFromDoc()         — fetches Google Doc/Slides content
  // importFromCanvasPaste() — parses pasted Canvas assignment list
  // ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
  function resetImport(){setImportUrl("");setPasteText("");setCanvasPaste("");setImportResult(null);setImportStep("url");setCanvasStatus("");setAgendaUrl("");setFetchStatus("");setAgendaStep("url");setAgendaDocText("");setAgendaSlideLinks([]);setAgendaSlideTexts([]);}

  function dismissReleases(){
    setShowReleases(false);
  }

  // Import handlers
  const handleConfirmImport = () => {
    confirmImport(importResult, user, setAssignments, classes, setSchedPrompt, setImportOpen, resetImport);
    setTab("assignments"); // Switch to assignments tab after import
  };
  const handleImportFromCanvasPaste = () => {
    try {
      importFromCanvasPaste(canvasPaste, setImporting, setImportResult);
    } catch(error) {
      console.error("Canvas paste import error:", error);
      setImportResult({ error: error.message || "Failed to import from Canvas" });
      setImporting(false);
    }
  };
  const handleImportFromCanvasAPI = () => {
    try {
      importFromCanvasAPI(canvasToken, canvasBaseUrl, isLocalhost, proxyBlocked, setImporting, setImportResult);
    } catch(error) {
      console.error("Canvas API import error:", error);
      setImportResult({ error: error.message || "Failed to import from Canvas API" });
      setImporting(false);
    }
  };
  const handleImportFromSlides = () => importFromSlides(pasteText, setImporting, setImportResult);

  const todayStr = new Date().toISOString().split("T")[0];
  const CANVAS_URL = `https://naperville.instructure.com/api/v1/planner/items?per_page=100&start_date=${todayStr}`;

  const [canvasPaste, setCanvasPaste] = useState("");

  // Game logic handlers
  const handleAddFloat = (pts, streak) => addFloat(pts, streak, setFloats);
  const handleLaunchConfetti = (originEl) => launchConfetti(originEl, setConfetti);
  const handleCompleteAssignment = (prev, next, hasBeenCompleted) => {
    try {
      handleComplete(prev, next, user, setGame, handleAddFloat, hasBeenCompleted);
    } catch(error) {
      console.error("Error completing assignment:", error);
    }
  };
  const handleBuyItem = (id) => buyItem(id, game, setGame);
  const handleEquipItem = (id) => equipItem(id, game, setGame);

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
        assignments.push({title,subject,dueDate:resolvedDate,priority,progress:0,notes});
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
        assignments.push({title,subject,dueDate:resolvedDate,priority,progress:0,notes});
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
      assignments.push({title,subject,dueDate,priority,progress:0,notes});
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


  async function addAssignment(){
    if(!af.title||!af.subject) {
      console.warn("Cannot add assignment: missing title or subject", af);
      return;
    }
    
    // Validate assignment with Gemini API
    const geminiKey = getGeminiKey();
    if(geminiKey) {
      setValidatingAssignment(true);
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Is this a real school assignment or homework task? Answer with only "YES" or "NO".\n\nAssignment title: "${af.title}"\nSubject: "${af.subject}"\n\nConsider it real if it's a legitimate homework, project, quiz, test, or school task. Consider it fake if it's gibberish, random characters, or clearly not a real assignment.`
              }]
            }]
          })
        });
        
        const data = await response.json();
        const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toUpperCase();
        
        setValidatingAssignment(false);
        
        if(answer === "NO") {
          setGame(g => ({ ...g, points: Math.max(0, g.points - 15) }));
          toast("This doesn't appear to be a real assignment. 15 points deducted.", "warning", 5000);
          setAddingA(false);
          setAf(emptyAF);
          setSubjMode("select");
          return;
        }
      } catch(error) {
        console.warn("Gemini validation failed, allowing assignment:", error);
        setValidatingAssignment(false);
        // Continue adding assignment if validation fails
      }
    }
    
    try {
      const na={...af,id:Date.now().toString(),createdAt:new Date().toISOString()};
      console.log("Adding assignment:", na);
      setAssignments(p=>[...p,na]);
      checkUnknown([na], classes, setSchedPrompt);
      setAf(emptyAF);
      setAddingA(false);
      setSubjMode("select");
      setTab("assignments");
      if(user) fbIncrementStat("totalAssignments",1,user.idToken);
      toast("Assignment added!", "success", 2500);
    } catch(error) {
      console.error("Error adding assignment:", error);
      toast("Failed to add assignment: " + error.message, "error", 5000);
    }
  }
  function delAssignment(id){setAssignments(p=>p.filter(x=>x.id!==id));}
  function updateA(id,patch){
    setAssignments(prev=>{
      const a=prev.find(x=>x.id===id);
      if(a&&patch.progress!==undefined){
        // Check if assignment has ever been completed (has completedAt timestamp)
        const hasBeenCompleted = !!a.completedAt;
        handleCompleteAssignment(a.progress,patch.progress,hasBeenCompleted);
        // Add completedAt timestamp when marking as complete for the first time
        if(patch.progress===100&&a.progress<100&&!hasBeenCompleted){
          patch={...patch,completedAt:new Date().toISOString()};
        }
      }
      return prev.map(x=>x.id===id?{...x,...patch}:x);
    });
  }

  // Multi-select handlers
  function toggleAssignmentSelection(id) {
    setSelectedAssignments(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function handleBulkComplete() {
    selectedAssignments.forEach(id => updateA(id, { progress: 100 }));
    setSelectedAssignments([]);
    setMultiSelectMode(false);
    toast(`Completed ${selectedAssignments.length} assignment${selectedAssignments.length > 1 ? 's' : ''}`, "success");
  }

  function handleBulkDelete() {
    if (!window.confirm(`Delete ${selectedAssignments.length} assignment${selectedAssignments.length > 1 ? 's' : ''}?`)) return;
    setAssignments(prev => prev.filter(a => !selectedAssignments.includes(a.id)));
    setSelectedAssignments([]);
    setMultiSelectMode(false);
    toast(`Deleted ${selectedAssignments.length} assignment${selectedAssignments.length > 1 ? 's' : ''}`, "success");
  }

  function handleBulkReschedule() {
    const newDate = prompt('Enter new due date (YYYY-MM-DD):');
    if (!newDate) return;
    selectedAssignments.forEach(id => updateA(id, { dueDate: newDate }));
    setSelectedAssignments([]);
    setMultiSelectMode(false);
    toast(`Rescheduled ${selectedAssignments.length} assignment${selectedAssignments.length > 1 ? 's' : ''}`, "success");
  }

  function cancelMultiSelect() {
    setSelectedAssignments([]);
    setMultiSelectMode(false);
  }

  // Note handlers
  async function handleAddNote(noteData) {
    try {
      if (!user) return;
      await fbSaveNote(user.uid, user.idToken, noteData);
      setNotes(prev => [...prev, { ...noteData, id: Date.now() + Math.random() }]);
      toast("Note created successfully", "success");
    } catch (error) {
      toast("Failed to create note: " + error.message, "error");
    }
  }

  async function handleUpdateNote(noteId, noteData) {
    try {
      if (!user) return;
      await fbSaveNote(user.uid, user.idToken, { ...noteData, id: noteId });
      setNotes(prev => prev.map(note => note.id === noteId ? { ...note, ...noteData } : note));
      toast("Note updated successfully", "success");
    } catch (error) {
      toast("Failed to update note: " + error.message, "error");
    }
  }

  async function handleDeleteNote(noteId) {
    try {
      if (!user) return;
      await fbDeleteNote(user.uid, user.idToken, noteId);
      setNotes(prev => prev.filter(note => note.id !== noteId));
      toast("Note deleted successfully", "success");
    } catch (error) {
      toast("Failed to delete note: " + error.message, "error");
    }
  }
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
    const proxyUrl=`https://api.allorigins.win/raw?url=${encodeURIComponent(odsUrl)}`;

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

  const subjects=[...new Set([...[...new Set(classes.map(c=>c.name))],...assignments.map(a=>a.subject)])].filter(Boolean).filter(s=>assignments.some(a=>a.subject===s&&a.progress<100));
  const _todayRaw=classes.filter(c=>c.days.includes(todayAbbr()));
  const todayC=[...new Map(_todayRaw.map(c=>[c.name,c])).values()];
  const upcoming=[...assignments].filter(a=>a.progress<100).sort((a,b)=>new Date(a.dueDate)-new Date(b.dueDate));
  // ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
  // DERIVED VALUES (computed from state on every render — not stored)
  // overdue  = assignments past due date, not complete
  // dueToday = assignments due today, not complete
  // completed = assignments with progress === 100
  // ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
  const overdue=assignments.filter(a=>daysUntil(a.dueDate)<0&&a.progress<100);
  const dueToday=assignments.filter(a=>daysUntil(a.dueDate)===0&&a.progress<100);
  const completed=assignments.filter(a=>a.progress>=100);
  const filteredA=filter==="all"?assignments:assignments.filter(a=>a.subject===filter);
  // If the active filter subject no longer has any assignments, reset to "all"
  if(filter!=="all"&&!subjects.includes(filter)) setFilter("all");
  // Sort assignments based on sortBy and sortOrder
  const sortedA = useMemo(() => {
    const sorted = [...filteredA].sort((a, b) => {
      // If both have customOrder, use that (manual drag & drop order)
      if (a.customOrder !== undefined && b.customOrder !== undefined) {
        return a.customOrder - b.customOrder;
      }
      
      if (sortBy === "date") {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        const dateCompare = new Date(a.dueDate) - new Date(b.dueDate);
        return sortOrder === "asc" ? dateCompare : -dateCompare;
      } else if (sortBy === "priority") {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority] || 2;
        const bPriority = priorityOrder[b.priority] || 2;
        return sortOrder === "asc" ? bPriority - aPriority : aPriority - bPriority; // asc = high→low
      }
      return 0;
    });
    return sorted;
  }, [filteredA, sortBy, sortOrder]);

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
      <div className={"acard"+(ov?" ov":"")} style={{opacity:done?.6:1,cursor:"pointer"}} onClick={(e)=>{
        // Don't open detail if clicking on buttons
        if(e.target.closest('button')) return;
        setSelectedAssignment(a);
      }}>
        <div className="stripe" style={{background:color,opacity:done?.5:1}}/>
        <div className="amain">
          <div className="atitle" style={{textDecoration:done?"line-through":"none",opacity:done?.7:1}}>{a.title}</div>
          <div className="ameta">
            <span className="mtag" style={{color}}>● {a.subject}</span>
            <span className="ppill" style={{background:pc.bg,color:pc.c}}>{PRIORITY[a.priority]?.label||"Medium"}</span>
            {dueText&&<span className="dbadge" style={{color:dueColor}}>{dueText}</span>}
            {a.grade!=null&&<span style={{fontSize:".7rem",fontWeight:800,color:gradeColor,background:darkMode?"rgba(0,0,0,.3)":"rgba(0,0,0,.06)",padding:"2px 7px",borderRadius:6}}>{a.grade}%{a.gradeRaw&&<span style={{fontWeight:400,opacity:.7}}> ({a.gradeRaw})</span>}</span>}
          </div>
          {!compact&&<div className="qbtns">{[0,25,50,75,100].map(v=><button key={v} className={"qbtn"+(a.progress===v?" on":"")} onClick={(e)=>{e.stopPropagation();updateA(a.id,{progress:v});}}>{v}%</button>)}</div>}
        </div>
        {!compact&&<div className="pbar-wrap"><div className="pbar-track"><div className="pbar-fill" style={{width:a.progress+"%",background:done?"#16a34a":color}}/></div><div className="plabel">{a.progress}%</div></div>}
        {!done&&<button ref={submitRef} className={"submit-btn"+(compact?" compact":"")} onClick={(e)=>{e.stopPropagation();handleLaunchConfetti(submitRef.current);updateA(a.id,{progress:100});}}>✓ Submit</button>}
        {done&&<span className={"submit-btn done"+(compact?" compact":"")}>✓ Done</span>}
        <button className="ibtn" onClick={(e)=>{e.stopPropagation();delAssignment(a.id);}}>✕</button>
      </div>
    );
  }

  // Subject picker is inlined directly in the Add Assignment modal (see § ADD ASSIGNMENT modal)
  // Keeping it as a component caused focus loss — every keystroke re-rendered the parent,
  // React saw a new function reference, and unmounted/remounted the input.

  const dateStr=new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
  const todayStr2=new Date().toISOString().split("T")[0];
  const todayCnt=game.dailyDate===todayStr2?game.dailyCount:0;

  // ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
  // RENDER
  // ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
  
  // /upload/:id route — phone upload page
  if(isUploadRoute){
    return <PhoneUploadPage uploadId={uploadId}/>;
  }
  
  // /admin route — checked BEFORE authLoading so it never shows blank/spinner
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
          <div style={{fontFamily:"'Fraunces',serif",fontSize:"1.15rem",fontWeight:700,color:"#DDE2F5"}}>StudyDesk Admin</div>
          <div style={{marginLeft:"auto",fontSize:".74rem",color:"#5C6480"}}>{user.email}</div>
          <button onClick={()=>{fbClearSession();setUser(null);window.location.href="/";}}
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
        <div style={{width:48,height:48,marginBottom:12,animation:"spin 1s linear infinite",display:"inline-block",borderRadius:12,overflow:"hidden"}}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <defs>
    <linearGradient id="sd-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#1B1F3B"/>
      <stop offset="100%" stopColor="#2d3561"/>
    </linearGradient>
    <linearGradient id="sd-acc" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#f5a623"/>
      <stop offset="100%" stopColor="#f7c059"/>
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="48" fill="url(#sd-bg)"/>
  <rect x="24" y="30" width="24" height="38" rx="3" fill="#fff" opacity="0.15"/>
  <rect x="26" y="30" width="22" height="38" rx="2" fill="#fff" opacity="0.9"/>
  <rect x="24" y="30" width="4" height="38" rx="2" fill="#ddd"/>
  <line x1="32" y1="40" x2="44" y2="40" stroke="#1B1F3B" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
  <line x1="32" y1="45" x2="44" y2="45" stroke="#1B1F3B" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
  <line x1="32" y1="50" x2="40" y2="50" stroke="#1B1F3B" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
  <circle cx="63" cy="57" r="16" fill="url(#sd-acc)"/>
  <polyline points="55,57 61,63 72,50" fill="none" stroke="#1B1F3B" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
</svg></div>
        <div style={{fontSize:".9rem",color:"#888",fontWeight:600}}>Loading...</div>
      </div>
    </div>
  );

  // Check for auth routes
  const isSignInRoute = pathname === "/sign-in" || pathname === "/sign-in/";
  const isSignUpRoute = pathname === "/sign-up" || pathname === "/sign-up/";
  
  if(!user) {
    // Show auth screen if on auth route or if showAuthScreen is true
    if(showAuthScreen || isSignInRoute || isSignUpRoute) {
      // Set auth mode based on route
      const mode = isSignInRoute ? 'signin' : 'signup';
      
      return (
        <AuthScreen 
          mode={mode}
          onAuth={u => {
            setUser(u);
            fbLoadData(u.uid, u.idToken).then(d => {
              if(d) {
                setAssignments(d.a || []);
                setClasses(d.c || []);
                if(d.g) setGame(d.g);
              }
              saveReady.current = true;
              setLoaded(true);
              // Don't auto-show release notes anymore
              // const sv = localStorage.getItem("studydesk-seen-version");
              // if(sv !== APP_VERSION) setShowReleases(true);
              
              // Redirect to /dashboard after successful login
              window.history.pushState({}, '', '/dashboard');
              setTab('dashboard');
            });
            setShowAuthScreen(false);
          }}
        />
      );
    }
    
    return (
      <Router 
        onSignIn={() => {
          setAuthMode('signin');
          setShowAuthScreen(true);
        }}
        onSignUp={() => {
          setAuthMode('signup');
          setShowAuthScreen(true);
        }}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />
    );
  }

  // ── MOBILE UI ────────────────────────────────────────────────────────────────
  // Use new mobile-first UI on mobile devices
  if(isMobile && user && loaded) {
    return (
      <>
        <style>{css}</style>
        <MobileApp
          user={user}
          assignments={assignments}
          setAssignments={setAssignments}
          classes={classes}
          game={game}
          setGame={setGame}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onAddAssignment={() => setAddingA(true)}
          onAddClass={() => setAddingC(true)}
          onSignOut={() => {
            fbClearSession();
            setUser(null);
            window.location.href = '/';
          }}
          timerMode={timerMode}
          setTimerMode={setTimerMode}
          timerSeconds={timerSeconds}
          timerRunning={timerRunning}
          timerSessions={timerSessions}
          startTimer={startTimer}
          resetTimer={resetTimer}
          fmtTimer={fmtTimer}
          customFocus={customFocus}
          setCustomFocus={setCustomFocus}
          customShort={customShort}
          setCustomShort={setCustomShort}
          customLong={customLong}
          setCustomLong={setCustomLong}
          buyItem={buyItem}
          equipItem={equipItem}
          notes={notes}
          onAddNote={handleAddNote}
          onUpdateNote={handleUpdateNote}
          onDeleteNote={handleDeleteNote}
        />
      </>
    );
  }

  return(
    <>
      <style>{css}</style>
      <div className={"dk"+(darkMode?" dark":"")}>
      <div className={"app"+(!isMobile?" has-sidebar":"")}>

        {/* ── DESKTOP SIDEBAR ────────────────────────────────────── */}
        {!isMobile&&(
          <aside className="sidebar">
            <div className="sidebar-logo" onClick={handleLogoClick} style={{cursor:"default",userSelect:"none"}}>
              <img src={process.env.PUBLIC_URL+"/logo.svg"} alt="Study Desk" className="sidebar-logo-img"/>
              <span className="sidebar-logo-text">Study Desk</span>
            </div>
            <nav className="sidebar-nav">
              {sidebarNav.map(([t,lbl,icon])=>(
                <button key={t} type="button" className={"sidebar-item"+(tab===t?" on":"")} onClick={()=>{setTab(t);setShowMoreDropdown(false);}}>
                  {icon}
                  <span>{lbl}</span>
                </button>
              ))}
              <div className="sidebar-item-wrap">
                <button type="button" className={"sidebar-item"+(showMoreDropdown?" on":"")} onClick={()=>setShowMoreDropdown(m=>!m)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                  <span>More</span>
                </button>
                {showMoreDropdown&&(
                  <>
                    <div style={{position:"fixed",inset:0,zIndex:40}} onClick={()=>setShowMoreDropdown(false)} aria-hidden="true"/>
                    <div className="sidebar-more-dropdown">
                      <button type="button" onClick={()=>{setShowReleases(true);setShowMoreDropdown(false);}}>
                        <span></span> Release Notes
                      </button>
                      <a href="https://docs.google.com/forms/d/e/1FAIpQLSeadDtMTet9ZndDOsF9hNtViwRK7tU-nzK38CjVWZZmeRtqGA/viewform?usp=publish-editor" target="_blank" rel="noreferrer" onClick={()=>setShowMoreDropdown(false)}>
                        <span></span> Suggestions
                      </a>
                      <button type="button" onClick={()=>{setShowAbout(true);setShowMoreDropdown(false);}}>
                        <span></span> Info
                      </button>
                    </div>
                  </>
                )}
              </div>
            </nav>
            <div className="sidebar-bottom">
              {user&&(
                <>
                  <button type="button" className="sidebar-profile" onClick={()=>{setShowSidebarUserMenu(m=>!m);setShowMoreDropdown(false);}} title={user.email}>
                    <div className="sidebar-profile-avatar">
                      {user.photoURL?<img src={user.photoURL} alt=""/>:(user.displayName||user.email||"?")[0].toUpperCase()}
                    </div>
                    <div className="sidebar-profile-info">
                      <div className="sidebar-profile-name">{user.displayName||user.email.split("@")[0]}</div>
                      <div className="sidebar-profile-email">{user.email}</div>
                    </div>
                  </button>
                  {showSidebarUserMenu&&(
                    <>
                      <div style={{position:"fixed",inset:0,zIndex:40}} onClick={()=>setShowSidebarUserMenu(false)} aria-hidden="true"/>
                      <div className="sidebar-user-menu" style={{position:"relative",zIndex:41}}>
                        <div className="sidebar-profile-email" style={{padding:"10px 14px",borderBottom:"1px solid rgba(255,255,255,.08)"}}>{user.email}</div>
                        <button type="button" className="sidebar-signout" onClick={()=>{setShowSidebarUserMenu(false);fbClearSession();setUser(null);setAssignments([]);setClasses([]);setGame({points:0,streak:0,lastStreakDate:"",dailyDate:"",dailyCount:0,owned:[],equipped:{hat:"",face:"",body:"",special:""}});saveReady.current=false;window.location.href="/";}}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                          Sign out
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
              <button type="button" className="sidebar-dm" onClick={()=>setDarkMode(d=>!d)}>
                {darkMode?<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
                <span>{darkMode?"Dark":"Light"} mode</span>
                <span className={"sidebar-dm-toggle"+(darkMode?" on":"")}><span className="sidebar-dm-knob"/></span>
              </button>
              {user&&(
                <button type="button" className="sidebar-logout" onClick={()=>{fbClearSession();setUser(null);setAssignments([]);setClasses([]);setGame({points:0,streak:0,lastStreakDate:"",dailyDate:"",dailyCount:0,owned:[],equipped:{hat:"",face:"",body:"",special:""}});saveReady.current=false;window.location.href="/";}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  <span>Logout</span>
                </button>
              )}
            </div>
          </aside>
        )}

        <div className="main-wrap">
        {/* ── MOBILE HEADER + STATUS ────────────────────────────── */}
        {isMobile&&(<>
          <div className="mob-hdr">
            <div>
              <div className="mob-hdr-title" onClick={handleLogoClick}>Study Desk</div>
              <div className="mob-hdr-date">{dateStr}</div>
            </div>
            <div className="mob-hdr-r">
              <button className="mob-icon-btn" onClick={()=>{setShowSearch(s=>!s);setSearchQuery("");}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              </button>
              <button className="mob-icon-btn" onClick={()=>setDarkMode(d=>!d)}>
                {darkMode
                  ?<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                  :<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                }
              </button>
              <button className="mob-icon-btn" onClick={()=>{setTokenDraft(canvasToken);setShowCanvasSetup(true);}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
              </button>
              {user&&(
                <div className="mob-avatar" onClick={()=>setShowUserMenu(m=>!m)}>
                  {user.photoURL?<img src={user.photoURL} width="32" height="32" style={{objectFit:"cover"}}/>:(user.displayName||user.email||"?")[0].toUpperCase()}
                </div>
              )}
            </div>
          </div>
          
          {/* Mobile User Menu */}
          {showUserMenu&&(
            <>
              <div style={{position:"fixed",inset:0,zIndex:49}} onClick={()=>setShowUserMenu(false)} aria-hidden="true"/>
              <div className="mob-user-menu">
                <div className="mob-user-menu-email">{user.email}</div>
                <button type="button" className="mob-user-menu-signout" onClick={()=>{setShowUserMenu(false);fbClearSession();setUser(null);setAssignments([]);setClasses([]);setGame({points:0,streak:0,lastStreakDate:"",dailyDate:"",dailyCount:0,owned:[],equipped:{hat:"",face:"",body:"",special:""}});saveReady.current=false;window.location.href="/";}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Sign out
                </button>
              </div>
            </>
          )}
          
          <div className="mob-status">
            {game.streak>0&&<div className="mob-pill fire">{game.streak}d streak</div>}
            <div className="mob-pill star">{game.points} pts</div>
            {canvasToken?(
              <div className={"mob-pill "+(canvasSync.error?"err":canvasSync.syncing?"canvas":canvasSync.lastSync?"ok":"canvas")}
                onClick={()=>{if(canvasSync.error)setCanvasSync(s=>({...s,error:""}));else handleSyncCanvas(canvasToken,canvasBaseUrl);}}>
                <span style={{display:"inline-block"}}>
                  {canvasSync.syncing ? "..." : canvasSync.error ? "⚠️" : canvasSync.lastSync ? "✓" : "Canvas"}
                </span>
                {canvasSync.syncing ? "Syncing" : canvasSync.error ? "Sync error" : canvasSync.lastSync ? `Synced ${new Date(canvasSync.lastSync).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}` : "Canvas"}
              </div>
            ):(
              <div className="mob-pill canvas" onClick={()=>{setTokenDraft("");setShowCanvasSetup(true);}}>🎓 Connect Canvas</div>
            )}
            <div className="mob-pill" onClick={()=>{setImportMode("canvas");setImportOpen(true);}}>＋ Import</div>
          </div>
        </>)}

        {/* ── DESKTOP HEADER (Releases, Suggestions, Info, profile live in sidebar) ── */}
        {!isMobile&&<div className="hdr">
          <div style={{minWidth:0,flex:"1 1 auto"}}>
            <div className="hdr-title" onClick={handleLogoClick} style={{cursor:"default",userSelect:"none"}}>Study Desk</div>
            <div className="hdr-sub">{dateStr}</div>
            <div className="hdr-hint">Press <kbd>?</kbd> for shortcuts • <kbd>N</kbd> to add • <kbd>J</kbd>/<kbd>K</kbd> to navigate</div>
          </div>
          <div className="hdr-r">
            {game.streak>0&&<div className="streak-pill">🔥 {game.streak}d</div>}
            <div className="pts-pill">⭐ {game.points}</div>
            {canvasToken&&(
              <div onClick={()=>{if(canvasSync.error)setCanvasSync(s=>({...s,error:""}));else handleSyncCanvas(canvasToken,canvasBaseUrl);}} title={canvasSync.error?"Click to dismiss":"Click to sync Canvas now"}
                style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:20,border:"1.5px solid",
                  borderColor:canvasSync.error?"#fca5a5":canvasSync.newSubmissions>0?"#86efac":"var(--border2)",
                  background:canvasSync.error?"#fef2f2":canvasSync.newSubmissions>0?"#f0fdf4":"var(--bg3)",
                  cursor:"pointer",fontSize:".72rem",fontWeight:700,
                  color:canvasSync.error?"#dc2626":canvasSync.newSubmissions>0?"#16a34a":"var(--text3)"}}>
                <span style={{display:"inline-block"}}>
                  {canvasSync.syncing ? "..." : canvasSync.error ? "⚠️" : canvasSync.newSubmissions > 0 ? "✅" : "Canvas"}
                </span>
                {canvasSync.syncing ? "Syncing" : canvasSync.error ? "Sync error" : canvasSync.newSubmissions > 0 ? `${canvasSync.newSubmissions} in!` : canvasSync.lastSync ? "Synced" : "Canvas"}
              </div>
            )}
            {!canvasToken&&<button className="btn btn-g btn-sm" onClick={()=>{setTokenDraft(canvasToken);setShowCanvasSetup(true);}} style={{borderColor:"#c7d2fe",color:"#4338ca"}}>🎓 Canvas</button>}
            <button className="btn btn-p btn-sm" onClick={()=>{setImportMode("canvas");setImportOpen(true);}}>＋ Import</button>
            <button className="hdr-icon-btn" onClick={()=>setShowNotifications(true)} title="Notifications">
              🔔
              {assignments.filter(a => a.progress < 100 && a.dueDate && new Date(a.dueDate + 'T00:00:00') <= new Date()).length > 0 && (
                <span style={{position:'absolute',top:'-2px',right:'-2px',width:'8px',height:'8px',background:'#ef4444',borderRadius:'50%',border:'2px solid var(--card)'}}/>
              )}
            </button>
            <button className="hdr-icon-btn" onClick={()=>setDarkMode(d=>!d)} title={darkMode?"Light mode":"Dark mode"}>
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button className="hdr-icon-btn" onClick={()=>{setShowSearch(s=>!s);setSearchQuery("");}} title="Search assignments">🔍</button>
          </div>
        </div>}


        <div className="main-inner">
        {/* TABS (desktop: hidden when sidebar shown) */}
        <div className="tabs">
          {[["dashboard","Dashboard"],["assignments","Assignments"],["grades","Grades"],["schedule","Schedule"],["calendar","Calendar"],["notes","Notes"],["timer","Timer"],["buddy","Buddy"],["shop","Shop"],["ai","AI Assistant"],["analytics","Analytics"]].map(([t,l])=>(
            <button key={t} className={"tab"+(tab===t?" on":"")} onClick={()=>setTab(t)}>{l}</button>
          ))}
        </div>

        <div className="mob-content">

        {/* SEARCH BAR */}
        {showSearch&&(
          <div className="search-bar">
            <span style={{fontSize:"1rem",opacity:.5}}>🔍</span>
            <input className="search-inp" autoFocus placeholder="Search assignments..." value={searchQuery}
              onChange={e=>setSearchQuery(e.target.value)}/>
            <button onClick={()=>{setShowSearch(false);setSearchQuery("");}} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text4)",fontSize:"1rem"}}>✕</button>
          </div>
        )}

        {/* SEARCH RESULTS */}
        {showSearch&&searchQuery.trim()&&(()=>{
          const q=searchQuery.toLowerCase();
          const results=assignments.filter(a=>a.title.toLowerCase().includes(q)||a.subject.toLowerCase().includes(q)||a.notes?.toLowerCase().includes(q));
          return(
            <div style={{marginBottom:20}}>
              <div className="sec-lbl">{results.length} result{results.length!==1?"s":""} for "{searchQuery}"</div>
              {results.length===0?<div style={{color:"var(--text4)",fontSize:".85rem",padding:"12px 0"}}>No assignments found.</div>:
                <div className="alist">{results.map(a=><ACard key={a.id} a={a}/>)}</div>}
            </div>
          );
        })()}

        {/* ═══ TAB CONTENT ═══════════════════════════════════════════ */}
        {tab==="dashboard"&&(
          <DashboardTab
            assignments={assignments}
            classes={classes}
            onAddAssignment={()=>{setSubjMode("select");setAddingA(true);}}
            overdue={overdue}
            dueToday={dueToday}
            completed={completed}
            upcoming={upcoming}
            todayC={todayC}
            todayCnt={todayCnt}
            game={game}
            ACard={ACard}
          />
        )}

        {tab==="assignments"&&(
          <AssignmentsTab
            sortedA={sortedA}
            subjects={subjects}
            filter={filter}
            setFilter={setFilter}
            classes={classes}
            setSubjMode={setSubjMode}
            setAddingA={setAddingA}
            ACard={ACard}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            multiSelectMode={multiSelectMode}
            setMultiSelectMode={setMultiSelectMode}
            selectedAssignments={selectedAssignments}
            toggleAssignmentSelection={toggleAssignmentSelection}
            assignments={assignments}
            setAssignments={setAssignments}
          />
        )}

        {tab==="grades"&&(
          <GradesTab
            assignments={assignments}
            classes={classes}
            expandedGradeClass={expandedGradeClass}
            setExpandedGradeClass={setExpandedGradeClass}
          />
        )}

        {tab==="schedule"&&(
          <ScheduleTab
            classes={classes}
            setSchoolWiz={setSchoolWiz}
            setAddingC={setAddingC}
            delClass={delClass}
          />
        )}

        {tab==="calendar"&&(
          <CalendarTab
            assignments={assignments}
            classes={classes}
            darkMode={darkMode}
            onAssignmentClick={(assignment) => {
              // Could open assignment details modal
              console.log('Clicked assignment:', assignment);
            }}
          />
        )}

        {tab==="ai"&&<AITab assignments={assignments} classes={classes} chats={chats} setChats={setChats} notes={notes}/>}

        {tab==="notes"&&(
          <NotesTab
            notes={notes}
            assignments={assignments}
            onAddNote={handleAddNote}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
            darkMode={darkMode}
          />
        )}

        {tab==="analytics"&&<AnalyticsTab assignments={assignments} classes={classes} game={game} timerSessions={timerSessions}/>}

        {tab==="buddy"&&(
          <BuddyTab
            game={game}
            todayCnt={todayCnt}
          />
        )}

        {tab==="timer"&&(
          <TimerTab
            timerMode={timerMode}
            setTimerMode={setTimerMode}
            timerSeconds={timerSeconds}
            timerRunning={timerRunning}
            timerSessions={timerSessions}
            timerDone={timerDone}
            setTimerDone={setTimerDone}
            startTimer={handleStartTimer}
            resetTimer={handleResetTimer}
            fmtTimer={handleFmtTimer}
            customFocus={customFocus}
            setCustomFocus={setCustomFocus}
            customShort={customShort}
            setCustomShort={setCustomShort}
            customLong={customLong}
            setCustomLong={setCustomLong}
            customRounds={customRounds}
            setCustomRounds={setCustomRounds}
            autoStartBreaks={autoStartBreaks}
            setAutoStartBreaks={setAutoStartBreaks}
            sessionCount={sessionCount}
            showCustomTimer={showCustomTimer}
            setShowCustomTimer={setShowCustomTimer}
          />
        )}

        {tab==="shop"&&(
          <ShopTab
            game={game}
            shopCat={shopCat}
            setShopCat={setShopCat}
            equipItem={handleEquipItem}
            buyItem={handleBuyItem}
          />
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
              <span style={{display:"inline-block",width:28,height:28,borderRadius:8,overflow:"hidden",verticalAlign:"middle",flexShrink:0}}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <defs>
    <linearGradient id="sd-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#1B1F3B"/>
      <stop offset="100%" stopColor="#2d3561"/>
    </linearGradient>
    <linearGradient id="sd-acc" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#f5a623"/>
      <stop offset="100%" stopColor="#f7c059"/>
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="48" fill="url(#sd-bg)"/>
  <rect x="24" y="30" width="24" height="38" rx="3" fill="#fff" opacity="0.15"/>
  <rect x="26" y="30" width="22" height="38" rx="2" fill="#fff" opacity="0.9"/>
  <rect x="24" y="30" width="4" height="38" rx="2" fill="#ddd"/>
  <line x1="32" y1="40" x2="44" y2="40" stroke="#1B1F3B" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
  <line x1="32" y1="45" x2="44" y2="45" stroke="#1B1F3B" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
  <line x1="32" y1="50" x2="40" y2="50" stroke="#1B1F3B" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
  <circle cx="63" cy="57" r="16" fill="url(#sd-acc)"/>
  <polyline points="55,57 61,63 72,50" fill="none" stroke="#1B1F3B" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
</svg></span>
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
          <div className="modal" style={{display:"flex",flexDirection:"column"}}>
            <div className="modal-t">New Assignment</div>
            <div style={{flex:1,overflowY:"auto"}}>
              <div className="fg"><label className="flbl">Title *</label>
                <input className="finp" autoFocus value={af.title} onChange={e=>setAf({...af,title:e.target.value})} placeholder="e.g. Chapter 5 Essay"/>
              </div>
              <div className="fg"><label className="flbl">Class / Subject *</label>
                {allSubs.length===0||subjMode==="type"?(
                  <div style={{display:"flex",gap:6}}>
                    <input className="finp" style={{flex:1}} value={af.subject}
                      onChange={e=>setAf({...af,subject:e.target.value})}
                      placeholder="Type subject name..." autoFocus={subjMode==="type"}/>
                    {allSubs.length>0&&<button type="button" className="btn btn-sm btn-g" onClick={()=>{setSubjMode("select");setAf({...af,subject:""});}}>← Back</button>}
                  </div>
                ):(
                  <select className="fsel" value={af.subject} onChange={e=>{
                    if(e.target.value==="__new"){setSubjMode("type");setAf({...af,subject:""});}
                    else setAf({...af,subject:e.target.value});
                  }}>
                    <option value="">— Select class —</option>
                    {schSubs.length>0&&<optgroup label="📅 From Schedule">{schSubs.map(s=><option key={s} value={s}>{s}</option>)}</optgroup>}
                    {prevSubs.length>0&&<optgroup label="📝 Previous">{prevSubs.map(s=><option key={s} value={s}>{s}</option>)}</optgroup>}
                    <option value="__new">＋ Type a new one…</option>
                  </select>
                )}
              </div>
              <div className="frow">
                <div className="fg"><label className="flbl">Due Date</label><input className="finp" type="date" value={af.dueDate} onChange={e=>setAf({...af,dueDate:e.target.value})}/></div>
                <div className="fg"><label className="flbl">Priority</label>
                  <select className="fsel" value={af.priority} onChange={e=>setAf({...af,priority:e.target.value})}>
                    <option value="high">🔴 High</option><option value="medium">🟡 Medium</option><option value="low">🟢 Low</option>
                  </select>
                </div>
              </div>
              <div className="fg"><label className="flbl">Progress — {af.progress}%</label>
                <input className="range" type="range" min="0" max="100" step="5" value={af.progress} onChange={e=>setAf({...af,progress:+e.target.value})}/>
              </div>
              <div className="fg"><label className="flbl">Notes</label>
                <textarea className="ftxt" value={af.notes} onChange={e=>setAf({...af,notes:e.target.value})} placeholder="Any notes..." style={{minHeight:72}}/>
              </div>
            </div>
            <div className="mactions" style={{borderTop:"1.5px solid var(--border)",paddingTop:14,marginTop:6,flexShrink:0}}>
              <button className="btn btn-g" onClick={()=>{setAddingA(false);setAf(emptyAF);setSubjMode("select");}} disabled={validatingAssignment}>Cancel</button>
              <button className="btn btn-p" onClick={addAssignment} disabled={!af.title||!af.subject||validatingAssignment}>
                {validatingAssignment ? "Validating..." : "Add Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGNMENT DETAIL MODAL */}
      {selectedAssignment&&(
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&(setSelectedAssignment(null),setEditingAssignment(false))}>
          <div className="modal" style={{display:"flex",flexDirection:"column",maxWidth:600}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <div className="modal-t">Assignment Details</div>
              {!editingAssignment&&<button className="btn btn-sm btn-g" onClick={()=>setEditingAssignment(true)} title="Edit">✏️ Edit</button>}
              {editingAssignment&&<button className="btn btn-sm btn-p" onClick={()=>{updateA(selectedAssignment.id,selectedAssignment);setEditingAssignment(false);}} title="Save">💾 Save</button>}
            </div>
            <div style={{flex:1,overflowY:"auto"}}>
              {!editingAssignment?(
                <>
                  <div className="fg"><label className="flbl">Title</label>
                    <div style={{padding:"10px 0",fontSize:"1.05rem",fontWeight:600,color:"var(--text)"}}>{selectedAssignment.title}</div>
                  </div>
                  <div className="frow">
                    <div className="fg"><label className="flbl">Subject</label>
                      <div style={{padding:"10px 0",color:"var(--text2)"}}>{selectedAssignment.subject||"—"}</div>
                    </div>
                    <div className="fg"><label className="flbl">Priority</label>
                      <div style={{padding:"10px 0",color:"var(--text2)"}}>{PRIORITY[selectedAssignment.priority]?.label||"Medium"}</div>
                    </div>
                  </div>
                  <div className="frow">
                    <div className="fg"><label className="flbl">Due Date</label>
                      <div style={{padding:"10px 0",color:"var(--text2)"}}>{selectedAssignment.dueDate?fmtDate(selectedAssignment.dueDate):"No date"}</div>
                    </div>
                    <div className="fg"><label className="flbl">Progress</label>
                      <div style={{padding:"10px 0",color:"var(--text2)"}}>{selectedAssignment.progress}%</div>
                    </div>
                  </div>
                  {selectedAssignment.grade!=null&&(
                    <div className="fg"><label className="flbl">Grade</label>
                      <div style={{padding:"10px 0",color:"var(--text2)",fontWeight:700}}>{selectedAssignment.grade}% {selectedAssignment.gradeRaw&&<span style={{fontWeight:400,opacity:.7}}>({selectedAssignment.gradeRaw})</span>}</div>
                    </div>
                  )}
                  {selectedAssignment.notes&&(
                    <div className="fg"><label className="flbl">Notes</label>
                      <div style={{padding:"10px 0",color:"var(--text2)",whiteSpace:"pre-wrap"}}>{selectedAssignment.notes}</div>
                    </div>
                  )}
                  {/* Source Links */}
                  {(selectedAssignment.canvasUrl||selectedAssignment.slidesUrl||selectedAssignment.agendaDocUrl)&&(
                    <div className="fg"><label className="flbl">Source Links</label>
                      <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:8}}>
                        {selectedAssignment.canvasUrl&&<a href={selectedAssignment.canvasUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-g" style={{textDecoration:"none"}}>🎓 View on Canvas</a>}
                        {selectedAssignment.slidesUrl&&<a href={selectedAssignment.slidesUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-g" style={{textDecoration:"none"}}>📊 View Slides</a>}
                        {selectedAssignment.agendaDocUrl&&<a href={selectedAssignment.agendaDocUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-g" style={{textDecoration:"none"}}>📄 View Agenda Doc</a>}
                        {selectedAssignment.agendaSlideUrl&&<a href={selectedAssignment.agendaSlideUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-g" style={{textDecoration:"none"}}>📑 View Specific Slide</a>}
                      </div>
                    </div>
                  )}
                </>
              ):(
                <>
                  <div className="fg"><label className="flbl">Title *</label>
                    <input className="finp" value={selectedAssignment.title} onChange={e=>setSelectedAssignment({...selectedAssignment,title:e.target.value})}/>
                  </div>
                  <div className="fg"><label className="flbl">Subject *</label>
                    <input className="finp" value={selectedAssignment.subject} onChange={e=>setSelectedAssignment({...selectedAssignment,subject:e.target.value})}/>
                  </div>
                  <div className="frow">
                    <div className="fg"><label className="flbl">Due Date</label>
                      <input className="finp" type="date" value={selectedAssignment.dueDate||""} onChange={e=>setSelectedAssignment({...selectedAssignment,dueDate:e.target.value})}/>
                    </div>
                    <div className="fg"><label className="flbl">Priority</label>
                      <select className="fsel" value={selectedAssignment.priority} onChange={e=>setSelectedAssignment({...selectedAssignment,priority:e.target.value})}>
                        <option value="high">🔴 High</option><option value="medium">🟡 Medium</option><option value="low">🟢 Low</option>
                      </select>
                    </div>
                  </div>
                  <div className="fg"><label className="flbl">Progress — {selectedAssignment.progress}%</label>
                    <input className="range" type="range" min="0" max="100" step="5" value={selectedAssignment.progress} onChange={e=>setSelectedAssignment({...selectedAssignment,progress:+e.target.value})}/>
                  </div>
                  <div className="fg"><label className="flbl">Notes</label>
                    <textarea className="ftxt" value={selectedAssignment.notes||""} onChange={e=>setSelectedAssignment({...selectedAssignment,notes:e.target.value})} style={{minHeight:72}}/>
                  </div>
                </>
              )}
            </div>
            <div className="mactions" style={{borderTop:"1.5px solid var(--border)",paddingTop:14,marginTop:6,flexShrink:0}}>
              <button className="btn btn-g" onClick={()=>{setSelectedAssignment(null);setEditingAssignment(false);}}>Close</button>
              {editingAssignment&&<button className="btn btn-p" onClick={()=>{updateA(selectedAssignment.id,selectedAssignment);setEditingAssignment(false);setSelectedAssignment(null);}}>Save & Close</button>}
            </div>
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
          <div className="modal" style={{display:"flex",flexDirection:"column"}}>
            <div className="modal-t">New Class</div>
            <div style={{flex:1,overflowY:"auto"}}>
              <div className="fg"><label className="flbl">Class Name *</label><input className="finp" autoFocus value={cf.name} onChange={e=>setCf({...cf,name:e.target.value})} placeholder="e.g. Calculus II"/></div>
              <div className="fg"><label className="flbl">Days</label><div className="dtogglerow">{DAYS.map(d=><button key={d} className={"dtoggle"+(cf.days.includes(d)?" on":"")} onClick={()=>setCf({...cf,days:cf.days.includes(d)?cf.days.filter(x=>x!==d):[...cf.days,d]})}>{d}</button>)}</div></div>
              <div className="frow">
                <div className="fg"><label className="flbl">Start Time</label><input className="finp" type="time" value={cf.startTime} onChange={e=>setCf({...cf,startTime:e.target.value})}/></div>
                <div className="fg"><label className="flbl">End Time</label><input className="finp" type="time" value={cf.endTime} onChange={e=>setCf({...cf,endTime:e.target.value})}/></div>
              </div>
              <div className="fg"><label className="flbl">Room</label><input className="finp" value={cf.room} onChange={e=>setCf({...cf,room:e.target.value})} placeholder="e.g. Room 204"/></div>
              <div className="fg"><label className="flbl">Color</label><div className="swatches">{SUBJECT_COLORS.map(col=><div key={col} className={"swatch"+(cf.color===col?" on":"")} style={{background:col}} onClick={()=>setCf({...cf,color:col})}/>)}</div></div>
            </div>
            <div className="mactions" style={{borderTop:"1.5px solid var(--border)",paddingTop:14,marginTop:6,flexShrink:0}}>
              <button className="btn btn-g" onClick={()=>{setAddingC(false);setCf(emptyCF);}}>Cancel</button>
              <button className="btn btn-p" onClick={addClass}>Add Class</button>
            </div>
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
                      <div style={{marginLeft:"auto",fontSize:".7rem",color:"#6366f1",fontWeight:600,cursor:"pointer",textDecoration:"underline"}} onClick={()=>{setImportOpen(false);resetImport();setTokenDraft(canvasToken);setShowCanvasSetup(true);}}>Change</div>
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
                      <button className="btn btn-p" style={{background:"#4338ca",minWidth:160}} onClick={handleImportFromCanvasAPI}>
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
                      <button className="btn btn-p" style={{background:"#4338ca"}} onClick={()=>{setImportOpen(false);resetImport();setTokenDraft(canvasToken);setShowCanvasSetup(true);}}>Connect Canvas →</button>
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
                      <button className="btn btn-p" style={{background:"#4338ca"}} onClick={handleImportFromCanvasPaste} disabled={!canvasPaste.trim()}>Import</button>
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
                  <button className="btn btn-g" onClick={()=>{setImportResult(null);setCanvasStatus("");setFetchStatus("");setImporting(false);}}>← Try Again</button>
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
                          {[...new Map(classes.map(c=>[c.name,c])).values()].map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
                          <option value="">— No class —</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mactions">
                  <button className="btn btn-g" onClick={()=>{setImportResult(null);setFetchStatus("");setCanvasStatus("");setImporting(false);}}>← Redo</button>
                  <button className="btn btn-p" onClick={handleConfirmImport} disabled={!importResult.assignments.length}>Add {importResult.assignments.length} to Tracker →</button>
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
                <div className="about-logo" style={{padding:0,overflow:"hidden"}}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <defs>
    <linearGradient id="sd-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#1B1F3B"/>
      <stop offset="100%" stopColor="#2d3561"/>
    </linearGradient>
    <linearGradient id="sd-acc" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#f5a623"/>
      <stop offset="100%" stopColor="#f7c059"/>
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="48" fill="url(#sd-bg)"/>
  <rect x="24" y="30" width="24" height="38" rx="3" fill="#fff" opacity="0.15"/>
  <rect x="26" y="30" width="22" height="38" rx="2" fill="#fff" opacity="0.9"/>
  <rect x="24" y="30" width="4" height="38" rx="2" fill="#ddd"/>
  <line x1="32" y1="40" x2="44" y2="40" stroke="#1B1F3B" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
  <line x1="32" y1="45" x2="44" y2="45" stroke="#1B1F3B" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
  <line x1="32" y1="50" x2="40" y2="50" stroke="#1B1F3B" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
  <circle cx="63" cy="57" r="16" fill="url(#sd-acc)"/>
  <polyline points="55,57 61,63 72,50" fill="none" stroke="#1B1F3B" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
</svg></div>
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

              <div className="about-section">
                <div className="about-section-title">Need Help?</div>
                <div className="about-card" style={{textAlign:"center"}}>
                  <p style={{color:"var(--text2)",marginBottom:12,fontSize:".9rem"}}>
                    Questions, feedback, or need support?
                  </p>
                  <a 
                    href="mailto:support@mystudydesk.app" 
                    style={{
                      color:"var(--accent)",
                      fontWeight:600,
                      fontSize:"1rem",
                      textDecoration:"none"
                    }}
                  >
                    support@mystudydesk.app
                  </a>
                </div>
              </div>

              <div className="about-made">Made by <span>Amar G.</span> · Free forever</div>
            </div>
          </div>
        </div>
      )}

      {/* RELEASE MODAL */}
      {showReleases&&(
        <div className="releases-fullpage">
          <div className="releases-header">
            <div className="releases-header-content">
              <div>
                <h1 className="releases-main-title">Release Notes</h1>
                <p className="releases-subtitle">Track all updates and improvements to StudyDesk</p>
              </div>
              <button onClick={dismissReleases} className="releases-close-btn" aria-label="Close">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
          <div className="releases-content">
            <div className="releases-container">
              {RELEASES.map((r,i)=>(
                <div key={r.version} className="release-card">
                  <div className="release-card-header">
                    <div className="release-version-info">
                      <span className="release-version-badge">Version {r.version}</span>
                      {i===0&&<span className="release-latest-badge">Latest</span>}
                    </div>
                    <span className="release-date-text">{r.date}</span>
                  </div>
                  <h2 className="release-card-title">{r.title}</h2>
                  <ul className="release-changes-list">
                    {r.changes.map((c,j)=>(
                      <li key={j} className="release-change-item">{c}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CANVAS SETUP MODAL */}
      {showCanvasSetup&&(
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowCanvasSetup(false)}>
          <div className="modal" style={{maxWidth:500}}>
            <div className="modal-t">🎓 Connect Canvas</div>
            {isChromebook||proxyBlocked?(
              <div style={{textAlign:"center",padding:"24px 12px"}}>
                <div style={{fontSize:"2.5rem",marginBottom:12}}>🚫</div>
                <div style={{fontFamily:"'Fraunces',serif",fontSize:"1.1rem",fontWeight:700,color:"var(--text)",marginBottom:8}}>{isChromebook?"Not supported on Chromebooks":"Canvas blocked on this network"}</div>
                <div style={{fontSize:".84rem",color:"var(--text2)",lineHeight:1.6,marginBottom:20}}>
                  {isChromebook
                    ?"Canvas sync requires a direct connection to your school's Canvas server, which school Chromebooks block for security reasons."
                    :"Your current network is blocking the Canvas connection (likely school wifi or a firewall)."
                  }<br/><br/>Please connect Canvas on a <b>personal device or home network</b> — your data will sync to this account automatically.
                </div>
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
              <input className="finp" type="password" value={tokenDraft}
                onChange={e=>setTokenDraft(e.target.value)}
                placeholder="Paste your token here..."/>
            </div>

            {canvasSync.error&&<div className="err-box" style={{marginBottom:10}}>⚠️ {canvasSync.error}</div>}

            <div className="mactions">
              {canvasToken&&<button className="btn btn-g" onClick={()=>{setCanvasToken("");setTokenDraft("");setCanvasBaseUrl("https://naperville.instructure.com");}}>🗑 Disconnect</button>}
              <button className="btn btn-g" onClick={()=>setShowCanvasSetup(false)}>Cancel</button>
              <button className="btn btn-p" style={{background:"#4338ca"}} disabled={!tokenDraft.trim()||!canvasBaseUrl}
                onClick={()=>{
                  const tok=tokenDraft.trim();
                  setCanvasToken(tok);
                  setCanvasSync(s=>({...s,everSucceeded:true}));
                  setShowCanvasSetup(false);
                  handleSyncCanvas(tok,canvasBaseUrl);
                }}>
                Connect & Sync →
              </button>
            </div>
              </>
            )}
          </div>
        </div>
      )}

        </div>{/* end mob-content */}

        </div>{/* end main-inner */}

      {/* PWA INSTALL BANNER — mobile only */}
      {pwaPrompt&&isMobile&&(
        <div className="pwa-banner">
          <span style={{fontSize:"1.6rem"}}>📱</span>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:".88rem"}}>Add StudyDesk to Home Screen</div>
            <div style={{fontSize:".74rem",opacity:.85}}>Access it like an app — works offline too</div>
          </div>
          <button onClick={()=>{pwaPrompt.prompt();setPwaPrompt(null);}} style={{background:"rgba(255,255,255,.25)",border:"1.5px solid rgba(255,255,255,.4)",borderRadius:10,color:"#fff",padding:"7px 14px",fontWeight:700,fontSize:".8rem",cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",flexShrink:0}}>Add</button>
          <button onClick={()=>setPwaPrompt(null)} style={{background:"none",border:"none",color:"rgba(255,255,255,.7)",cursor:"pointer",fontSize:"1.1rem",padding:"0 4px",flexShrink:0}}>✕</button>
        </div>
      )}

      {/* LEADERBOARD MODAL */}
      {showLeaderboard&&(
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowLeaderboard(false)}>
          <div className="modal" style={{maxWidth:480}}>
            <div className="modal-t">🏆 Leaderboard</div>
            <div style={{fontSize:".78rem",color:"var(--text3)",marginBottom:16}}>Top students by total points earned</div>
            {leaderboard.length===0?(
              <div style={{textAlign:"center",padding:"32px 0",color:"var(--text4)"}}>
                <div style={{fontSize:"2rem",marginBottom:8}}>🏆</div>
                <div style={{fontWeight:600}}>Loading...</div>
              </div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {leaderboard.map((entry,i)=>(
                  <div key={i} className="lb-row">
                    <div className={"lb-rank"+(i<3?" top":"")}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}`}</div>
                    <div className="lb-avatar">
                      {entry.photo?<img src={entry.photo} width="34" height="34" style={{objectFit:"cover"}}/>:entry.name[0].toUpperCase()}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:".85rem",color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{entry.name}{user&&entry.name===(user.displayName||user.email.split("@")[0])?" (you)":""}</div>
                      <div style={{fontSize:".7rem",color:"var(--text3)",marginTop:1}}>🔥 {entry.streak} day streak</div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontFamily:"'Fraunces',serif",fontSize:"1.1rem",fontWeight:700,color:"var(--accent)"}}>{entry.points}</div>
                      <div style={{fontSize:".65rem",color:"var(--text4)"}}>pts</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mactions"><button className="btn btn-g" onClick={()=>setShowLeaderboard(false)}>Close</button></div>
          </div>
        </div>
      )}

        </div>{/* end main-wrap */}

      {/* MOBILE BOTTOM NAV */}
      <nav className="bnav">
        {([
          ["dashboard","Home",<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>],
          ["assignments","Tasks",<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>],
          ["grades","Grades",<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>],
          ["timer","Timer",<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M9 1h6M12 1v3"/></svg>],
          ["schedule","Plan",<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>],
          ["ai","AI",<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 8v4l3 3"/><circle cx="18" cy="5" r="3" fill="currentColor" stroke="none"/></svg>],
        ]).map(([t,lbl,icon])=>(
          <button key={t} className={"bnav-btn"+(tab===t?" on":"")} onClick={()=>setTab(t)}>
            <span className="bnav-ico">{icon}</span>
            <span>{lbl}</span>
          </button>
        ))}
      </nav>

      {/* FLOATING ACTION BUTTON */}
      <button className="fab" onClick={()=>setAddingA(true)} title="Add Assignment">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>

      {/* KEYBOARD SHORTCUTS PANEL */}
      <KeyboardShortcutsPanel 
        show={showKeyboardShortcuts} 
        onClose={() => setShowKeyboardShortcuts(false)} 
        darkMode={darkMode} 
      />

      {/* NOTIFICATION CENTER */}
      <NotificationCenter 
        show={showNotifications} 
        onClose={() => setShowNotifications(false)} 
        assignments={assignments}
        darkMode={darkMode}
        onAssignmentClick={(assignment) => {
          // Could open assignment details modal here
          console.log('Clicked assignment:', assignment);
        }}
      />

      {/* MULTI-SELECT BAR */}
      <MultiSelectBar
        selectedCount={selectedAssignments.length}
        onComplete={handleBulkComplete}
        onDelete={handleBulkDelete}
        onReschedule={handleBulkReschedule}
        onCancel={cancelMultiSelect}
        darkMode={darkMode}
      />

    </>
  );
}
