import React from 'react';
import { subjectColor } from '../../utils/helpers';

function GradesTab({ assignments, classes, expandedGradeClass, setExpandedGradeClass }) {
  // Build per-class grade data from assignments that have a grade
  const graded = assignments.filter(a => a.grade != null);
  const byClass = {};
  
  graded.forEach(a => {
    if (!byClass[a.subject]) byClass[a.subject] = [];
    byClass[a.subject].push(a);
  });
  
  // Calculate class averages
  const classStats = Object.entries(byClass).map(([subject, assignments]) => {
    const avg = Math.round(assignments.reduce((sum, a) => sum + a.grade, 0) / assignments.length);
    const color = subjectColor(subject, classes);
    return { subject, assignments, avg, color, count: assignments.length };
  }).sort((a, b) => b.avg - a.avg);
  
  return (
    <div>
      <div className="sec-hd">
        <div className="sec-t">Grades</div>
        <span style={{fontSize:".75rem",color:"var(--text3)",fontWeight:600}}>
          {graded.length} graded • {Object.keys(byClass).length} classes
        </span>
      </div>
      
      {graded.length === 0 ? (
        <div className="empty" style={{background:"var(--card)",border:"1.5px dashed var(--border2)",borderRadius:18,padding:"52px 20px"}}>
          <div className="empty-i">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 20V10"/>
              <path d="M12 20V4"/>
              <path d="M6 20v-6"/>
            </svg>
          </div>
          <div className="empty-t">No grades yet</div>
          <div style={{fontSize:".78rem",color:"var(--text4)",marginTop:8}}>Grades will appear here when you add them to assignments or sync from Canvas</div>
        </div>
      ) : (
        <div className="grades-overview">
          {classStats.map(({ subject, assignments, avg, color, count }) => (
            <div key={subject} className="grade-class-card" style={{background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:16,padding:20,marginBottom:16}}>
              <div className="grade-class-header" onClick={() => setExpandedGradeClass(expandedGradeClass === subject ? null : subject)} style={{cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:12,height:12,borderRadius:"50%",background:color,flexShrink:0}}/>
                  <div>
                    <div style={{fontWeight:700,color:"var(--text)",fontSize:".95rem"}}>{subject}</div>
                    <div style={{fontSize:".75rem",color:"var(--text3)",marginTop:2}}>{count} assignment{count !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:"1.4rem",fontWeight:800,color:avg >= 90 ? "#16a34a" : avg >= 80 ? "#2563eb" : avg >= 70 ? "#d97706" : "#dc2626"}}>{avg}%</div>
                    <div style={{fontSize:".7rem",color:"var(--text4)"}}>average</div>
                  </div>
                  <div style={{fontSize:"1.2rem",color:"var(--text3)",transform:expandedGradeClass === subject ? "rotate(180deg)" : "rotate(0deg)",transition:"transform 0.2s"}}>▼</div>
                </div>
              </div>
              
              {expandedGradeClass === subject && (
                <div style={{marginTop:16,paddingTop:16,borderTop:"1px solid var(--border2)"}}>
                  <div className="grade-assignments-list">
                    {assignments.sort((a, b) => new Date(b.dueDate || 0) - new Date(a.dueDate || 0)).map(assignment => (
                      <div key={assignment.id} className="grade-assignment-item" style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid var(--border2)"}}>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:600,color:"var(--text)",fontSize:".85rem"}}>{assignment.title}</div>
                          <div style={{fontSize:".75rem",color:"var(--text3)",marginTop:2}}>
                            {assignment.dueDate && new Date(assignment.dueDate).toLocaleDateString()}
                            {assignment.gradeRaw && <span style={{marginLeft:8}}>({assignment.gradeRaw})</span>}
                          </div>
                        </div>
                        <div style={{fontSize:"1.1rem",fontWeight:700,color:assignment.grade >= 90 ? "#16a34a" : assignment.grade >= 80 ? "#2563eb" : assignment.grade >= 70 ? "#d97706" : "#dc2626"}}>{assignment.grade}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GradesTab;