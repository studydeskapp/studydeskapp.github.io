import React from 'react';

function GradesTab({ assignments, classes }) {
  // Build per-class grade data from assignments that have a grade
  const graded = assignments.filter(a => a.grade != null);
  
  return (
    <div>
      <div className="sec-hd">
        <div className="sec-t">📊 Grades</div>
      </div>
      
      {graded.length === 0 ? (
        <div className="empty" style={{background:"var(--card)",border:"1.5px dashed var(--border2)",borderRadius:18,padding:"52px 20px"}}>
          <div className="empty-i">📊</div>
          <div className="empty-t">No grades yet</div>
          <div style={{fontSize:".78rem",color:"var(--text4)",marginTop:8}}>Grades will appear here when you add them to assignments</div>
        </div>
      ) : (
        <div className="grades-list">
          {graded.map(assignment => (
            <div key={assignment.id} className="grade-item" style={{background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:12,padding:16,marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontWeight:600,color:"var(--text)"}}>{assignment.title}</div>
                  <div style={{fontSize:".8rem",color:"var(--text3)",marginTop:2}}>{assignment.subject}</div>
                </div>
                <div style={{fontSize:"1.2rem",fontWeight:700,color:"var(--accent)"}}>{assignment.grade}%</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GradesTab;