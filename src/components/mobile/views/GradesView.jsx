import React from 'react';

/**
 * Grades View - Assignment grades and class performance
 */
function GradesView({ assignments, classes }) {
  // Group assignments by subject
  const assignmentsBySubject = {};
  assignments.forEach(a => {
    if (!a.subject) return;
    if (!assignmentsBySubject[a.subject]) {
      assignmentsBySubject[a.subject] = [];
    }
    assignmentsBySubject[a.subject].push(a);
  });

  // Calculate stats per subject
  const subjectStats = Object.entries(assignmentsBySubject).map(([subject, subjectAssignments]) => {
    const total = subjectAssignments.length;
    const completed = subjectAssignments.filter(a => a.progress === 100).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const classInfo = classes.find(c => c.name === subject);
    
    return {
      subject,
      total,
      completed,
      completionRate,
      color: classInfo?.color || '#6366f1'
    };
  }).sort((a, b) => b.completionRate - a.completionRate);

  const overallCompleted = assignments.filter(a => a.progress === 100).length;
  const overallTotal = assignments.length;
  const overallRate = overallTotal > 0 ? Math.round((overallCompleted / overallTotal) * 100) : 0;

  return (
    <div className="mobile-view grades-view">
      <h1 className="grades-title">Grades</h1>

      {/* Overall Stats */}
      <div className="grades-overall">
        <div className="grades-overall-circle">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="var(--bg3)"
              strokeWidth="8"
            />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="8"
              strokeDasharray={`${overallRate * 3.39} 339`}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
            />
            <text
              x="60"
              y="60"
              textAnchor="middle"
              dy="8"
              fontSize="28"
              fontWeight="700"
              fill="var(--text)"
            >
              {overallRate}%
            </text>
          </svg>
        </div>
        <div className="grades-overall-stats">
          <div className="grades-overall-stat">
            <span className="grades-overall-value">{overallCompleted}</span>
            <span className="grades-overall-label">Completed</span>
          </div>
          <div className="grades-overall-stat">
            <span className="grades-overall-value">{overallTotal - overallCompleted}</span>
            <span className="grades-overall-label">Pending</span>
          </div>
        </div>
      </div>

      {/* By Subject */}
      {subjectStats.length > 0 && (
        <div className="grades-subjects">
          <h2 className="grades-section-title">By Subject</h2>
          
          {subjectStats.map(stat => (
            <div key={stat.subject} className="grades-subject-card">
              <div className="grades-subject-header">
                <div 
                  className="grades-subject-dot"
                  style={{ backgroundColor: stat.color }}
                />
                <h3 className="grades-subject-name">{stat.subject}</h3>
                <span className="grades-subject-rate">{stat.completionRate}%</span>
              </div>
              
              <div className="grades-subject-progress">
                <div 
                  className="grades-subject-fill"
                  style={{ 
                    width: `${stat.completionRate}%`,
                    backgroundColor: stat.color
                  }}
                />
              </div>
              
              <div className="grades-subject-stats">
                <span>{stat.completed} of {stat.total} completed</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {assignments.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <h3 className="empty-state-title">No grades yet</h3>
          <p className="empty-state-text">Complete some assignments to see your progress</p>
        </div>
      )}
    </div>
  );
}

export default GradesView;
