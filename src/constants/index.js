export const STORAGE_KEY = "hw-tracker-v1";
export const APP_VERSION = "1.6.0";

export const RELEASES = [
  {
    version: "1.6.0",
    date: "12 March 2026",
    title: "Smart Features & Analytics",
    changes: [
      "📊 New Analytics Tab - comprehensive stats with beautiful charts",
      "📈 Completion tracking by day with bar charts",
      "📚 Performance breakdown by subject with completion rates",
      "🎯 Grade distribution visualization",
      "📅 Current workload analysis by priority",
      "🤖 Smart Prioritization - AI suggests which assignment to work on next",
      "💡 Contextual recommendations based on due dates, grades, and difficulty",
      "⏰ Time-based suggestions (morning focus, evening review, etc.)",
      "🔄 Assignment Templates - create recurring assignments automatically",
      "📝 Weekly, biweekly, monthly, or custom recurrence patterns",
      "✨ Templates auto-create assignments on schedule",
      "🐣 Buddy Interactions - your buddy now reacts to your actions!",
      "💬 Motivational quotes and contextual tips",
      "😊 Mood changes based on your progress and streak",
      "🎉 Celebrates completions and milestones with you",
      "📊 Key metrics dashboard - completion rate, avg grade, streak, overdue count",
      "🎨 Beautiful gradient cards and smooth animations throughout",
    ]
  },
  {
    version: "1.5.1",
    date: "12 March 2026",
    title: "AI Response Truncation Detection",
    changes: [
      "⚠️ Detects when AI homework explanations get cut off due to length",
      "📊 Shows warning banner when response is truncated",
      "💡 Suggests selecting fewer problems or uploading clearer image",
      "🔄 Quick 'Start Over' button to retry with different selection",
      "🎯 Works for both homework explanations and answer feedback",
      "🔍 Checks for MAX_TOKENS finish reason and incomplete sentences",
      "✨ Helps students get complete explanations for their work",
    ]
  },
  {
    version: "1.5.0",
    date: "12 March 2026",
    title: "Mobile UI Overhaul",
    changes: [
      "📱 Completely redesigned mobile interface with modern iOS-inspired design",
      "✨ Smooth animations and transitions throughout - cards fade in with stagger effect",
      "🎨 Gradient status pills with subtle shadows for depth",
      "🔘 Larger tap targets (48px minimum) for better touch accuracy",
      "🎯 Modern bottom navigation with animated active states",
      "💫 Bottom sheet modals with smooth slide-up animation",
      "🌊 Frosted glass effect on header and bottom nav with backdrop blur",
      "📦 Refined card shadows and borders for better visual hierarchy",
      "🎭 Active states on all interactive elements with scale animations",
      "🚀 Improved FAB (floating action button) with better positioning",
      "📐 Better spacing and padding throughout for breathing room",
      "🎪 Staggered card animations - each card animates in sequence",
      "💅 Polished input fields with focus states and proper sizing",
      "🎨 Enhanced status pills with gradient backgrounds",
    ]
  },
  {
    version: "1.4.4",
    date: "12 March 2026",
    title: "Schedule Display Fix",
    changes: [
      "🔧 Fixed duplicate class display in admin panel - classes with different times now grouped together",
      "📅 Classes with multiple time slots (e.g., different times for Mon/Fri vs Tue/Thu) now show all schedules under one entry",
      "✨ Improved class count accuracy throughout the app",
      "🏫 Schedule tab already handled this correctly, now admin panel matches",
    ]
  },
  {
    version: "1.4.3",
    date: "12 March 2026",
    title: "Enhanced Admin Dashboard",
    changes: [
      "🎨 Completely redesigned admin panel with modern gradient cards and smooth animations",
      "👤 Click any user to view their full profile with detailed stats",
      "📊 User detail view shows assignments (pending & completed), classes, grades, and game progress",
      "🔍 Search users by email or display name",
      "📈 Enhanced stat cards with gradient backgrounds and hover effects",
      "🟢 Online users now clickable to view their profiles",
      "💾 View user's Canvas URL, account creation date, and last seen timestamp",
      "📝 See all user assignments with progress, grades, and completion status",
      "🏫 View user's class schedule with times and room numbers",
      "🎮 Game progress section showing points, streak, daily count, and owned items",
      "✨ Improved UI with better spacing, colors, and visual hierarchy",
      "🔐 Enhanced password gate with better styling",
    ]
  },
  {
    version: "1.4.2",
    date: "12 March 2026",
    title: "Assignment Details & Sorting",
    changes: [
      "🔍 Click any assignment to view full details in a modal",
      "✏️ Edit assignments directly from the detail view with the Edit button",
      "🔗 Source links for imported assignments - Canvas, Google Slides, and Agenda docs",
      "📊 Sort assignments by date (soonest→farthest or vice versa) or priority (high→low or low→high)",
      "🎯 Sort controls appear above assignment list for easy access",
      "💾 Assignment edits save automatically when you close the detail modal",
      "🖱️ Click anywhere on an assignment card to open details (buttons still work as before)",
    ]
  },
  {
    version: "1.4.1",
    date: "12 March 2026",
    title: "Critical Bug Fixes",
    changes: [
      "🐛 Fixed assignment list flickering when typing in add assignment modal",
      "✅ Add assignment modal now properly closes and switches to assignments tab",
      "🔧 Fixed submit button crash (white screen) - added proper error handling",
      "📥 Fixed Canvas import button - now works correctly with pasted data",
      "✨ Fixed 'Add to Tracker' button - assignments now properly added after import",
      "🤖 Fixed AI chat empty responses - updated to use correct Gemini model",
      "🎯 Import now automatically switches to assignments tab after completion",
      "🛡️ Added comprehensive error handling throughout import and game logic",
      "📝 Better console logging for debugging import and AI issues",
    ]
  },
  {
    version: "1.4.0",
    date: "11 March 2026",
    title: "UI Refresh & Productivity Boost",
    changes: [
      "🎨 Vibrant new accent color — blue gradient replaces the dark theme for a more modern look",
      "📏 Wider sidebar (260px) — more breathing room for navigation on desktop",
      "✨ Enhanced stat cards — subtle gradients, larger icons (25% opacity), and smoother animations",
      "📝 Bigger assignment titles — improved readability with larger font and better spacing",
      "📊 Prominent progress bars — 8px height with clearer percentage labels, now visible on mobile",
      "🚨 Attention-grabbing overdue styling — red border with glow effect so you never miss a deadline",
      "⚡ Snappier interactions — reduced animation times from 180ms to 120ms throughout",
      "🎯 Floating action button — quick-add assignments from anywhere with the + button",
      "⌨️ Keyboard shortcuts — press N to add, J/K to navigate tabs (shown in header)",
      "🐣 Animated buddy — subtle glow effect makes your study companion feel more alive",
      "📱 Better mobile layout — progress bars full-width, improved card spacing, compact header",
      "🌊 Horizontal scroll fade — visual indicator when tabs overflow on mobile",
      "�️ Improved desktop spacing — header has proper margins from sidebar",
    ]
  },
  {
    version: "1.3.2",
    date: "10 March 2026",
    title: "Custom Domain & Bug Fixes",
    changes: [
      "🌐 StudyDesk is now live at mystudydesk.app — a proper home for the app",
      "🔒 Google sign-in now works correctly on the custom domain",
      "📱 Fixed modals and import dialogs being covered by the mobile bottom nav bar",
      "✅ Import assignments now shows up properly on mobile after fetching",
      "🗂️ Subject filter tabs now only appear when there are pending assignments",
      "📝 Assignments tab now shows the empty state correctly when you have nothing due",
      "📧 Email verification link now points to mystudydesk.app",
    ]
  },
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
      "Smart homework parser reads both 'Due [day]' and 'TODAY'S HOMEWORK' formats",
      "Supports numeric dates like 1/27 and 2/4 for chemistry-style slides",
      "Subject dropdown on review screen — correct the class before adding",
      "Remove individual assignments from import preview with the ✕ button",
      "Priority levels, progress tracking, and overdue detection",
      "Weekly schedule view with class time and room management",
    ]
  }
];

export const PRIORITY = {
  high:   { label: "High",   bg: "#fef2f2", text: "#dc2626" },
  medium: { label: "Medium", bg: "#fffbeb", text: "#d97706" },
  low:    { label: "Low",    bg: "#f0fdf4", text: "#16a34a" },
};

export const SUBJECT_COLORS = ["#6366f1","#ec4899","#14b8a6","#f59e0b","#3b82f6","#8b5cf6","#10b981","#f97316","#06b6d4","#e11d48","#84cc16","#0ea5e9"];

export const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

export const HOURS = Array.from({length:15},(_,i)=>i+7);

export const SHOP_ITEMS = [
  {id:"party_hat",name:"Party Hat",cat:"hat",price:50,emoji:"🎉",desc:"Ready to celebrate!"},
  {id:"crown",name:"Royal Crown",cat:"hat",price:200,emoji:"👑",desc:"Fit for royalty"},
  {id:"wizard_hat",name:"Wizard Hat",cat:"hat",price:150,emoji:"🪄",desc:"Full of magic"},
  {id:"santa_hat",name:"Santa Hat",cat:"hat",price:100,emoji:"🎅",desc:"Ho ho homework!"},
  {id:"sunglasses",name:"Sunglasses",cat:"face",price:75,emoji:"😎",desc:"Too cool for school"},
  {id:"heart_eyes",name:"Heart Glasses",cat:"face",price:120,emoji:"🩷",desc:"Love studying"},
  {id:"monocle",name:"Monocle",cat:"face",price:130,emoji:"🧐",desc:"Very distinguished"},
  {id:"bow_tie",name:"Bow Tie",cat:"body",price:60,emoji:"🎀",desc:"Dressed to impress"},
  {id:"cape",name:"Hero Cape",cat:"body",price:220,emoji:"🦸",desc:"Study hero!"},
  {id:"halo",name:"Halo",cat:"special",price:280,emoji:"😇",desc:"Pure dedication"},
  {id:"wings",name:"Fairy Wings",cat:"special",price:350,emoji:"🦋",desc:"Soar through homework"},
  {id:"rainbow",name:"Rainbow Aura",cat:"special",price:420,emoji:"🌈",desc:"Legendary scholar"}
];

export const BUDDY_STAGES = [
  {name:"Sleeping Egg",min:0,next:1,desc:"Complete your first streak to hatch!"},
  {name:"Baby Bud",min:1,next:3,desc:"A little buddy is growing..."},
  {name:"Tiny Tot",min:3,next:7,desc:"Getting bigger every day!"},
  {name:"Young Pal",min:7,next:14,desc:"Really coming into their own!"},
  {name:"Study Star",min:14,next:30,desc:"Nearly at legendary status!"},
  {name:"Legend",min:30,next:null,desc:"You have reached the pinnacle!"}
];
