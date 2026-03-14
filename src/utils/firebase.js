// ┌──────────────────────────────────────────────────────────────────────────────┐
// │  FIREBASE UTILITIES                                                          │
// │  All Firebase project constants and REST API functions.                     │
// │  No Firebase SDK — pure REST API calls for auth, Firestore, and admin.     │
// └──────────────────────────────────────────────────────────────────────────────┘

// Firebase Configuration (from env - see .env.example)
export const FB_KEY = process.env.REACT_APP_FB_KEY || "";
export const FB_PROJECT = process.env.REACT_APP_FB_PROJECT || "studydesk-1b251";
export const FB_AUTH = "https://identitytoolkit.googleapis.com/v1/accounts";
export const FB_FS = `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents`;

// Google OAuth Configuration
export const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "REPLACE_WITH_YOUR_WEB_CLIENT_ID";

// ┌──────────────────────────────────────────────────────────────────────────────┐
// │  AUTHENTICATION FUNCTIONS                                                    │
// └──────────────────────────────────────────────────────────────────────────────┘

export async function fbRefreshToken(refreshToken) {
  const r = await fetch(`https://securetoken.googleapis.com/v1/token?key=${FB_KEY}`, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      grant_type: "refresh_token",
      refresh_token: refreshToken
    })
  });
  const d = await r.json();
  if(d.error) throw new Error(d.error.message);
  return {
    idToken: d.id_token,
    refreshToken: d.refresh_token,
    expiresIn: parseInt(d.expires_in) * 1000, // Convert to milliseconds
    uid: d.user_id
  };
}

export async function fbSignUp(email, password, displayName) {
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
  return {
    uid:d.localId, 
    email:d.email, 
    displayName, 
    idToken:d.idToken, 
    refreshToken:d.refreshToken,
    tokenExpiry: Date.now() + (parseInt(d.expiresIn) * 1000),
    photoURL:null
  };
}

export async function fbSignIn(email, password) {
  const r = await fetch(`${FB_AUTH}:signInWithPassword?key=${FB_KEY}`, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({email, password, returnSecureToken:true})
  });
  const d = await r.json();
  if(d.error) throw new Error(d.error.message);
  return {
    uid:d.localId, 
    email:d.email, 
    displayName:d.displayName||null, 
    idToken:d.idToken, 
    refreshToken:d.refreshToken,
    tokenExpiry: Date.now() + (parseInt(d.expiresIn) * 1000),
    photoURL:d.photoUrl||null
  };
}

export async function fbResetPassword(email) {
  const r = await fetch(`${FB_AUTH}:sendOobCode?key=${FB_KEY}`, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({requestType:"PASSWORD_RESET", email})
  });
  const d = await r.json();
  if(d.error) throw new Error(d.error.message);
  return true;
}

export async function fbSendVerificationEmail(idToken) {
  const r = await fetch(`${FB_AUTH}:sendOobCode?key=${FB_KEY}`, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      requestType:"VERIFY_EMAIL",
      idToken,
      continueUrl:"https://mystudydesk.app"
    })
  });
  const d = await r.json();
  if(d.error) throw new Error(d.error.message);
  return true;
}

export async function fbCheckEmailVerified(idToken) {
  const r = await fetch(`${FB_AUTH}:lookup?key=${FB_KEY}`, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({idToken})
  });
  const d = await r.json();
  if(d.error) throw new Error(d.error.message);
  return d.users?.[0]?.emailVerified === true;
}

export async function fbDeleteAccount(idToken) {
  await fetch(`${FB_AUTH}:delete?key=${FB_KEY}`, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({idToken})
  });
}

export async function fbAdminDeleteUserData(uid, adminIdToken) {
  // Delete user's Firestore docs (users + presence)
  await Promise.allSettled([
    fetch(`${FB_FS}/users/${uid}?key=${FB_KEY}`, {method:"DELETE", headers:{"Authorization":`Bearer ${adminIdToken}`}}),
    fetch(`${FB_FS}/presence/${uid}?key=${FB_KEY}`, {method:"DELETE", headers:{"Authorization":`Bearer ${adminIdToken}`}}),
  ]);
}

// ┌──────────────────────────────────────────────────────────────────────────────┐
// │  GOOGLE SIGN-IN (Google Identity Services)                                  │
// └──────────────────────────────────────────────────────────────────────────────┘

function loadGSI() {
  return new Promise(resolve => {
    if(window.google?.accounts?.id) { resolve(); return; }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.onload = resolve;
    document.head.appendChild(s);
  });
}

export async function fbGoogleSignIn() {
  if(GOOGLE_CLIENT_ID === "REPLACE_WITH_YOUR_WEB_CLIENT_ID") {
    throw new Error("Google sign-in not configured. See setup instructions.");
  }
  await loadGSI();
  return new Promise((resolve, reject) => {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response) => {
        if(response.credential) {
          try {
            // Exchange Google credential for Firebase token
            const r = await fetch(`${FB_AUTH}:signInWithIdp?key=${FB_KEY}`, {
              method:"POST", headers:{"Content-Type":"application/json"},
              body: JSON.stringify({
                requestUri: window.location.origin,
                postBody: `id_token=${response.credential}&providerId=google.com`,
                returnSecureToken: true,
                returnIdpCredential: true
              })
            });
            const d = await r.json();
            if(d.error) throw new Error(d.error.message);
            
            resolve({
              uid: d.localId,
              email: d.email,
              displayName: d.displayName || d.email.split("@")[0],
              idToken: d.idToken,
              refreshToken: d.refreshToken,
              tokenExpiry: Date.now() + (parseInt(d.expiresIn) * 1000),
              photoURL: d.photoUrl || null
            });
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error("No credential returned"));
        }
      },
      cancel_on_tap_outside: true,
    });
    window.google.accounts.id.prompt((notification) => {
      if(notification.isNotDisplayed() || notification.isSkippedMoment()) {
        const div = document.createElement("div");
        div.style.cssText = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:99999;";
        document.body.appendChild(div);
        window.google.accounts.id.renderButton(div, {
          type:"standard", theme:"outline", size:"large", text:"signin_with",
          width: 300,
        });
        const btn = div.querySelector("div[role=button]");
        if(btn) btn.click();
        setTimeout(() => { try { document.body.removeChild(div); } catch{} }, 5000);
      }
    });
  });
}

// ┌──────────────────────────────────────────────────────────────────────────────┐
// │  DATA MANAGEMENT (Firestore)                                                │
// └──────────────────────────────────────────────────────────────────────────────┘

export async function fbLoadData(uid, idToken) {
  const r = await fetch(`${FB_FS}/users/${uid}`, {
    headers:{"Authorization":`Bearer ${idToken}`}
  });
  if(r.status===404) return null;
  const d = await r.json();
  if(d.error) return null;
  const raw = d.fields?.data?.stringValue;
  return raw ? JSON.parse(raw) : null;
}

export async function fbEnsureValidToken(user) {
  // Check if token expires within the next 5 minutes
  const fiveMinutes = 5 * 60 * 1000;
  if (!user.tokenExpiry || !user.refreshToken || Date.now() < (user.tokenExpiry - fiveMinutes)) {
    return user; // Token is still valid
  }
  
  try {
    const refreshed = await fbRefreshToken(user.refreshToken);
    const updatedUser = {
      ...user,
      idToken: refreshed.idToken,
      refreshToken: refreshed.refreshToken,
      tokenExpiry: Date.now() + refreshed.expiresIn
    };
    
    // Update stored session
    fbSetSession(updatedUser);
    return updatedUser;
  } catch (error) {
    console.warn("Token refresh failed:", error);
    // If refresh fails, clear session and force re-login
    fbClearSession();
    throw new Error("Session expired. Please log in again.");
  }
}

/**
 * Save user data to Firestore.
 * Uses updateMask to update only the data field (merge semantics) — other document
 * fields are preserved. Returns a promise that rejects on failure for caller handling.
 */
export async function fbSaveData(uid, idToken, data) {
  const res = await fetch(`${FB_FS}/users/${uid}?updateMask.fieldPaths=data`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
    body: JSON.stringify({ fields: { data: { stringValue: JSON.stringify(data) } } }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || "Save failed");
  }
}

export function fbGetSession() {
  try { const s=localStorage.getItem("sd-session"); return s?JSON.parse(s):null; } catch{return null;}
}

export function fbIsTokenExpiringSoon(user) {
  if (!user || !user.tokenExpiry) return true; // Assume expired if no expiry info
  const fiveMinutes = 5 * 60 * 1000;
  return Date.now() >= (user.tokenExpiry - fiveMinutes);
}

export function fbSetSession(user) {
  try { localStorage.setItem("sd-session", user?JSON.stringify(user):""); } catch{}
}

export function fbClearSession() {
  try { localStorage.removeItem("sd-session"); } catch{}
}

export async function fbIncrementStat(field, amount, idToken) {
  if(!amount) amount=1;
  try{
    await fetch(`https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents:commit?key=${FB_KEY}`,{
      method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${idToken}`},
      body:JSON.stringify({writes:[{transform:{document:`projects/${FB_PROJECT}/databases/(default)/documents/analytics/global`,fieldTransforms:[{fieldPath:field,increment:{integerValue:amount}}]}}]})
    });
  }catch(e){console.warn("Stat error",e);}
}

export async function fbUpdatePresence(user, extra={}) {
  try{
    const extraFields = {};
    if(extra.points!=null) extraFields.points = {integerValue: String(extra.points)};
    if(extra.streak!=null) extraFields.streak = {integerValue: String(extra.streak)};
    const fieldPaths = ["lastSeen","email","displayName","photoURL",...Object.keys(extraFields)].map(f=>`updateMask.fieldPaths=${f}`).join("&");
    await fetch(`${FB_FS}/presence/${user.uid}?key=${FB_KEY}&${fieldPaths}`,{
      method:"PATCH",headers:{"Content-Type":"application/json","Authorization":`Bearer ${user.idToken}`},
      body:JSON.stringify({fields:{lastSeen:{timestampValue:new Date().toISOString()},email:{stringValue:user.email},displayName:{stringValue:user.displayName||user.email.split("@")[0]},photoURL:{stringValue:user.photoURL||""},...extraFields}})
    });
  }catch(e){console.warn("Presence error",e);}
}

export async function fbGetAdminStats(idToken) {
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
    
    // Create a map of uid -> presence data for easy lookup
    const presenceMap = {};
    allP.forEach(p => {
      const uid = p.name.split("/").pop();
      const fields = p.fields || {};
      presenceMap[uid] = {
        email: fields.email?.stringValue || "",
        displayName: fields.displayName?.stringValue || "",
        lastSeen: fields.lastSeen?.timestampValue || "",
      };
    });
    
    const online=allP.filter(p=>{const ls=p.fields?.lastSeen?.timestampValue;return ls&&new Date(ls)>twoMin;})
      .map(p=>{
        const uid = p.name.split("/").pop();
        return {
          uid,
          email:p.fields?.email?.stringValue||"",
          displayName:p.fields?.displayName?.stringValue||"",
          lastSeen:p.fields?.lastSeen?.timestampValue
        };
      });
    
    // Parse all user documents with their full data
    const allUsers=(uSnap.documents||[]).map(u=>{
      const uid = u.name.split("/").pop();
      const fields = u.fields || {};
      
      // Get email and displayName from presence data
      const presenceData = presenceMap[uid] || {};
      
      // Try to parse the data field if it exists
      let userData = { a: [], c: [], g: {} };
      try {
        const raw = fields.data?.stringValue;
        if (raw) {
          userData = JSON.parse(raw);
        }
      } catch (e) {
        console.warn("Failed to parse user data for", uid);
      }
      
      return {
        uid,
        email: presenceData.email || fields.email?.stringValue || "",
        displayName: presenceData.displayName || fields.displayName?.stringValue || "",
        fullData: userData, // Store the full parsed data
        createTime: u.createTime || "",
      };
    });
    
    const totalUsersReal = Math.max(gi(g.totalUsers), allUsers.length, allP.length);
    const today = new Date().toISOString().split("T")[0];
    const newToday = allP.filter(p=>{
      const ls=p.fields?.lastSeen?.timestampValue;
      return ls&&ls.startsWith(today);
    }).length;
    
    return{
      totalUsers:totalUsersReal,
      onlineNow:online.length,
      onlineUsers:online,
      totalAssignments:gi(g.totalAssignments),
      totalSubmitted:gi(g.totalSubmitted),
      totalClasses:gi(g.totalClasses),
      totalPoints:gi(g.totalPoints),
      newUsersToday:newToday,
      allUsers,
      allPresence: allP, // Include all presence data
    };
  }catch(e){console.warn("Admin error",e);return null;}
}

export async function fbGetUserData(uid, idToken) {
  try {
    console.log("Fetching user data for:", uid);
    
    // Try direct document access (works for own data)
    const directFetch = await fetch(`${FB_FS}/users/${uid}`, {
      headers: { "Authorization": `Bearer ${idToken}` }
    });
    
    if (!directFetch.ok) {
      console.warn("Cannot fetch user data - access denied. Use cached data from admin stats instead.");
      return null;
    }
    
    const userData = await directFetch.json();
    
    // Fetch presence data
    let presenceData = null;
    try {
      const presenceFetch = await fetch(`${FB_FS}/presence/${uid}`, {
        headers: { "Authorization": `Bearer ${idToken}` }
      });
      if (presenceFetch.ok) {
        presenceData = await presenceFetch.json();
      }
    } catch (e) {
      console.warn("Presence data not available");
    }

    if (!userData?.fields) {
      console.warn("No user data found for uid:", uid);
      return null;
    }

    // Parse the JSON string stored in the data field
    const raw = userData.fields?.data?.stringValue;
    if (!raw) {
      console.warn("No data stringValue found for uid:", uid);
      const pf = presenceData?.fields || {};
      return {
        uid,
        email: pf.email?.stringValue || "",
        displayName: pf.displayName?.stringValue || "",
        lastSeen: pf.lastSeen?.timestampValue || "",
        createdAt: userData.createTime || "",
        assignments: [],
        classes: [],
        game: { points: 0, streak: 0, lastStreakDate: "", dailyCount: 0, owned: [] },
        canvasUrl: "",
      };
    }

    const data = JSON.parse(raw);
    const pf = presenceData?.fields || {};
    
    // Parse assignments
    const assignments = (data.a || []).map(a => ({
      id: a.id || "",
      title: a.title || "",
      subject: a.subject || "",
      dueDate: a.dueDate || "",
      priority: a.priority || "medium",
      progress: a.progress || 0,
      notes: a.notes || "",
      grade: a.grade != null ? a.grade : null,
      gradeRaw: a.gradeRaw || null,
    }));

    // Parse classes
    const classes = (data.c || []).map(c => ({
      name: c.name || "",
      room: c.room || "",
      startTime: c.startTime || "",
      endTime: c.endTime || "",
      days: c.days || [],
      color: c.color || "#6366f1",
    }));

    // Parse game data
    const game = data.g || {};
    const gameData = {
      points: game.points || 0,
      streak: game.streak || 0,
      lastStreakDate: game.lastStreakDate || "",
      dailyCount: game.dailyCount || 0,
      owned: game.owned || [],
    };

    return {
      uid,
      email: pf.email?.stringValue || "",
      displayName: pf.displayName?.stringValue || "",
      lastSeen: pf.lastSeen?.timestampValue || "",
      createdAt: userData.createTime || "",
      assignments,
      classes,
      game: gameData,
      canvasUrl: data.cv?.url || "",
    };
  } catch (e) {
    console.error("Error fetching user data:", e);
    return null;
  }
}
