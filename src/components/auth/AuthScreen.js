import React, { useState, useRef } from 'react';
import { 
  fbSignIn, 
  fbSignUp, 
  fbGoogleSignIn, 
  fbResetPassword, 
  fbSendVerificationEmail, 
  fbCheckEmailVerified, 
  fbDeleteAccount, 
  fbSetSession,
  fbIncrementStat,
  FB_KEY 
} from '../../utils/firebase';

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
          requestUri:window.location.origin,
          postBody:`id_token=${result.idToken}&providerId=google.com`,
          returnSecureToken:true,
          returnIdpCredential:true
        })
      });
      const d = await r.json();
      if(d.error) throw new Error(d.error.message);
      const u={
        uid:d.localId,
        email:d.email,
        displayName:d.displayName||null,
        idToken:d.idToken,
        refreshToken:d.refreshToken,
        tokenExpiry: Date.now() + (parseInt(d.expiresIn) * 1000),
        photoURL:d.photoUrl||null
      };
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
        <div style={{width:56,height:56,borderRadius:16,overflow:"hidden",margin:"0 auto 16px"}}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
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

export default AuthScreen;
