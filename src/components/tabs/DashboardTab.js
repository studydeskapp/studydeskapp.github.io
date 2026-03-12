import React from 'react';
import { fmt12, todayAbbr, daysUntil } from '../../utils/helpers';

function DashboardTab({ 
  assignments, 
  classes, 
  overdue, 
  dueToday, 
  completed, 
  upcoming, 
  todayC, 
  todayCnt, 
  game, 
  ACard 
}) {
  return (
    <div className="tab-content">
      <div className="stats">
        <div className="stat"><div className="sacc" style={{background:"#6366f1"}}/><div className="stat-ico">📝</div><div className="stat-n">{assignments.filter(a=>a.progress<100).length}</div><div className="stat-l">Pending</div></div>
        <div className="stat" style={{borderColor:overdue.length?"#fca5a5":""}}><div className="sacc" style={{background:overdue.length?"#ef4444":"#10b981"}}/><div className="stat-ico">⚠️</div><div className="stat-n" style={{color:overdue.length?"#ef4444":""}}>{overdue.length}</div><div className="stat-l">Overdue</div></div>
        <div className="stat"><div className="sacc" style={{background:"#f59e0b"}}/><div className="stat-ico">📅</div><div className="stat-n">{dueToday.length}</div><div className="stat-l">Due Today</div></div>
        <div className="stat"><div className="sacc" style={{background:"#10b981"}}/><div className="stat-ico">✅</div><div className="stat-n">{completed.length}</div><div className="stat-l">Done</div></div>
        <div className="stat"><div className="sacc" style={{background:"#8b5cf6"}}/><div className="stat-ico">🏫</div><div className="stat-n">{new Set(classes.map(c=>c.name)).size}</div><div className="stat-l">Classes</div></div>
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
              return <ACard key={a.id} a={a} compact/>;
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
  );
}

export default DashboardTab;