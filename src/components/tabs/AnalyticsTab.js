import React, { useState, useMemo } from 'react';

function AnalyticsTab({ assignments, classes, game, timerSessions }) {
  const [timeRange, setTimeRange] = useState('week'); // week | month | all
  const [selectedSubject, setSelectedSubject] = useState('all');

  // Calculate date ranges
  const now = new Date();
  const getDateRange = () => {
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    
    if (timeRange === 'week') {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    } else if (timeRange === 'month') {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    return { start: new Date(0), end };
  };

  const { start: rangeStart, end: rangeEnd } = getDateRange();

  // Filter assignments by date range
  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => {
      if (!a.completedAt) return false;
      const completedDate = new Date(a.completedAt);
      return completedDate >= rangeStart && completedDate <= rangeEnd;
    });
  }, [assignments, rangeStart, rangeEnd]);

  // Completion rate by day
  const completionByDay = useMemo(() => {
    const days = {};
    filteredAssignments.forEach(a => {
      if (a.completedAt) {
        const date = new Date(a.completedAt).toISOString().split('T')[0];
        days[date] = (days[date] || 0) + 1;
      }
    });
    return days;
  }, [filteredAssignments]);

  // Subject breakdown
  const subjectStats = useMemo(() => {
    const stats = {};
    assignments.forEach(a => {
      if (!stats[a.subject]) {
        stats[a.subject] = {
          total: 0,
          completed: 0,
          avgGrade: 0,
          gradeCount: 0,
          totalProgress: 0
        };
      }
      stats[a.subject].total++;
      if (a.progress >= 100) stats[a.subject].completed++;
      if (a.grade != null) {
        stats[a.subject].avgGrade += a.grade;
        stats[a.subject].gradeCount++;
      }
      stats[a.subject].totalProgress += a.progress;
    });
    
    // Calculate averages
    Object.keys(stats).forEach(subj => {
      if (stats[subj].gradeCount > 0) {
        stats[subj].avgGrade = Math.round(stats[subj].avgGrade / stats[subj].gradeCount);
      }
      stats[subj].avgProgress = Math.round(stats[subj].totalProgress / stats[subj].total);
      stats[subj].completionRate = stats[subj].total > 0 
        ? Math.round((stats[subj].completed / stats[subj].total) * 100) 
        : 0;
    });
    
    return stats;
  }, [assignments]);

  // Priority distribution
  const priorityStats = useMemo(() => {
    const stats = { high: 0, medium: 0, low: 0 };
    assignments.filter(a => a.progress < 100).forEach(a => {
      stats[a.priority] = (stats[a.priority] || 0) + 1;
    });
    return stats;
  }, [assignments]);

  // Overdue analysis
  const overdueStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return assignments.filter(a => {
      if (a.progress >= 100 || !a.dueDate) return false;
      const due = new Date(a.dueDate);
      return due < today;
    });
  }, [assignments]);

  // Productivity metrics
  const productivityMetrics = useMemo(() => {
    const completed = assignments.filter(a => a.progress >= 100);
    const withGrades = assignments.filter(a => a.grade != null);
    const avgGrade = withGrades.length > 0
      ? Math.round(withGrades.reduce((sum, a) => sum + a.grade, 0) / withGrades.length)
      : 0;
    
    // Calculate average completion time (days from creation to completion)
    const completionTimes = completed
      .filter(a => a.completedAt && a.createdAt)
      .map(a => {
        const created = new Date(a.createdAt);
        const completedDate = new Date(a.completedAt);
        return Math.ceil((completedDate - created) / (1000 * 60 * 60 * 24));
      });
    
    const avgCompletionTime = completionTimes.length > 0
      ? Math.round(completionTimes.reduce((sum, t) => sum + t, 0) / completionTimes.length)
      : 0;

    return {
      totalAssignments: assignments.length,
      completed: completed.length,
      completionRate: assignments.length > 0 
        ? Math.round((completed.length / assignments.length) * 100) 
        : 0,
      avgGrade,
      avgCompletionTime,
      overdue: overdueStats.length,
      streak: game.streak || 0,
      points: game.points || 0
    };
  }, [assignments, game, overdueStats]);

  // Completion chart data (last 7 or 30 days)
  const chartData = useMemo(() => {
    const days = timeRange === 'week' ? 7 : 30;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0];
      const count = completionByDay[dateStr] || 0;
      const label = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : date.toLocaleDateString('en-US', { weekday: 'short' });
      
      data.push({ date: dateStr, count, label });
    }
    
    return data;
  }, [completionByDay, timeRange, now]);

  const maxCount = Math.max(...chartData.map(d => d.count), 1);

  // Grade distribution
  const gradeDistribution = useMemo(() => {
    const dist = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    assignments.filter(a => a.grade != null).forEach(a => {
      if (a.grade >= 90) dist.A++;
      else if (a.grade >= 80) dist.B++;
      else if (a.grade >= 70) dist.C++;
      else if (a.grade >= 60) dist.D++;
      else dist.F++;
    });
    return dist;
  }, [assignments]);

  const totalGraded = Object.values(gradeDistribution).reduce((sum, v) => sum + v, 0);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <div className="sec-hd">
        <div className="sec-t">Analytics</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['week', 'month', 'all'].map(range => (
            <button
              key={range}
              className={`btn btn-sm ${timeRange === range ? 'btn-p' : 'btn-g'}`}
              onClick={() => setTimeRange(range)}
            >
              {range === 'week' ? '7 Days' : range === 'month' ? '30 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: 16, 
        marginBottom: 24 
      }}>
        <MetricCard
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
          label="Completion Rate"
          value={`${productivityMetrics.completionRate}%`}
          subtitle={`${productivityMetrics.completed}/${productivityMetrics.totalAssignments} completed`}
          color="#10b981"
        />
        <MetricCard
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>}
          label="Average Grade"
          value={productivityMetrics.avgGrade > 0 ? `${productivityMetrics.avgGrade}%` : 'N/A'}
          subtitle={`${assignments.filter(a => a.grade != null).length} graded`}
          color="#3b82f6"
        />
        <MetricCard
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>}
          label="Current Streak"
          value={`${productivityMetrics.streak} days`}
          subtitle={`${productivityMetrics.points} points`}
          color="#f59e0b"
        />
        <MetricCard
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>}
          label="Overdue"
          value={productivityMetrics.overdue}
          subtitle={productivityMetrics.overdue === 0 ? 'All caught up' : 'Need attention'}
          color={productivityMetrics.overdue > 0 ? '#ef4444' : '#10b981'}
        />
      </div>

      {/* Completion Chart */}
      <div style={{ 
        background: 'var(--card)', 
        border: '1.5px solid var(--border)', 
        borderRadius: 16, 
        padding: 24, 
        marginBottom: 24 
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 20 
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)', marginBottom: 4 }}>
              Assignments Completed
            </div>
            <div style={{ fontSize: '.85rem', color: 'var(--text3)' }}>
              {timeRange === 'week' ? 'Last 7 days' : timeRange === 'month' ? 'Last 30 days' : 'All time'}
            </div>
          </div>
          <div style={{ 
            fontSize: '2rem', 
            fontWeight: 700, 
            color: 'var(--accent)' 
          }}>
            {filteredAssignments.length}
          </div>
        </div>

        {/* Bar Chart */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 200 }}>
          {chartData.map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ 
                width: '100%', 
                background: d.count > 0 ? 'var(--accent)' : 'var(--bg3)',
                borderRadius: '8px 8px 0 0',
                height: `${(d.count / maxCount) * 160}px`,
                minHeight: d.count > 0 ? 20 : 4,
                transition: 'all 0.3s',
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                paddingTop: 6
              }}>
                {d.count > 0 && (
                  <span style={{ 
                    fontSize: '.75rem', 
                    fontWeight: 700, 
                    color: '#fff' 
                  }}>
                    {d.count}
                  </span>
                )}
              </div>
              <div style={{ 
                fontSize: '.7rem', 
                color: 'var(--text3)', 
                fontWeight: 600,
                textAlign: 'center'
              }}>
                {d.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subject Performance */}
      <div style={{ 
        background: 'var(--card)', 
        border: '1.5px solid var(--border)', 
        borderRadius: 16, 
        padding: 24, 
        marginBottom: 24 
      }}>
        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)', marginBottom: 16 }}>
          Performance by Subject
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {Object.entries(subjectStats)
            .sort((a, b) => b[1].total - a[1].total)
            .map(([subject, stats]) => (
              <div key={subject}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: 8 
                }}>
                  <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '.9rem' }}>
                    {subject}
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    gap: 16, 
                    fontSize: '.85rem', 
                    color: 'var(--text2)' 
                  }}>
                    <span>{stats.completed}/{stats.total} done</span>
                    {stats.avgGrade > 0 && <span>Avg: {stats.avgGrade}%</span>}
                  </div>
                </div>
                <div style={{ 
                  width: '100%', 
                  height: 8, 
                  background: 'var(--bg3)', 
                  borderRadius: 4, 
                  overflow: 'hidden' 
                }}>
                  <div style={{ 
                    width: `${stats.completionRate}%`, 
                    height: '100%', 
                    background: `linear-gradient(90deg, var(--accent), ${stats.avgGrade >= 90 ? '#10b981' : stats.avgGrade >= 80 ? '#3b82f6' : stats.avgGrade >= 70 ? '#f59e0b' : '#ef4444'})`,
                    transition: 'width 0.3s'
                  }} />
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Grade Distribution */}
      {totalGraded > 0 && (
        <div style={{ 
          background: 'var(--card)', 
          border: '1.5px solid var(--border)', 
          borderRadius: 16, 
          padding: 24, 
          marginBottom: 24 
        }}>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)', marginBottom: 16 }}>
            Grade Distribution
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', height: 150 }}>
            {Object.entries(gradeDistribution).map(([grade, count]) => {
              const percentage = totalGraded > 0 ? (count / totalGraded) * 100 : 0;
              const colors = {
                A: '#10b981',
                B: '#3b82f6',
                C: '#f59e0b',
                D: '#f97316',
                F: '#ef4444'
              };
              
              return (
                <div key={grade} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ 
                    width: '100%', 
                    background: count > 0 ? colors[grade] : 'var(--bg3)',
                    borderRadius: '8px 8px 0 0',
                    height: `${percentage * 1.2}px`,
                    minHeight: count > 0 ? 30 : 4,
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    paddingTop: 8,
                    transition: 'all 0.3s'
                  }}>
                    {count > 0 && (
                      <span style={{ fontSize: '.8rem', fontWeight: 700, color: '#fff' }}>
                        {count}
                      </span>
                    )}
                  </div>
                  <div style={{ 
                    fontSize: '1rem', 
                    fontWeight: 700, 
                    color: colors[grade] 
                  }}>
                    {grade}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Priority Breakdown */}
      <div style={{ 
        background: 'var(--card)', 
        border: '1.5px solid var(--border)', 
        borderRadius: 16, 
        padding: 24 
      }}>
        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)', marginBottom: 16 }}>
          Current Workload
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <PriorityPill label="High Priority" count={priorityStats.high} color="#ef4444" />
          <PriorityPill label="Medium Priority" count={priorityStats.medium} color="#f59e0b" />
          <PriorityPill label="Low Priority" count={priorityStats.low} color="#10b981" />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, subtitle, color }) {
  const isEmoji = typeof icon === 'string';
  
  return (
    <div style={{ 
      background: 'var(--card)', 
      border: '1.5px solid var(--border)', 
      borderRadius: 12, 
      padding: 20,
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'default'
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
    }}>
      <div style={{ 
        fontSize: isEmoji ? '2rem' : '1.5rem', 
        marginBottom: 8,
        color: isEmoji ? 'inherit' : color,
        display: 'flex',
        alignItems: 'center'
      }}>
        {icon}
      </div>
      <div style={{ fontSize: '.8rem', color: 'var(--text3)', marginBottom: 4, fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontSize: '1.8rem', fontWeight: 700, color, marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: '.75rem', color: 'var(--text3)' }}>
        {subtitle}
      </div>
    </div>
  );
}

function PriorityPill({ label, count, color }) {
  return (
    <div style={{ 
      flex: 1,
      background: `${color}15`,
      border: `1.5px solid ${color}40`,
      borderRadius: 10,
      padding: '16px 12px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color, marginBottom: 4 }}>
        {count}
      </div>
      <div style={{ fontSize: '.8rem', color: 'var(--text2)', fontWeight: 600 }}>
        {label}
      </div>
    </div>
  );
}

export default AnalyticsTab;
