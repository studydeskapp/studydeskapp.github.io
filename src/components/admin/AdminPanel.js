import React, { useState, useEffect } from 'react';
import { fbGetAdminStats, fbAdminDeleteUserData } from '../../utils/firebase';

const ADMIN_PASS = "studydesk2026";

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

export default AdminPanel;
