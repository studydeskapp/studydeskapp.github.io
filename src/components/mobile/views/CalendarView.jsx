import React, { useState, useMemo } from 'react';

/**
 * Calendar View - Mobile calendar with assignments and events
 */
function CalendarView({ assignments = [], classes = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [view, setView] = useState('month'); // 'month' or 'week'

  // Get calendar data
  const { year, month } = useMemo(() => ({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth()
  }), [currentDate]);

  // Get days in month
  const daysInMonth = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysCount = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add days of month
    for (let i = 1; i <= daysCount; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [year, month]);

  // Get assignments for a specific date
  const getAssignmentsForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return assignments.filter(a => a.dueDate && a.dueDate.split('T')[0] === dateStr);
  };

  // Get assignments for selected date
  const selectedDateAssignments = useMemo(() => {
    return selectedDate ? getAssignmentsForDate(selectedDate) : [];
  }, [selectedDate, assignments]);

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Check if date is today
  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Check if date is selected
  const isSelected = (date) => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="mobile-view calendar-view-mobile">
      <h1 className="calendar-title-mobile">Calendar</h1>

      {/* Calendar Header */}
      <div className="calendar-header-mobile">
        <button className="calendar-nav-btn" onClick={goToPreviousMonth}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div className="calendar-month-year">
          {monthNames[month]} {year}
        </div>
        <button className="calendar-nav-btn" onClick={goToNextMonth}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>

      <button className="calendar-today-btn" onClick={goToToday}>
        Today
      </button>

      {/* Day Names */}
      <div className="calendar-day-names">
        {dayNames.map(day => (
          <div key={day} className="calendar-day-name">{day}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid-mobile">
        {daysInMonth.map((date, idx) => {
          const dayAssignments = date ? getAssignmentsForDate(date) : [];
          const hasAssignments = dayAssignments.length > 0;
          
          return (
            <div
              key={idx}
              className={`calendar-day-cell ${!date ? 'empty' : ''} ${isToday(date) ? 'today' : ''} ${isSelected(date) ? 'selected' : ''} ${hasAssignments ? 'has-assignments' : ''}`}
              onClick={() => date && setSelectedDate(date)}
            >
              {date && (
                <>
                  <div className="calendar-day-number">{date.getDate()}</div>
                  {hasAssignments && (
                    <div className="calendar-day-dots">
                      {dayAssignments.slice(0, 3).map((_, i) => (
                        <div key={i} className="calendar-day-dot" />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="calendar-selected-date-card">
          <div className="calendar-selected-date-header">
            <div className="calendar-selected-date-title">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            <button className="calendar-close-btn" onClick={() => setSelectedDate(null)}>×</button>
          </div>

          {selectedDateAssignments.length > 0 ? (
            <div className="calendar-assignments-list">
              {selectedDateAssignments.map(assignment => (
                <div key={assignment.id} className="calendar-assignment-item">
                  <div className="calendar-assignment-icon">
                    {assignment.progress >= 100 ? '✅' : '📝'}
                  </div>
                  <div className="calendar-assignment-details">
                    <div className="calendar-assignment-title">{assignment.title}</div>
                    <div className="calendar-assignment-meta">
                      {assignment.subject} • {assignment.priority}
                    </div>
                    <div className="calendar-assignment-progress">
                      <div className="calendar-progress-bar">
                        <div 
                          className="calendar-progress-fill"
                          style={{ width: `${assignment.progress || 0}%` }}
                        />
                      </div>
                      <span className="calendar-progress-text">{assignment.progress || 0}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="calendar-no-assignments">
              <div className="calendar-empty-icon">📅</div>
              <div className="calendar-empty-text">No assignments due on this date</div>
            </div>
          )}
        </div>
      )}

      {/* Upcoming Assignments */}
      <div className="calendar-upcoming-card">
        <div className="calendar-upcoming-title">Upcoming Assignments</div>
        {assignments
          .filter(a => a.dueDate && new Date(a.dueDate) >= new Date() && a.progress < 100)
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
          .slice(0, 5)
          .map(assignment => (
            <div key={assignment.id} className="calendar-upcoming-item">
              <div className="calendar-upcoming-date">
                {new Date(assignment.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              <div className="calendar-upcoming-details">
                <div className="calendar-upcoming-title-text">{assignment.title}</div>
                <div className="calendar-upcoming-subject">{assignment.subject}</div>
              </div>
            </div>
          ))}
        {assignments.filter(a => a.dueDate && new Date(a.dueDate) >= new Date() && a.progress < 100).length === 0 && (
          <div className="calendar-upcoming-empty">All caught up! 🎉</div>
        )}
      </div>
    </div>
  );
}

export default CalendarView;
