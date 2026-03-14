import React from 'react';
import { fmt12 } from '../../../utils/helpers';

/**
 * Schedule View - Weekly schedule with today's classes
 */
function ScheduleView({ classes, onAddClass }) {
  const today = new Date().getDay();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Get today's classes
  const todayClasses = classes
    .filter(c => c.days?.includes(today))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  
  // Group classes by day
  const classesByDay = days.map((day, index) => ({
    day,
    dayIndex: index,
    isToday: index === today,
    classes: classes
      .filter(c => c.days?.includes(index))
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }));

  return (
    <div className="mobile-view schedule-view">
      <div className="schedule-header">
        <h1 className="schedule-title">Schedule</h1>
        <button className="btn-icon" onClick={onAddClass} aria-label="Add class">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>

      {/* Today's Classes */}
      {todayClasses.length > 0 && (
        <div className="schedule-today">
          <h2 className="schedule-section-title">Today - {days[today]}</h2>
          <div className="schedule-classes">
            {todayClasses.map(cls => (
              <div key={cls.id} className="schedule-class-card today">
                <div 
                  className="schedule-class-indicator" 
                  style={{ backgroundColor: cls.color }}
                />
                <div className="schedule-class-content">
                  <h3 className="schedule-class-name">{cls.name}</h3>
                  <div className="schedule-class-meta">
                    <span className="schedule-class-time">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      {fmt12(cls.startTime)} - {fmt12(cls.endTime)}
                    </span>
                    {cls.room && (
                      <span className="schedule-class-room">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        {cls.room}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Schedule */}
      <div className="schedule-week">
        <h2 className="schedule-section-title">Weekly Schedule</h2>
        {classesByDay.map(({ day, dayIndex, isToday, classes: dayClasses }) => (
          <div key={dayIndex} className={`schedule-day ${isToday ? 'today' : ''}`}>
            <div className="schedule-day-header">
              <h3 className="schedule-day-name">{day}</h3>
              <span className="schedule-day-count">{dayClasses.length}</span>
            </div>
            
            {dayClasses.length > 0 ? (
              <div className="schedule-day-classes">
                {dayClasses.map(cls => (
                  <div key={cls.id} className="schedule-class-mini">
                    <div 
                      className="schedule-class-dot" 
                      style={{ backgroundColor: cls.color }}
                    />
                    <span className="schedule-class-mini-name">{cls.name}</span>
                    <span className="schedule-class-mini-time">
                      {fmt12(cls.startTime)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="schedule-day-empty">No classes</div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {classes.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
          </div>
          <h3 className="empty-state-title">No classes yet</h3>
          <p className="empty-state-text">Add your class schedule to get started</p>
          <button className="btn-primary" onClick={onAddClass}>
            Add Class
          </button>
        </div>
      )}
    </div>
  );
}

export default ScheduleView;
