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
        <div className="stat"><div className="sacc" style={{background:"#f59e0b"}}/><div className="stat-n" style={{fontSize:"1.4rem"}}>⭐{game.points}</div><div className="stat-l">Points</div></div>
        <div className="stat"><div className="sacc" style={{background:"#ea580c"}}/><div className="stat-n" style={{fontSize:"1.4rem"}}>🔥{game.streak}</div><div className="stat-l">Streak</div></div>
        <div className="stat"><div className="sacc" style={{background:"#8b5cf6"}}/><div className="stat-n" style={{fontSize:"1.4rem"}}>{st}/5</div><div className="stat-l">Stage</div></div>
      </div>
      <div className="quest-card">
        <div className="quest-title">📋 Daily Quest</div>
        <div className="quest-text">Complete 3 assignments today to {game.streak>0?"extend your "+game.streak+"-day streak!":"start your streak!"}</div>
        <div className="quest-pips">
          {[0,1,2].map(n=><div key={n} className={"quest-pip"+(todayCnt>n?" lit":"")}>{todayCnt>n?"✓":""}</div>)}
          <div style={{marginLeft:10,fontSize:".78rem",color:"var(--text2)",fontWeight:600}}>{todayCnt>=3?<span style={{color:"#F59E0B"}}>+{Math.round(10+game.streak*4)} ⭐ earned!</span>:<span>{3-todayCnt} more</span>}</div>
        </div>
      </div>
      <div className="pts-how">
        <div style={{fontSize:".68rem",fontWeight:800,color:"var(--text3)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:10}}>How Points Work</div>
        <div className="pts-how-row"><span>✅ Complete an assignment</span><span className="pts-how-amt">+15 ⭐</span></div>
        <div style={{height:1,background:"var(--border)",margin:"6px 0"}}/>
        <div className="pts-how-row"><span>🔥 Daily streak bonus (3 per day)</span><span className="pts-how-amt">+{Math.round(10+game.streak*4)} ⭐</span></div>
        <div style={{height:1,background:"var(--border)",margin:"6px 0"}}/>
        <div style={{fontSize:".72rem",color:"var(--text4)",lineHeight:1.5}}>Higher streaks = bigger bonuses!</div>
      </div>
    </div>
  );
}

export default BuddyTab;