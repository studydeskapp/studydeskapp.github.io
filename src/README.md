# 📚 StudyDesk

> A smart homework tracker for high school students — built with React, Firebase, and Canvas API integration.

**Live app → [studydeskapp.github.io](https://studydeskapp.github.io)**

---

## ✨ Features

### 📝 Assignment Tracking
- Add assignments manually or import directly from Canvas
- Priority levels (High / Medium / Low) with overdue detection
- Progress tracking per assignment
- Smart subject picker pulls from your schedule automatically

### 🎓 Canvas Integration
- Connect your Canvas API token once — assignments import with one click
- Pulls **all upcoming** assignments, quizzes, and discussions
- Auto-syncs every **3 minutes** — marks assignments as done the moment you submit on Canvas
- Grades sync automatically when posted, shown color-coded on every card (A=green, B=blue, C=yellow, F=red)
- Manual refresh button in the header

### 📈 Grades Tab
- Per-class grade averages with letter grades (A+ through F)
- Weighted scoring when points-possible data is available from Canvas
- Expandable class cards showing every graded assignment
- Overall average banner across all classes

### 📅 Schedule
- Weekly timetable view with color-coded classes
- Import your bell schedule directly by searching your school (80+ schools pre-loaded)
- Day-specific bell times — supports rotating schedules, late-start Wednesdays, SOAR periods, etc.
- Add classes manually with custom times and room numbers

### 🐣 Study Buddy
- A virtual pet that grows as your streak increases (6 evolution stages)
- Earns XP when you complete assignments
- Equip accessories from the Shop (hats, glasses, capes, and more)

### ⭐ Points & Streaks
- Earn 15 points per completed assignment
- Daily streak — complete 3 assignments a day to keep it going
- Scaling bonus points for longer streaks

### 🛍️ Shop
- 12 accessories to customize your buddy
- Spend points earned from completing assignments

### 🔐 Auth & Sync
- Google sign-in or email/password via Firebase Authentication
- All data synced to Firestore — works across devices
- Live presence — see how many StudyDesk users are online

---

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- A Firebase project with Authentication and Firestore enabled
- (Optional) A Canvas API token from your school's Canvas instance

### Installation

```bash
git clone https://github.com/studydeskapp/studydeskapp.github.io
cd studydeskapp.github.io
npm install
npm start
```

App runs at `http://localhost:3000`

### Deploy to GitHub Pages

```bash
npm run deploy
```

---

## 🎓 Connecting Canvas

1. Open Canvas → click your profile picture → **Settings**
2. Scroll to **Approved Integrations** → click **New Access Token**
3. Name it `StudyDesk`, click **Generate Token**, copy it
4. In StudyDesk, click **🎓 Connect Canvas** in the header and paste your token

Once connected, StudyDesk will auto-sync every 3 minutes. You can also hit the sync badge in the header to refresh manually anytime.

---

## 🏫 Supported Schools (Bell Schedule Auto-Import)

Full day-specific bell schedules are built in for:

| School | District | Notes |
|---|---|---|
| Naperville Central High School | Naperville 203, IL | Full rotating schedule with SOAR |
| Naperville North High School | Naperville 203, IL | Standard 8-period schedule |

For all other schools, StudyDesk searches the NCES database (~100,000 US public schools). If your school is found, you can enter your bell times once and they'll be saved for everyone at your school.

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React (Create React App) |
| Auth | Firebase Authentication (Google + Email) |
| Database | Cloud Firestore (REST API, no SDK) |
| Hosting | GitHub Pages |
| Canvas | Canvas LMS REST API |
| School Search | OpenDataSoft NCES dataset + CORS proxy fallback |

> No Firebase SDK — all Firestore and Auth calls use the REST API directly to keep the bundle small.

---

## 📦 Project Structure

```
src/
  StudyDesk.jsx    # Entire app — single component file (~3400 lines)
  index.js         # Entry point
  App.js           # Renders StudyDesk
public/
  index.html
```

---

## 🔒 Environment / Config

All config is hardcoded in `StudyDesk.jsx` at the top of the file:

```js
const FB_KEY = "...";          // Firebase API key
const FB_PROJECT = "...";      // Firebase project ID
const GOOGLE_CLIENT_ID = "..."; // Google OAuth Web Client ID
```

To deploy your own instance, swap these values for your own Firebase project.

---

## 📋 Changelog

### v1.3.0 — March 2026
- Canvas one-click import (fetches all upcoming assignments via API)
- Canvas auto-sync every 3 minutes
- Grades tab with per-class averages and letter grades
- School bell schedule import with 80+ schools pre-loaded
- Google sign-in rebuilt with Google Identity Services
- Cleaner header — username dropdown replaces separate sign-out button

### v1.2.0 — March 2026
- Dark mode
- Redesigned dashboard with stat cards and overdue banner
- Schedule reworked into two-panel layout
- Smart subject picker

### v1.1.0 — March 2026
- Study Buddy with 6 evolution stages
- Points, streaks, and daily quests
- Shop with 12 accessories

### v1.0.0 — March 2026
- Initial launch
- Assignment tracking with Canvas, Google Slides, and Agenda import
- Weekly schedule view

---

## 💡 Feedback & Suggestions

Use the **💡 Suggest** button inside the app to send feature ideas or bug reports directly.

---

*Built for Naperville 203 students — works for any school with Canvas.*