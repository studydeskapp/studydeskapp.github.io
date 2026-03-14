import React from 'react';
import { subjectColor } from '../../utils/helpers';
import EmptyState from '../shared/EmptyState';

function AssignmentsTab({ 
  sortedA, 
  subjects, 
  filter, 
  setFilter, 
  classes, 
  setSubjMode, 
  setAddingA, 
  ACard,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  multiSelectMode,
  setMultiSelectMode,
  selectedAssignments,
  toggleAssignmentSelection
}) {
  const pending = sortedA.filter(a => a.progress < 100);
  const done = sortedA.filter(a => a.progress >= 100);

  return (
    <div>
      <div className="sec-hd">
        <div className="sec-t">Assignments</div>
        <div style={{display:"flex",gap:7,alignItems:"center"}}>
          <span style={{fontSize:".75rem",color:"var(--text3)",fontWeight:600}}>{pending.length} pending · {done.length} done</span>
          <button 
            className="btn btn-sm" 
            onClick={()=>{setMultiSelectMode(!multiSelectMode);}}
            style={multiSelectMode?{background:"var(--accent)",color:"#fff",borderColor:"var(--accent)"}:{}}
            title="Multi-select mode (M)"
          >
            {multiSelectMode ? "✓ Select" : "☐ Select"}
          </button>
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
      {/* Sort Controls */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:".75rem",color:"var(--text3)",fontWeight:600}}>Sort by:</span>
        <button 
          className="btn btn-sm" 
          onClick={()=>setSortBy("date")}
          style={sortBy==="date"?{background:"var(--accent)",color:"#fff",borderColor:"var(--accent)"}:{}}
        >
          📅 Date
        </button>
        <button 
          className="btn btn-sm" 
          onClick={()=>setSortBy("priority")}
          style={sortBy==="priority"?{background:"var(--accent)",color:"#fff",borderColor:"var(--accent)"}:{}}
        >
          ⚡ Priority
        </button>
        <button 
          className="btn btn-sm" 
          onClick={()=>setSortOrder(sortOrder==="asc"?"desc":"asc")}
          title={sortBy==="date"?(sortOrder==="asc"?"Soonest first":"Farthest first"):(sortOrder==="asc"?"High to Low":"Low to High")}
        >
          {sortOrder==="asc"?"↑":"↓"}
        </button>
      </div>
      {pending.length>0&&(
        <div style={{marginBottom:22}}>
          <div className="sec-lbl">Pending — {pending.length}</div>
          <div className="alist">
            {pending.map(a => (
              <div key={a.id} style={{display:'flex', alignItems:'center', gap:'12px'}}>
                {multiSelectMode && (
                  <input
                    type="checkbox"
                    checked={selectedAssignments.includes(a.id)}
                    onChange={() => toggleAssignmentSelection(a.id)}
                    style={{width:'20px', height:'20px', cursor:'pointer', flexShrink:0}}
                  />
                )}
                <div style={{flex:1, minWidth:0}}>
                  <ACard a={a}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {done.length>0&&(
        <div>
          <div className="sec-lbl">Completed — {done.length}</div>
          <div className="alist" style={{opacity:.55}}>
            {done.map(a => (
              <div key={a.id} style={{display:'flex', alignItems:'center', gap:'12px'}}>
                {multiSelectMode && (
                  <input
                    type="checkbox"
                    checked={selectedAssignments.includes(a.id)}
                    onChange={() => toggleAssignmentSelection(a.id)}
                    style={{width:'20px', height:'20px', cursor:'pointer', flexShrink:0}}
                  />
                )}
                <div style={{flex:1, minWidth:0}}>
                  <ACard a={a}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {pending.length===0&&done.length===0&&(
        <EmptyState
          icon="📝"
          title="No assignments yet"
          description="Add assignments manually or import from Canvas, Google Docs, or Slides"
          actionLabel="＋ Add first assignment"
          onAction={()=>{setSubjMode("select");setAddingA(true);}}
        />
      )}
    </div>
  );
}

export default AssignmentsTab;