import React, { useState } from 'react';
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
  toggleAssignmentSelection,
  assignments,
  setAssignments
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  // Filter by search query
  const filteredA = sortedA.filter(a => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      a.title?.toLowerCase().includes(query) ||
      a.subject?.toLowerCase().includes(query) ||
      a.notes?.toLowerCase().includes(query)
    );
  });

  const pending = filteredA.filter(a => a.progress < 100);
  const done = filteredA.filter(a => a.progress >= 100);

  // Drag and drop handlers
  const handleDragStart = (e, assignment) => {
    setDraggedItem(assignment);
    e.dataTransfer.effectAllowed = 'move';
    
    // Create a custom drag image of the entire assignment card
    const dragImage = e.currentTarget.closest('[data-assignment-card]');
    if (dragImage) {
      // Clone the element to use as drag image
      const clone = dragImage.cloneNode(true);
      clone.style.position = 'absolute';
      clone.style.top = '-9999px';
      clone.style.opacity = '0.8';
      clone.style.width = dragImage.offsetWidth + 'px';
      document.body.appendChild(clone);
      
      e.dataTransfer.setDragImage(clone, dragImage.offsetWidth / 2, 20);
      
      // Remove clone after drag starts
      setTimeout(() => document.body.removeChild(clone), 0);
    }
    
    e.currentTarget.closest('[data-assignment-card]').style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    const card = e.currentTarget.closest('[data-assignment-card]');
    if (card) card.style.opacity = '1';
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, assignment) => {
    e.preventDefault();
    if (draggedItem && draggedItem.id !== assignment.id) {
      setDragOverItem(assignment.id);
    }
  };

  const handleDrop = (e, targetAssignment) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === targetAssignment.id) return;

    // Reorder assignments - add timestamp to preserve order
    const allAssignments = [...assignments];
    const draggedIndex = allAssignments.findIndex(a => a.id === draggedItem.id);
    const targetIndex = allAssignments.findIndex(a => a.id === targetAssignment.id);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Remove dragged item and insert at target position
    const [removed] = allAssignments.splice(draggedIndex, 1);
    allAssignments.splice(targetIndex, 0, removed);

    // Add a sortOrder field to maintain custom order
    const reorderedAssignments = allAssignments.map((a, index) => ({
      ...a,
      customOrder: index
    }));

    setAssignments(reorderedAssignments);
    setDraggedItem(null);
    setDragOverItem(null);
  };

  // Quick edit handlers
  const handleDoubleClick = (assignment) => {
    setEditingId(assignment.id);
    setEditTitle(assignment.title);
  };

  const handleEditSave = (assignmentId) => {
    if (editTitle.trim()) {
      setAssignments(prev => prev.map(a => 
        a.id === assignmentId ? { ...a, title: editTitle.trim() } : a
      ));
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleEditKeyDown = (e, assignmentId) => {
    if (e.key === 'Enter') {
      handleEditSave(assignmentId);
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

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

      {/* Search Bar */}
      <div style={{marginBottom:16}}>
        <input
          type="text"
          placeholder="Search assignments by title, subject, or notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width:'100%',
            padding:'10px 14px',
            border:'1px solid var(--border)',
            borderRadius:'8px',
            fontSize:'.875rem',
            background:'var(--bg2)',
            color:'var(--text1)',
            outline:'none',
            transition:'border-color 0.2s'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
        />
      </div>

      {subjects.length>0&&<div className="sfilt">
        {["all",...subjects].map(s=>(
          <button key={s} className="sfbtn" onClick={()=>setFilter(s)}
            style={filter===s?{background:s==="all"?"var(--accent)":subjectColor(s,classes),borderColor:s==="all"?"var(--accent)":subjectColor(s,classes),color:"#fff"}:{}}>
            {s==="all"?"All":s}
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight:4,verticalAlign:"middle"}}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Date
        </button>
        <button 
          className="btn btn-sm" 
          onClick={()=>setSortBy("priority")}
          style={sortBy==="priority"?{background:"var(--accent)",color:"#fff",borderColor:"var(--accent)"}:{}}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight:4,verticalAlign:"middle"}}>
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          Priority
        </button>
        <button 
          className="btn btn-sm" 
          onClick={()=>setSortOrder(sortOrder==="asc"?"desc":"asc")}
          title={sortBy==="date"?(sortOrder==="asc"?"Soonest first":"Farthest first"):(sortOrder==="asc"?"High to Low":"Low to High")}
        >
          {sortOrder==="asc"?"↑":"↓"}
        </button>
        <span style={{fontSize:".75rem",color:"var(--text3)",marginLeft:8}}>💡 Tip: Use ⋮⋮ handle to reorder, Ctrl+Click to quick edit</span>
      </div>
      {pending.length>0&&(
        <div style={{marginBottom:22}}>
          <div className="sec-lbl">Pending — {pending.length}</div>
          <div className="alist">
            {pending.map(a => (
              <div 
                key={a.id}
                data-assignment-card
                style={{
                  display:'flex', 
                  alignItems:'center', 
                  gap:'12px',
                  border: dragOverItem === a.id ? '2px dashed var(--accent)' : 'none',
                  borderRadius: '8px',
                  transition: 'border 0.2s, opacity 0.2s',
                  padding: '4px'
                }}
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(e, a)}
                onDrop={(e) => handleDrop(e, a)}
              >
                {/* Drag Handle */}
                {!multiSelectMode && !editingId && (
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, a)}
                    onDragEnd={handleDragEnd}
                    style={{
                      cursor: 'grab',
                      padding: '8px 4px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
                      flexShrink: 0
                    }}
                    title="Drag to reorder"
                  >
                    <div style={{display: 'flex', gap: '3px'}}>
                      <div style={{width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text4)'}}></div>
                      <div style={{width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text4)'}}></div>
                    </div>
                    <div style={{display: 'flex', gap: '3px'}}>
                      <div style={{width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text4)'}}></div>
                      <div style={{width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text4)'}}></div>
                    </div>
                    <div style={{display: 'flex', gap: '3px'}}>
                      <div style={{width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text4)'}}></div>
                      <div style={{width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text4)'}}></div>
                    </div>
                  </div>
                )}
                
                {multiSelectMode && (
                  <input
                    type="checkbox"
                    checked={selectedAssignments.includes(a.id)}
                    onChange={() => toggleAssignmentSelection(a.id)}
                    style={{width:'20px', height:'20px', cursor:'pointer', flexShrink:0}}
                  />
                )}
                
                <div 
                  style={{flex:1, minWidth:0}}
                  onClickCapture={(e) => {
                    if (e.ctrlKey && !multiSelectMode && !editingId && !e.target.closest('button') && !e.target.closest('input')) {
                      e.stopPropagation();
                      e.preventDefault();
                      handleDoubleClick(a);
                    }
                  }}
                >
                  {editingId === a.id ? (
                    <div style={{padding:'12px', background:'var(--bg2)', borderRadius:'8px', border:'2px solid var(--accent)'}}>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => handleEditKeyDown(e, a.id)}
                        onBlur={() => handleEditSave(a.id)}
                        autoFocus
                        style={{
                          width:'100%',
                          padding:'8px',
                          border:'1px solid var(--border)',
                          borderRadius:'6px',
                          fontSize:'.875rem',
                          background:'var(--bg1)',
                          color:'var(--text1)'
                        }}
                      />
                      <div style={{marginTop:8, fontSize:'.75rem', color:'var(--text3)'}}>
                        Press Enter to save, Esc to cancel
                      </div>
                    </div>
                  ) : (
                    <ACard a={a}/>
                  )}
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
              <div 
                key={a.id}
                data-assignment-card
                style={{
                  display:'flex', 
                  alignItems:'center', 
                  gap:'12px',
                  border: dragOverItem === a.id ? '2px dashed var(--accent)' : 'none',
                  borderRadius: '8px',
                  transition: 'border 0.2s, opacity 0.2s',
                  padding: '4px'
                }}
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(e, a)}
                onDrop={(e) => handleDrop(e, a)}
              >
                {/* Drag Handle */}
                {!multiSelectMode && !editingId && (
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, a)}
                    onDragEnd={handleDragEnd}
                    style={{
                      cursor: 'grab',
                      padding: '8px 4px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
                      flexShrink: 0
                    }}
                    title="Drag to reorder"
                  >
                    <div style={{display: 'flex', gap: '3px'}}>
                      <div style={{width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text4)'}}></div>
                      <div style={{width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text4)'}}></div>
                    </div>
                    <div style={{display: 'flex', gap: '3px'}}>
                      <div style={{width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text4)'}}></div>
                      <div style={{width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text4)'}}></div>
                    </div>
                    <div style={{display: 'flex', gap: '3px'}}>
                      <div style={{width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text4)'}}></div>
                      <div style={{width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text4)'}}></div>
                    </div>
                  </div>
                )}
                
                {multiSelectMode && (
                  <input
                    type="checkbox"
                    checked={selectedAssignments.includes(a.id)}
                    onChange={() => toggleAssignmentSelection(a.id)}
                    style={{width:'20px', height:'20px', cursor:'pointer', flexShrink:0}}
                  />
                )}
                
                <div 
                  style={{flex:1, minWidth:0}}
                  onClickCapture={(e) => {
                    if (e.ctrlKey && !multiSelectMode && !editingId && !e.target.closest('button') && !e.target.closest('input')) {
                      e.stopPropagation();
                      e.preventDefault();
                      handleDoubleClick(a);
                    }
                  }}
                >
                  {editingId === a.id ? (
                    <div style={{padding:'12px', background:'var(--bg2)', borderRadius:'8px', border:'2px solid var(--accent)'}}>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => handleEditKeyDown(e, a.id)}
                        onBlur={() => handleEditSave(a.id)}
                        autoFocus
                        style={{
                          width:'100%',
                          padding:'8px',
                          border:'1px solid var(--border)',
                          borderRadius:'6px',
                          fontSize:'.875rem',
                          background:'var(--bg1)',
                          color:'var(--text1)'
                        }}
                      />
                      <div style={{marginTop:8, fontSize:'.75rem', color:'var(--text3)'}}>
                        Press Enter to save, Esc to cancel
                      </div>
                    </div>
                  ) : (
                    <ACard a={a}/>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {pending.length===0&&done.length===0&&(
        <EmptyState
          icon={<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>}
          title={searchQuery ? "No matching assignments" : "No assignments yet"}
          description={searchQuery ? "Try a different search term" : "Add assignments manually or import from Canvas, Google Docs, or Slides"}
          actionLabel="＋ Add first assignment"
          onAction={()=>{setSubjMode("select");setAddingA(true);}}
        />
      )}
    </div>
  );
}

export default AssignmentsTab;