import React, { useState, useMemo } from 'react';

function CalendarTab({ assignments, classes, darkMode, onAssignmentClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  // Get calendar data
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    const days = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const dayAssignments = assignments.filter(a => a.dueDate === dateStr);
      
      days.push({
        date: new Date(current),
        dateStr,
        isCurrentMonth: current.getMonth() === month,
        isToday: dateStr === new Date().toISOString().split('T')[0],
        assignments: dayAssignments,
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [currentDate, assignments]);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const text = darkMode ? '#E5E7EB' : '#1F2937';
  const text2 = darkMode ? '#9CA3AF' : '#6B7280';
  const text3 = darkMode ? '#6B7280' : '#9CA3AF';
  const border = darkMode ? '#374151' : '#E5E7EB';
  const bg = darkMode ? '#111827' : '#FFFFFF';
  const bgHover = darkMode ? '#1F2937' : '#F9FAFB';

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
            <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>
          </svg>
          <h1 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '600', 
            color: text,
            margin: 0
          }}>
            Calendar
          </h1>
        </div>
        <p style={{ 
          fontSize: '0.875rem', 
          color: text2,
          margin: 0
        }}>
          View all your assignments and classes
        </p>
      </div>

      {/* Calendar Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <button
          onClick={goToToday}
          style={{
            padding: '8px 14px',
            background: bg,
            border: `1px solid ${border}`,
            borderRadius: '6px',
            color: text,
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = bgHover}
          onMouseLeave={(e) => e.currentTarget.style.background = bg}
        >
          Today
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={goToPrevMonth}
            style={{
              width: '32px',
              height: '32px',
              background: bg,
              border: `1px solid ${border}`,
              borderRadius: '6px',
              color: text,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = bgHover}
            onMouseLeave={(e) => e.currentTarget.style.background = bg}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          <div style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: text,
            minWidth: '160px',
            textAlign: 'center'
          }}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </div>

          <button
            onClick={goToNextMonth}
            style={{
              width: '32px',
              height: '32px',
              background: bg,
              border: `1px solid ${border}`,
              borderRadius: '6px',
              color: text,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = bgHover}
            onMouseLeave={(e) => e.currentTarget.style.background = bg}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>

        <div style={{ width: '80px' }} /> {/* Spacer for balance */}
      </div>

      {/* Calendar Grid */}
      <div style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        {/* Day headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          borderBottom: `1px solid ${border}`,
          background: darkMode ? '#1F2937' : '#F9FAFB'
        }}>
          {dayNames.map(day => (
            <div
              key={day}
              style={{
                textAlign: 'center',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: text2,
                padding: '12px 8px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
        }}>
          {calendarData.map((day, idx) => {
            return (
              <div
                key={idx}
                onClick={() => {
                  if (day.isCurrentMonth) {
                    setSelectedDay(day);
                  }
                }}
                style={{
                  height: '120px',
                  padding: '8px',
                  borderRight: (idx + 1) % 7 === 0 ? 'none' : `1px solid ${border}`,
                  borderBottom: idx < calendarData.length - 7 ? `1px solid ${border}` : 'none',
                  background: day.isToday ? (darkMode ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)') : 'transparent',
                  opacity: day.isCurrentMonth ? 1 : 0.4,
                  transition: 'background 0.15s ease',
                  cursor: day.isCurrentMonth ? 'pointer' : 'default',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  if (day.isCurrentMonth) {
                    e.currentTarget.style.background = day.isToday 
                      ? (darkMode ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.08)')
                      : bgHover;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = day.isToday 
                    ? (darkMode ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)')
                    : 'transparent';
                }}
              >
                {/* Date number */}
                <div style={{
                  fontSize: '0.875rem',
                  fontWeight: day.isToday ? '600' : '500',
                  marginBottom: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: day.isToday ? 'var(--accent)' : 'transparent',
                  color: day.isToday ? '#fff' : (day.isCurrentMonth ? text : text3)
                }}>
                  {day.date.getDate()}
                </div>

                {/* Assignment indicators */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
                  {day.assignments.slice(0, 2).map((assignment, aIdx) => (
                    <div
                      key={aIdx}
                      onClick={() => onAssignmentClick && onAssignmentClick(assignment)}
                      style={{
                        fontSize: '0.7rem',
                        padding: '3px 6px',
                        background: assignment.progress === 100 
                          ? (darkMode ? '#065F46' : '#D1FAE5')
                          : (darkMode ? '#991B1B' : '#FEE2E2'),
                        color: assignment.progress === 100 
                          ? (darkMode ? '#6EE7B7' : '#047857')
                          : (darkMode ? '#FCA5A5' : '#DC2626'),
                        borderRadius: '4px',
                        fontWeight: '500',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        borderLeft: `3px solid ${assignment.progress === 100 
                          ? (darkMode ? '#10B981' : '#059669')
                          : (darkMode ? '#EF4444' : '#DC2626')}`
                      }}
                      title={assignment.title}
                    >
                      {assignment.title}
                    </div>
                  ))}
                  {day.assignments.length > 2 && (
                    <div style={{
                      fontSize: '0.7rem',
                      color: text3,
                      fontWeight: '500',
                      padding: '2px 6px'
                    }}>
                      +{day.assignments.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{
        marginTop: '20px',
        display: 'flex',
        gap: '24px',
        justifyContent: 'center',
        fontSize: '0.8125rem',
        color: text2
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ 
            width: '12px', 
            height: '12px', 
            background: darkMode ? '#991B1B' : '#FEE2E2',
            borderLeft: `3px solid ${darkMode ? '#EF4444' : '#DC2626'}`,
            borderRadius: '2px' 
          }} />
          <span>Incomplete</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ 
            width: '12px', 
            height: '12px', 
            background: darkMode ? '#065F46' : '#D1FAE5',
            borderLeft: `3px solid ${darkMode ? '#10B981' : '#059669'}`,
            borderRadius: '2px' 
          }} />
          <span>Complete</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ 
            width: '24px', 
            height: '24px', 
            background: 'var(--accent)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '0.7rem',
            fontWeight: '600'
          }}>
            {new Date().getDate()}
          </div>
          <span>Today</span>
        </div>
      </div>

      {/* Day Details Modal */}
      {selectedDay && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: darkMode ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setSelectedDay(null)}
        >
          <div
            style={{
              background: bg,
              border: `1px solid ${border}`,
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              animation: 'slideUp 0.2s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: `1px solid ${border}`
            }}>
              <div>
                <h2 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '600', 
                  color: text,
                  margin: '0 0 4px 0'
                }}>
                  {selectedDay.date.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </h2>
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: text2,
                  margin: 0
                }}>
                  {selectedDay.assignments.length} assignment{selectedDay.assignments.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: text2,
                  padding: '4px',
                  lineHeight: 1,
                  borderRadius: '6px',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = bgHover;
                  e.currentTarget.style.color = text;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                  e.currentTarget.style.color = text2;
                }}
              >
                ×
              </button>
            </div>

            {/* Assignments List */}
            {selectedDay.assignments.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 20px',
                color: text2
              }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📅</div>
                <p style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '4px' }}>
                  No assignments due
                </p>
                <p style={{ fontSize: '0.875rem' }}>
                  Enjoy your free day!
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedDay.assignments.map((assignment, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '16px',
                      background: darkMode ? '#1F2937' : '#F9FAFB',
                      border: `1px solid ${border}`,
                      borderLeft: `4px solid ${assignment.progress === 100 
                        ? (darkMode ? '#10B981' : '#059669')
                        : (darkMode ? '#EF4444' : '#DC2626')}`,
                      borderRadius: '8px',
                      transition: 'all 0.15s ease',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      if (onAssignmentClick) {
                        onAssignmentClick(assignment);
                        setSelectedDay(null);
                      }
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateX(4px)';
                      e.currentTarget.style.boxShadow = darkMode 
                        ? '0 4px 12px rgba(0,0,0,0.3)' 
                        : '0 4px 12px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px'
                    }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ 
                          fontSize: '1rem', 
                          fontWeight: '600', 
                          color: text,
                          margin: '0 0 4px 0'
                        }}>
                          {assignment.title}
                        </h3>
                        {assignment.subject && (
                          <p style={{ 
                            fontSize: '0.875rem', 
                            color: text2,
                            margin: 0
                          }}>
                            {assignment.subject}
                          </p>
                        )}
                      </div>
                      <div style={{
                        padding: '4px 12px',
                        background: assignment.progress === 100 
                          ? (darkMode ? '#065F46' : '#D1FAE5')
                          : (darkMode ? '#991B1B' : '#FEE2E2'),
                        color: assignment.progress === 100 
                          ? (darkMode ? '#6EE7B7' : '#047857')
                          : (darkMode ? '#FCA5A5' : '#DC2626'),
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        whiteSpace: 'nowrap'
                      }}>
                        {assignment.progress === 100 ? '✓ Complete' : assignment.progress != null ? `${assignment.progress}%` : '0%'}
                      </div>
                    </div>

                    {assignment.notes && (
                      <p style={{ 
                        fontSize: '0.875rem', 
                        color: text2,
                        margin: '8px 0 0 0',
                        lineHeight: '1.5'
                      }}>
                        {assignment.notes}
                      </p>
                    )}

                    {assignment.priority && (
                      <div style={{ 
                        marginTop: '8px',
                        display: 'inline-block',
                        padding: '2px 8px',
                        background: assignment.priority === 'high' 
                          ? (darkMode ? '#7F1D1D' : '#FEE2E2')
                          : assignment.priority === 'medium'
                          ? (darkMode ? '#78350F' : '#FEF3C7')
                          : (darkMode ? '#14532D' : '#D1FAE5'),
                        color: assignment.priority === 'high' 
                          ? (darkMode ? '#FCA5A5' : '#DC2626')
                          : assignment.priority === 'medium'
                          ? (darkMode ? '#FCD34D' : '#D97706')
                          : (darkMode ? '#6EE7B7' : '#047857'),
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        textTransform: 'capitalize'
                      }}>
                        {assignment.priority} priority
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideUp {
              from { transform: translateY(20px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

export default CalendarTab;
