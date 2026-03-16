import React from 'react';
import { getBuddyStage } from '../../utils/helpers';
import { BUDDY_STAGES, SHOP_ITEMS } from '../../constants';
import BuddyCreature from '../shared/BuddyCreature';

function BuddyTab({ game, todayCnt }) {
  const st = getBuddyStage(game.streak);
  const info = BUDDY_STAGES[st];
  const pct = info.next ? Math.min(100, Math.round(((game.streak - info.min) / (info.next - info.min)) * 100)) : 100;
  const eq = game.equipped || {};
  const eqItems = Object.values(eq).filter(Boolean).map(id => SHOP_ITEMS.find(i => i.id === id)).filter(Boolean);

  return (
    <div>
      <div className="buddy-shell">
        <div className="buddy-stage-name">{info.name}</div>
        <div className="buddy-stage-desc">{info.desc}</div>
        <div className="buddy-wrap"><div className="buddy-bounce" style={{width:"100%",height:"100%"}}><BuddyCreature stage={st} eq={eq}/></div></div>
        {eqItems.length>0&&<div className="eq-row">{eqItems.map(it=><span key={it.id} className="eq-chip">{it.emoji} {it.name}</span>)}</div>}
        {info.next&&<div style={{marginTop:14}}><div className="bplbl"><span>Next: {BUDDY_STAGES[st+1].name}</span><span>{game.streak}/{info.next} days</span></div><div className="bpbar"><div className="bpfill" style={{width:pct+"%"}}/></div></div>}
        {!info.next&&<div style={{textAlign:"center",marginTop:12,fontSize:".8rem",color:"#F59E0B",fontWeight:700}}>Legendary status achieved!</div>}
      </div>
      <div className="bstat-row">
        <div className="stat"><div className="sacc" style={{background:"#f59e0b"}}/><div className="stat-n" style={{fontSize:"1.4rem",display:"flex",alignItems:"center",gap:4}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          {game.points}
        </div><div className="stat-l">Points</div></div>
        <div className="stat"><div className="sacc" style={{background:"#ea580c"}}/><div className="stat-n" style={{fontSize:"1.4rem",display:"flex",alignItems:"center",gap:4}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
          </svg>
          {game.streak}
        </div><div className="stat-l">Streak</div></div>
        <div className="stat"><div className="sacc" style={{background:"#8b5cf6"}}/><div className="stat-n" style={{fontSize:"1.4rem"}}>{st}/5</div><div className="stat-l">Stage</div></div>
      </div>
      <div className="quest-card">
        <div className="quest-title" style={{display:"flex",alignItems:"center",gap:6}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
          Daily Quest
        </div>
        <div className="quest-text">Complete 3 assignments today to {game.streak>0?"extend your "+game.streak+"-day streak!":"start your streak!"}</div>
        <div className="quest-pips">
          {[0,1,2].map(n=><div key={n} className={"quest-pip"+(todayCnt>n?" lit":"")}>{todayCnt>n?"✓":""}</div>)}
          <div style={{marginLeft:10,fontSize:".78rem",color:"var(--text2)",fontWeight:600}}>{todayCnt>=3?<span style={{color:"#F59E0B",display:"flex",alignItems:"center",gap:4}}>
            +{Math.round(10+game.streak*4)}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            earned!
          </span>:<span>{3-todayCnt} more</span>}</div>
        </div>
      </div>
      <div className="pts-how">
        <div style={{fontSize:".68rem",fontWeight:800,color:"var(--text3)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:10}}>How Points Work</div>
        <div className="pts-how-row"><span style={{display:"flex",alignItems:"center",gap:4}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Complete an assignment
        </span><span className="pts-how-amt" style={{display:"flex",alignItems:"center",gap:3}}>
          +15
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </span></div>
        <div style={{height:1,background:"var(--border)",margin:"6px 0"}}/>
        <div className="pts-how-row"><span style={{display:"flex",alignItems:"center",gap:4}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
          </svg>
          Daily streak bonus (3 per day)
        </span><span className="pts-how-amt" style={{display:"flex",alignItems:"center",gap:3}}>
          +{Math.round(10+game.streak*4)}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </span></div>
        <div style={{height:1,background:"var(--border)",margin:"6px 0"}}/>
        <div style={{fontSize:".72rem",color:"var(--text4)",lineHeight:1.5}}>Higher streaks = bigger bonuses!</div>
      </div>
    </div>
  );
}

export default BuddyTab;