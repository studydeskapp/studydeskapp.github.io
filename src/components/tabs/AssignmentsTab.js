import React from 'react';
import { subjectColor } from '../../utils/helpers';

function AssignmentsTab({ 
  sortedA, 
  subjects, 
  filter, 
  setFilter, 
  classes, 
  setSubjMode, 
  setAddingA, 
  ACard 
}) {
  const pending = sortedA.filter(a => a.progress < 100);
  const done = sortedA.filter(a => a.progress >= 100);

  return (
    <div>
      <div className="sec-hd">
        <div className="sec-t">Assignments</div>
        <div style={{display:"flex",gap:7,alignItems:"center"}}>
          <span style={{fontSize:".75rem",color:"var(--text3)",fontWeight:600}}>{pending.length} pending · {done.length} done</span>
          <button className="btn btn-p btn-sm" onClick={()=>{setSubjMode("select");setAddingA(true);}}>＋ Add</button>
        </div>
      </div>
      {subjects.length>0&&<div className="sfilt">
        {["all",...subjects].map(s=>(
          <button key={s} className="sfbtn" onClick={()=>setFilter(s)}
            style={filter===s?{background:s==="all"?"var(--accent)":subjectColor(s,classes),borderColor:s==="all"?"var(--accent)":subjectColor(s,classes),color:"#fff"}:{}}>
            {s==="all"?"✦ All":s}
          </button>
        ))}
      </div>}
      {pending.length>0&&(
        <div style={{marginBottom:22}}>
          <div className="sec-lbl">Pending — {pending.length}</div>
          <div className="alist">{pending.map(a=><ACard key={a.id} a={a}/>)}</div>
        </div>
      )}
      {done.length>0&&(
        <div>
          <div className="sec-lbl">Completed — {done.length}</div>
          <div className="alist" style={{opacity:.55}}>{done.map(a=><ACard key={a.id} a={a}/>)}</div>
        </div>
      )}
      {pending.length===0&&done.length===0&&(
        <div className="empty" style={{background:"var(--card)",border:"1.5px dashed var(--border2)",borderRadius:18,padding:"52px 20px"}}>
          <div className="empty-i">📝</div>
          <div className="empty-t">No assignments yet</div>
          <div style={{fontSize:".78rem",color:"var(--text4)",marginTop:8,marginBottom:18}}>Add assignments manually or import from Canvas or Google Slides</div>
          <button className="btn btn-p" onClick={()=>{setSubjMode("select");setAddingA(true);}}>＋ Add First Assignment</button>
        </div>
      )}
    </div>
  );
}

export default AssignmentsTab;