import React, { useState, useEffect } from 'react';
import { fbGetAdminStats, fbAdminDeleteUserData, fbGetUserData } from '../../utils/firebase';

const ADMIN_PASS = "studydesk2026";

function AdminPanel({user, onClose, inline=false}){
  const [pass, setPass] = useState("");
  const [authed, setAuthed] = useState(inline);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setPassErr] = useState("");
  const [deletingUser, setDeletingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailData, setUserDetailData] = useState(null);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [darkMode] = useState(()=>{try{return localStorage.getItem("sd-dark")==="1";}catch{return false;}});

  const bg=darkMode?"#0F1117":"#F5F2EC", card=darkMode?"#161921":"#fff", bd=darkMode?"#262B3C":"#E2DDD6";
  const txt=darkMode?"#DDE2F5":"#1B1F3B", txt2=darkMode?"#B8BFDB":"#4A4F6B", txt3=darkMode?"#5C6480":"#888", bg3=darkMode?"#1C1F2B":"#F0EDE7";
  const sh=darkMode?"rgba(0,0,0,.5)":"rgba(27,31,59,.14)";
  const accent="#5B8DEE";

  async function loadStats(){
    setLoading(true);
    const s=await fbGetAdminStats(user.idToken);
    setStats(s);setLoading(false);
  }
  
  async function loadUserDetail(uid){
    setLoadingUserDetail(true);
    
    // First try to get data from the cached stats
    if (stats?.allUsers) {
      const cachedUser = stats.allUsers.find(u => u.uid === uid);
      if (cachedUser?.fullData) {
        console.log("Using cached user data from stats");
        
        // Find presence data
        const presenceDoc = stats.allPresence?.find(p => p.name.endsWith(`/${uid}`));
        const pf = presenceDoc?.fields || {};
        
        // Parse the cached data
        const data = cachedUser.fullData;
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

        const classes = (data.c || []).map(c => ({
          name: c.name || "",
          room: c.room || "",
          startTime: c.startTime || "",
          endTime: c.endTime || "",
          days: c.days || [],
          color: c.color || "#6366f1",
        }));

        const game = data.g || {};
        const gameData = {
          points: game.points || 0,
          streak: game.streak || 0,
          lastStreakDate: game.lastStreakDate || "",
          dailyCount: game.dailyCount || 0,
          owned: game.owned || [],
        };

        setUserDetailData({
          uid,
          email: pf.email?.stringValue || cachedUser.email || "",
          displayName: pf.displayName?.stringValue || cachedUser.displayName || "",
          lastSeen: pf.lastSeen?.timestampValue || "",
          createdAt: cachedUser.createTime || "",
          assignments,
          classes,
          game: gameData,
          canvasUrl: data.cv?.url || "",
        });
        
        setLoadingUserDetail(false);
        return;
      }
    }
    
    // Fallback to API call if not in cache
    const data = await fbGetUserData(uid, user.idToken);
    setUserDetailData(data);
    setLoadingUserDetail(false);
  }
  
  useEffect(()=>{ if(inline&&user) loadStats(); },[]);
  
  useEffect(()=>{
    if(selectedUser){
      loadUserDetail(selectedUser.uid);
    } else {
      setUserDetailData(null);
    }
  },[selectedUser]);

  function tryLogin(){
    if(pass===ADMIN_PASS){setAuthed(true);loadStats();}
    else setPassErr("Wrong password.");
  }

  const completionRate = stats && stats.totalAssignments>0
    ? Math.round((stats.totalSubmitted/stats.totalAssignments)*100) : 0;

  const STAT_CARDS=[
    {label:"Total Users",value:stats?.totalUsers??"-",icon:"👤",color:"#6366f1",gradient:"linear-gradient(135deg, #6366f1, #8b5cf6)"},
    {label:"Online Now",value:stats?.onlineNow??"-",icon:"🟢",color:"#10b981",gradient:"linear-gradient(135deg, #10b981, #14b8a6)"},
    {label:"New Today",value:stats?.newUsersToday??"-",icon:"✨",color:"#f59e0b",gradient:"linear-gradient(135deg, #f59e0b, #f97316)"},
    {label:"Assignments",value:stats?.totalAssignments??"-",icon:"📝",color:"#3b82f6",gradient:"linear-gradient(135deg, #3b82f6, #6366f1)"},
    {label:"Submitted",value:stats?.totalSubmitted??"-",icon:"✅",color:"#16a34a",gradient:"linear-gradient(135deg, #16a34a, #10b981)"},
    {label:"Completion",value:stats?completionRate+"%":"-",icon:"📊",color:"#8b5cf6",gradient:"linear-gradient(135deg, #8b5cf6, #a855f7)"},
    {label:"Classes",value:stats?.totalClasses??"-",icon:"🏫",color:"#ec4899",gradient:"linear-gradient(135deg, #ec4899, #f43f5e)"},
    {label:"Total Points",value:stats?.totalPoints??"-",icon:"⭐",color:"#f97316",gradient:"linear-gradient(135deg, #f97316, #fb923c)"},
  ];

  // Filter users based on search
  const filteredUsers = stats?.allUsers?.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.displayName||"").toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // User detail modal
  const UserDetailModal = () => {
    if(!selectedUser) return null;
    
    const pending = userDetailData?.assignments?.filter(a => a.progress < 100) || [];
    const completed = userDetailData?.assignments?.filter(a => a.progress >= 100) || [];
    const avgGrade = userDetailData?.assignments?.filter(a => a.grade != null).reduce((sum, a, _, arr) => 
      sum + a.grade / arr.length, 0) || 0;
    
    return (
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:10000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(6px)"}}
        onClick={e=>{if(e.target===e.currentTarget)setSelectedUser(null);}}>
        <div style={{background:card,borderRadius:24,width:"100%",maxWidth:900,maxHeight:"90vh",overflow:"hidden",border:`1.5px solid ${bd}`,boxShadow:`0 32px 80px ${sh}`,display:"flex",flexDirection:"column"}}>
          
          {/* Header */}
          <div style={{padding:"24px 28px",borderBottom:`1.5px solid ${bd}`,background:bg3}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <div style={{width:56,height:56,borderRadius:"50%",background:`linear-gradient(135deg,${accent},#8b5cf6)`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:"1.4rem",boxShadow:`0 4px 12px ${accent}40`}}>
                  {(selectedUser.displayName||selectedUser.email||"?")[0].toUpperCase()}
                </div>
                <div>
                  <div style={{fontFamily:"'Fraunces',serif",fontSize:"1.3rem",fontWeight:700,color:txt}}>{selectedUser.displayName||selectedUser.email.split("@")[0]}</div>
                  <div style={{fontSize:".8rem",color:txt3,marginTop:2}}>{selectedUser.email}</div>
                </div>
              </div>
              <button onClick={()=>setSelectedUser(null)} style={{padding:"8px 16px",borderRadius:10,border:`1.5px solid ${bd}`,background:card,color:txt,fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:".82rem",fontWeight:600,cursor:"pointer"}}>✕ Close</button>
            </div>
          </div>

          {/* Content */}
          <div style={{flex:1,overflowY:"auto",padding:"24px 28px"}}>
            {loadingUserDetail?(
              <div style={{textAlign:"center",padding:60,color:txt3}}>
                <div style={{fontSize:"2rem",marginBottom:12}}>⏳</div>
                <div>Loading user data...</div>
              </div>
            ):!userDetailData?(
              <div style={{textAlign:"center",padding:60,color:"#ef4444"}}>
                <div style={{fontSize:"2rem",marginBottom:12}}>❌</div>
                <div>Failed to load user data</div>
              </div>
            ):(
              <>
                {/* Quick Stats */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:24}}>
                  <div style={{background:bg3,border:`1.5px solid ${bd}`,borderRadius:14,padding:"16px 18px"}}>
                    <div style={{fontSize:".7rem",fontWeight:700,color:txt3,textTransform:"uppercase",letterSpacing:".05em",marginBottom:6}}>Assignments</div>
                    <div style={{fontSize:"1.8rem",fontWeight:800,color:txt,lineHeight:1}}>{userDetailData.assignments.length}</div>
                    <div style={{fontSize:".72rem",color:txt3,marginTop:4}}>{pending.length} pending · {completed.length} done</div>
                  </div>
                  <div style={{background:bg3,border:`1.5px solid ${bd}`,borderRadius:14,padding:"16px 18px"}}>
                    <div style={{fontSize:".7rem",fontWeight:700,color:txt3,textTransform:"uppercase",letterSpacing:".05em",marginBottom:6}}>Classes</div>
                    <div style={{fontSize:"1.8rem",fontWeight:800,color:txt,lineHeight:1}}>{new Set(userDetailData.classes.map(c => c.name)).size}</div>
                    <div style={{fontSize:".72rem",color:txt3,marginTop:4}}>Scheduled courses</div>
                  </div>
                  <div style={{background:bg3,border:`1.5px solid ${bd}`,borderRadius:14,padding:"16px 18px"}}>
                    <div style={{fontSize:".7rem",fontWeight:700,color:txt3,textTransform:"uppercase",letterSpacing:".05em",marginBottom:6}}>Points</div>
                    <div style={{fontSize:"1.8rem",fontWeight:800,color:txt,lineHeight:1}}>{userDetailData.game.points}</div>
                    <div style={{fontSize:".72rem",color:txt3,marginTop:4}}>🔥 {userDetailData.game.streak} day streak</div>
                  </div>
                  {avgGrade>0&&(
                    <div style={{background:bg3,border:`1.5px solid ${bd}`,borderRadius:14,padding:"16px 18px"}}>
                      <div style={{fontSize:".7rem",fontWeight:700,color:txt3,textTransform:"uppercase",letterSpacing:".05em",marginBottom:6}}>Avg Grade</div>
                      <div style={{fontSize:"1.8rem",fontWeight:800,color:avgGrade>=90?"#16a34a":avgGrade>=80?"#3b82f6":avgGrade>=70?"#f59e0b":"#ef4444",lineHeight:1}}>{Math.round(avgGrade)}%</div>
                      <div style={{fontSize:".72rem",color:txt3,marginTop:4}}>Across all graded</div>
                    </div>
                  )}
                </div>

                {/* Account Info */}
                <div style={{background:bg3,border:`1.5px solid ${bd}`,borderRadius:16,padding:"18px 20px",marginBottom:16}}>
                  <div style={{fontWeight:700,color:txt,fontSize:".9rem",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
                    <span>📋</span> Account Information
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"140px 1fr",gap:"10px 16px",fontSize:".82rem"}}>
                    <div style={{color:txt3,fontWeight:600}}>User ID:</div>
                    <div style={{color:txt2,fontFamily:"monospace",fontSize:".75rem"}}>{userDetailData.uid}</div>
                    
                    <div style={{color:txt3,fontWeight:600}}>Email:</div>
                    <div style={{color:txt2}}>{userDetailData.email}</div>
                    
                    <div style={{color:txt3,fontWeight:600}}>Display Name:</div>
                    <div style={{color:txt2}}>{userDetailData.displayName||"—"}</div>
                    
                    <div style={{color:txt3,fontWeight:600}}>Last Seen:</div>
                    <div style={{color:txt2}}>{userDetailData.lastSeen?new Date(userDetailData.lastSeen).toLocaleString():"Never"}</div>
                    
                    <div style={{color:txt3,fontWeight:600}}>Created:</div>
                    <div style={{color:txt2}}>{userDetailData.createdAt?new Date(userDetailData.createdAt).toLocaleString():"Unknown"}</div>
                    
                    {userDetailData.canvasUrl&&(
                      <>
                        <div style={{color:txt3,fontWeight:600}}>Canvas URL:</div>
                        <div style={{color:txt2}}>{userDetailData.canvasUrl}</div>
                      </>
                    )}
                  </div>
                </div>

                {/* Classes */}
                {userDetailData.classes.length>0&&(
                  <div style={{background:bg3,border:`1.5px solid ${bd}`,borderRadius:16,padding:"18px 20px",marginBottom:16}}>
                    <div style={{fontWeight:700,color:txt,fontSize:".9rem",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
                      <span>🏫</span> Classes ({(() => {
                        // Count unique class names
                        const uniqueNames = [...new Set(userDetailData.classes.map(c => c.name))];
                        return uniqueNames.length;
                      })()})
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      {(() => {
                        // Group classes by name and combine their schedules
                        const classMap = {};
                        userDetailData.classes.forEach(c => {
                          if (!classMap[c.name]) {
                            classMap[c.name] = {
                              name: c.name,
                              color: c.color,
                              room: c.room,
                              schedules: []
                            };
                          }
                          classMap[c.name].schedules.push({
                            startTime: c.startTime,
                            endTime: c.endTime,
                            days: c.days
                          });
                        });
                        
                        return Object.values(classMap).map((c, i) => (
                          <div key={i} style={{display:"flex",alignItems:"start",gap:12,padding:"10px 14px",background:card,border:`1.5px solid ${bd}`,borderRadius:12}}>
                            <div style={{width:8,height:8,borderRadius:"50%",background:c.color,flexShrink:0,marginTop:6}}/>
                            <div style={{flex:1}}>
                              <div style={{fontSize:".85rem",fontWeight:700,color:txt,marginBottom:6}}>{c.name}</div>
                              {c.schedules.map((sched, j) => (
                                <div key={j} style={{fontSize:".72rem",color:txt3,marginTop:j>0?4:0}}>
                                  {sched.startTime} - {sched.endTime} · {sched.days.join(", ")} {c.room&&j===0&&`· Room ${c.room}`}
                                </div>
                              ))}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}

                {/* Assignments */}
                {userDetailData.assignments.length>0&&(
                  <div style={{background:bg3,border:`1.5px solid ${bd}`,borderRadius:16,padding:"18px 20px",marginBottom:16}}>
                    <div style={{fontWeight:700,color:txt,fontSize:".9rem",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
                      <span>📝</span> Assignments ({userDetailData.assignments.length})
                    </div>
                    
                    {pending.length>0&&(
                      <div style={{marginBottom:16}}>
                        <div style={{fontSize:".75rem",fontWeight:700,color:txt3,textTransform:"uppercase",letterSpacing:".05em",marginBottom:8}}>Pending ({pending.length})</div>
                        <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:300,overflowY:"auto"}}>
                          {pending.map((a,i)=>(
                            <div key={i} style={{padding:"10px 14px",background:card,border:`1.5px solid ${bd}`,borderRadius:10}}>
                              <div style={{display:"flex",alignItems:"start",justifyContent:"space-between",gap:10}}>
                                <div style={{flex:1}}>
                                  <div style={{fontSize:".82rem",fontWeight:700,color:txt}}>{a.title}</div>
                                  <div style={{fontSize:".72rem",color:txt3,marginTop:3}}>
                                    {a.subject} · {a.dueDate||"No date"} · {a.priority} priority
                                  </div>
                                </div>
                                <div style={{fontSize:".7rem",fontWeight:700,color:accent,background:darkMode?"rgba(91,141,238,.15)":"rgba(91,141,238,.1)",padding:"3px 8px",borderRadius:6,flexShrink:0}}>
                                  {a.progress}%
                                </div>
                              </div>
                              {a.notes&&<div style={{fontSize:".72rem",color:txt3,marginTop:6,fontStyle:"italic"}}>{a.notes}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {completed.length>0&&(
                      <div>
                        <div style={{fontSize:".75rem",fontWeight:700,color:txt3,textTransform:"uppercase",letterSpacing:".05em",marginBottom:8}}>Completed ({completed.length})</div>
                        <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:200,overflowY:"auto",opacity:.7}}>
                          {completed.slice(0,10).map((a,i)=>(
                            <div key={i} style={{padding:"8px 12px",background:card,border:`1.5px solid ${bd}`,borderRadius:10}}>
                              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
                                <div style={{flex:1}}>
                                  <div style={{fontSize:".78rem",fontWeight:600,color:txt,textDecoration:"line-through"}}>{a.title}</div>
                                  <div style={{fontSize:".7rem",color:txt3,marginTop:2}}>{a.subject}</div>
                                </div>
                                {a.grade!=null&&(
                                  <div style={{fontSize:".7rem",fontWeight:700,color:a.grade>=90?"#16a34a":a.grade>=80?"#3b82f6":a.grade>=70?"#f59e0b":"#ef4444",flexShrink:0}}>
                                    {a.grade}%
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                          {completed.length>10&&<div style={{fontSize:".72rem",color:txt3,textAlign:"center",padding:8}}>+ {completed.length-10} more completed</div>}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Game Data */}
                <div style={{background:bg3,border:`1.5px solid ${bd}`,borderRadius:16,padding:"18px 20px"}}>
                  <div style={{fontWeight:700,color:txt,fontSize:".9rem",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
                    <span>🎮</span> Game Progress
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    <div>
                      <div style={{fontSize:".7rem",fontWeight:700,color:txt3,textTransform:"uppercase",letterSpacing:".05em",marginBottom:4}}>Points</div>
                      <div style={{fontSize:"1.4rem",fontWeight:800,color:txt}}>⭐ {userDetailData.game.points}</div>
                    </div>
                    <div>
                      <div style={{fontSize:".7rem",fontWeight:700,color:txt3,textTransform:"uppercase",letterSpacing:".05em",marginBottom:4}}>Streak</div>
                      <div style={{fontSize:"1.4rem",fontWeight:800,color:txt}}>🔥 {userDetailData.game.streak} days</div>
                    </div>
                    <div>
                      <div style={{fontSize:".7rem",fontWeight:700,color:txt3,textTransform:"uppercase",letterSpacing:".05em",marginBottom:4}}>Daily Count</div>
                      <div style={{fontSize:"1.4rem",fontWeight:800,color:txt}}>📅 {userDetailData.game.dailyCount}</div>
                    </div>
                    <div>
                      <div style={{fontSize:".7rem",fontWeight:700,color:txt3,textTransform:"uppercase",letterSpacing:".05em",marginBottom:4}}>Items Owned</div>
                      <div style={{fontSize:"1.4rem",fontWeight:800,color:txt}}>🛍️ {userDetailData.game.owned.length}</div>
                    </div>
                  </div>
                  {userDetailData.game.lastStreakDate&&(
                    <div style={{fontSize:".72rem",color:txt3,marginTop:12,paddingTop:12,borderTop:`1px solid ${bd}`}}>
                      Last streak: {userDetailData.game.lastStreakDate}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const panelContent=(
    <div style={{background:card,borderRadius:inline?24:24,width:"100%",fontFamily:"'Plus Jakarta Sans',sans-serif",border:`1.5px solid ${bd}`,maxHeight:inline?"none":"88vh",overflow:inline?"visible":"auto",boxShadow:inline?"none":`0 32px 80px ${sh}`}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"22px 28px 18px",borderBottom:`1.5px solid ${bd}`,position:"sticky",top:0,background:card,zIndex:1,borderRadius:"24px 24px 0 0"}}>
          <div>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:"1.5rem",fontWeight:700,color:txt,display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:"1.8rem"}}>🛡️</span> Admin Dashboard
            </div>
            <div style={{fontSize:".78rem",color:txt3,marginTop:3}}>StudyDesk analytics & user management</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            {authed&&<button onClick={loadStats} style={{padding:"8px 16px",borderRadius:10,border:`1.5px solid ${bd}`,background:bg3,color:txt,fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:".8rem",fontWeight:600,cursor:"pointer",transition:"all .12s"}} onMouseEnter={e=>e.target.style.background=accent} onMouseLeave={e=>e.target.style.background=bg3}>🔄 Refresh</button>}
            <button onClick={onClose} style={{padding:"8px 16px",borderRadius:10,border:`1.5px solid ${bd}`,background:bg3,color:txt,fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:".8rem",fontWeight:600,cursor:"pointer"}}>✕ Close</button>
          </div>
        </div>

        <div style={{padding:"24px 28px"}}>
          {/* Password gate */}
          {!authed?(
            <div style={{maxWidth:360,margin:"0 auto",paddingTop:20}}>
              <div style={{textAlign:"center",marginBottom:24}}>
                <div style={{fontSize:"3rem",marginBottom:12}}>🔐</div>
                <div style={{fontSize:"1.2rem",fontWeight:700,color:txt,marginBottom:6}}>Admin Access Required</div>
                <div style={{fontSize:".82rem",color:txt3}}>Enter the admin password to continue</div>
              </div>
              <input type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&tryLogin()}
                placeholder="Enter password..." autoFocus
                style={{width:"100%",padding:"12px 16px",border:`1.5px solid ${bd}`,borderRadius:12,background:bg3,color:txt,fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:".9rem",outline:"none",marginBottom:12,boxSizing:"border-box",transition:"border .12s"}}
                onFocus={e=>e.target.style.borderColor=accent}
                onBlur={e=>e.target.style.borderColor=bd}/>
              {err&&<div style={{color:"#ef4444",fontSize:".82rem",marginBottom:12,textAlign:"center",padding:"8px 12px",background:"rgba(239,68,68,.1)",borderRadius:8}}>{err}</div>}
              <button onClick={tryLogin} style={{width:"100%",padding:"12px",borderRadius:12,border:"none",background:accent,color:"#fff",fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:".9rem",cursor:"pointer",transition:"all .12s",boxShadow:`0 4px 12px ${accent}40`}} onMouseEnter={e=>e.target.style.transform="translateY(-1px)"} onMouseLeave={e=>e.target.style.transform="translateY(0)"}>
                🔓 Unlock Dashboard
              </button>
            </div>
          ):(
            <>
              {loading?(
                <div style={{textAlign:"center",padding:60,color:txt3}}>
                  <div style={{fontSize:"2.5rem",marginBottom:16}}>⏳</div>
                  <div style={{fontSize:"1.1rem",fontWeight:600}}>Loading analytics...</div>
                </div>
              ):stats?(
                <>
                  {/* Stats grid */}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14,marginBottom:24}}>
                    {STAT_CARDS.map(sc=>(
                      <div key={sc.label} style={{background:bg3,border:`1.5px solid ${bd}`,borderRadius:16,padding:"18px 16px",position:"relative",overflow:"hidden",transition:"all .12s",cursor:"default"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 8px 20px ${sh}`;}} onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
                        <div style={{position:"absolute",top:0,right:0,width:60,height:60,background:sc.gradient,opacity:.15,borderRadius:"0 16px 0 50%"}}/>
                        <div style={{fontSize:"1.6rem",marginBottom:6}}>{sc.icon}</div>
                        <div style={{fontSize:"1.8rem",fontWeight:800,color:txt,lineHeight:1,marginBottom:6}}>{sc.value}</div>
                        <div style={{fontSize:".7rem",fontWeight:700,color:txt3,textTransform:"uppercase",letterSpacing:".05em"}}>{sc.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Progress bar: submission rate */}
                  <div style={{background:bg3,border:`1.5px solid ${bd}`,borderRadius:16,padding:"20px 22px",marginBottom:18}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                      <div style={{fontWeight:700,color:txt,fontSize:".92rem",display:"flex",alignItems:"center",gap:8}}>
                        <span>📈</span> Assignment Completion Rate
                      </div>
                      <div style={{fontWeight:800,color:"#16a34a",fontSize:"1.1rem"}}>{completionRate}%</div>
                    </div>
                    <div style={{background:bd,borderRadius:99,height:12,overflow:"hidden",boxShadow:"inset 0 2px 4px rgba(0,0,0,.1)"}}>
                      <div style={{width:completionRate+"%",height:"100%",background:"linear-gradient(90deg,#16a34a,#4ade80)",borderRadius:99,transition:"width .6s ease",boxShadow:"0 0 8px rgba(22,163,74,.4)"}}/>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:8,fontSize:".74rem",color:txt3}}>
                      <span>✅ {stats.totalSubmitted} submitted</span>
                      <span>⏳ {(stats.totalAssignments-stats.totalSubmitted)} pending</span>
                    </div>
                  </div>

                  {/* Online users */}
                  <div style={{background:bg3,border:`1.5px solid ${bd}`,borderRadius:16,padding:"20px 22px",marginBottom:18}}>
                    <div style={{fontWeight:700,color:txt,fontSize:".92rem",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
                      <span>🟢</span> Online Now ({stats.onlineNow})
                    </div>
                    {stats.onlineUsers.length===0?(
                      <div style={{color:txt3,fontSize:".82rem",textAlign:"center",padding:"20px 0",fontStyle:"italic"}}>No users active in the last 2 minutes</div>
                    ):(
                      <div style={{display:"flex",flexDirection:"column",gap:10}}>
                        {stats.onlineUsers.map((u,i)=>(
                          <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:card,border:`1.5px solid ${bd}`,borderRadius:12,cursor:"pointer",transition:"all .12s"}} onClick={()=>setSelectedUser(u)} onMouseEnter={e=>{e.currentTarget.style.background=bg3;e.currentTarget.style.borderColor=accent;}} onMouseLeave={e=>{e.currentTarget.style.background=card;e.currentTarget.style.borderColor=bd;}}>
                            <div style={{width:10,height:10,borderRadius:"50%",background:"#10b981",flexShrink:0,boxShadow:"0 0 8px rgba(16,185,129,.6)"}}/>
                            <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:".85rem",flexShrink:0,boxShadow:"0 2px 8px rgba(99,102,241,.3)"}}>
                              {(u.displayName||u.email||"?")[0].toUpperCase()}
                            </div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:".85rem",fontWeight:700,color:txt}}>{u.displayName||u.email.split("@")[0]}</div>
                              <div style={{fontSize:".72rem",color:txt3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{u.email}</div>
                            </div>
                            <div style={{fontSize:".7rem",color:txt3,flexShrink:0}}>→</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* All users */}
                  {stats.allUsers&&stats.allUsers.length>0&&(
                    <div style={{background:bg3,border:`1.5px solid ${bd}`,borderRadius:16,padding:"20px 22px"}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                        <div style={{fontWeight:700,color:txt,fontSize:".92rem",display:"flex",alignItems:"center",gap:8}}>
                          <span>👥</span> All Users ({filteredUsers.length})
                        </div>
                        <input 
                          type="text" 
                          placeholder="Search users..." 
                          value={searchQuery}
                          onChange={e=>setSearchQuery(e.target.value)}
                          style={{padding:"6px 12px",border:`1.5px solid ${bd}`,borderRadius:8,background:card,color:txt,fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:".78rem",outline:"none",width:200,transition:"border .12s"}}
                          onFocus={e=>e.target.style.borderColor=accent}
                          onBlur={e=>e.target.style.borderColor=bd}
                        />
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:400,overflow:"auto"}}>
                        {filteredUsers.map((u,i)=>(
                          <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:card,border:`1.5px solid ${bd}`,borderRadius:12,cursor:"pointer",transition:"all .12s"}} onClick={()=>setSelectedUser(u)} onMouseEnter={e=>{e.currentTarget.style.background=bg3;e.currentTarget.style.borderColor=accent;}} onMouseLeave={e=>{e.currentTarget.style.background=card;e.currentTarget.style.borderColor=bd;}}>
                            <div style={{width:34,height:34,borderRadius:"50%",background:"linear-gradient(135deg,#3b82f6,#6366f1)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:".8rem",flexShrink:0,boxShadow:"0 2px 8px rgba(59,130,246,.3)"}}>
                              {(u.displayName||u.email||"?")[0].toUpperCase()}
                            </div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:".82rem",fontWeight:700,color:txt,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{u.displayName||u.email.split("@")[0]}</div>
                              <div style={{fontSize:".71rem",color:txt3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{u.email}</div>
                            </div>
                            <div style={{display:"flex",gap:6,flexShrink:0}}>
                              <button
                                disabled={deletingUser===u.uid}
                                onClick={(e)=>{
                                  e.stopPropagation();
                                  if(!window.confirm(`Remove ${u.email} from StudyDesk?\n\nThis deletes their Firestore data. Their login account will remain.`)) return;
                                  setDeletingUser(u.uid);
                                  fbAdminDeleteUserData(u.uid, user.idToken).then(()=>{
                                    setStats(s=>({...s,allUsers:s.allUsers.filter(x=>x.uid!==u.uid),totalUsers:s.totalUsers-1}));
                                    setDeletingUser(null);
                                  });
                                }}
                                style={{padding:"5px 11px",borderRadius:8,border:"1.5px solid #fca5a5",background:deletingUser===u.uid?"#fca5a5":"#fef2f2",color:"#dc2626",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:".7rem",fontWeight:700,cursor:deletingUser===u.uid?"not-allowed":"pointer",flexShrink:0,transition:"all .12s"}}>
                                {deletingUser===u.uid?"...":"🗑"}
                              </button>
                              <div style={{fontSize:".7rem",color:txt3,display:"flex",alignItems:"center"}}>→</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ):(
                <div style={{textAlign:"center",padding:60,color:"#ef4444"}}>
                  <div style={{fontSize:"2.5rem",marginBottom:16}}>❌</div>
                  <div style={{fontSize:"1.1rem",fontWeight:600}}>Failed to load stats</div>
                  <div style={{fontSize:".82rem",marginTop:8,color:txt3}}>Check your connection and try again</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
  );
  
  if(inline) return <>{panelContent}{selectedUser&&<UserDetailModal/>}</>;
  
  return(
    <>
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(6px)"}}
        onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
        <div style={{maxWidth:800,width:"100%"}}>
          {panelContent}
        </div>
      </div>
      {selectedUser&&<UserDetailModal/>}
    </>
  );
}

export default AdminPanel;
