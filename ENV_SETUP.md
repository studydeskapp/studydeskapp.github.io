# Where to Get Your API Keys

## 1. Firebase Keys (`REACT_APP_FB_KEY`, `REACT_APP_FB_PROJECT`)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create one)
3. Click the gear icon → **Project settings**
4. Scroll to **Your apps** → select your web app (or add one)
5. You'll see:
   - **Project ID** → use for `REACT_APP_FB_PROJECT`
   - **API Key** (under "Firebase SDK snippet") → use for `REACT_APP_FB_KEY`

---

## 2. Google OAuth Client ID (`REACT_APP_GOOGLE_CLIENT_ID`)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select the **same project** as your Firebase app (or link them)
3. Go to **APIs & Services** → **Credentials**
4. Click **Create credentials** → **OAuth client ID**
5. If prompted, configure the **OAuth consent screen** first
6. Choose **Web application**
7. Add **Authorized JavaScript origins** (e.g. `http://localhost:3000`, `https://mystudydesk.app`)
8. Create → copy the **Client ID** → use for `REACT_APP_GOOGLE_CLIENT_ID`

---

## 3. Gemini API Key (`REACT_APP_GEMINI_KEY`)

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Click **Get API key** in the left sidebar (or [direct link](https://aistudio.google.com/apikey))
3. Create an API key (or use an existing one)
4. Copy it → use for `REACT_APP_GEMINI_KEY`

---

## 4. Admin Password (`REACT_APP_ADMIN_PASS`)

You choose this yourself. It protects the admin panel at `/admin`.

- Set any password you want
- Leave empty to disable the admin panel

---

## Quick Reference

| Variable | Where to Get |
|----------|--------------|
| `REACT_APP_FB_KEY` | Firebase Console → Project settings → Your apps → API Key |
| `REACT_APP_FB_PROJECT` | Firebase Console → Project settings → Project ID |
| `REACT_APP_GOOGLE_CLIENT_ID` | Google Cloud Console → Credentials → OAuth 2.0 Client ID |
| `REACT_APP_GEMINI_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) → Create API key |
| `REACT_APP_ADMIN_PASS` | You choose (optional) |
