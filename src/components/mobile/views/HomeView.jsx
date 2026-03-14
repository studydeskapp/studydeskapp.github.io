import React from 'react';
import FeedCard from '../FeedCard';
import SwipeableCard from '../SwipeableCard';
import { daysUntil, fmtDate } from '../../../utils/helpers';

/**
 * Home View - Main feed with contextual cards
 * Shows: Daily quest, urgent tasks, today's classes, buddy status
 */
function HomeView({ 
  assignments, 
  classes, 
  game, 
  onCompleteAssignment,
  onAssignmentClick,
  onAddTask
}) {
  const today = new Date().toISOString().split('T')[0];
  const todayDay = new Date().getDay();
  
  // Get today's classes
  const todayClasses = classes.filter(c => c.days?.includes(todayDay));
  
  // Get urgent assignments (due today or overdue)
  const urgentAssignments = assignments
    .filter(a => a.progress < 100)
    .filter(a => {
      const days = daysUntil(a.dueDate);
      return days <= 0;
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);
  
  // Get upcoming assignments (due in next 3 days)
  const upcomingAssignments = assignments
    .filter(a => a.progress < 100)
    .filter(a => {
      const days = daysUntil(a.dueDate);
      return days > 0 && days <= 3;
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);
  
  // Daily quest progress
  const todayCompleted = assignments.filter(a => {
    const completedDate = a.completedDate?.split('T')[0];
    return completedDate === today;
  }).length;
  
  const questProgress = Math.min(3, todayCompleted);

  return (
    <div className="mobile-view home-view">
      {/* Quick Stats */}
      <div className="home-stats">
        <div className="home-stat">
          <div className="home-stat-value">{assignments.filter(a => a.progress < 100).length}</div>
          <div className="home-stat-label">Active</div>
        </div>
        <div className="home-stat">
          <div className="home-stat-value">{urgentAssignments.length}</div>
          <div className="home-stat-label">Urgent</div>
        </div>
        <div className="home-stat">
          <div className="home-stat-value">{todayClasses.length}</div>
          <div className="home-stat-label">Classes</div>
        </div>
        <div className="home-stat">
          <div className="home-stat-value">⭐{game?.points || 0}</div>
          <div className="home-stat-label">Points</div>
        </div>
      </div>

      {/* Daily Quest Card */}
      {questProgress < 3 && (
        <FeedCard
          type="quest"
          title="Daily Quest"
          subtitle={`Complete ${3 - questProgress} more ${3 - questProgress === 1 ? 'task' : 'tasks'} to extend your streak`}
          icon="🎯"
          color="#F59E0B"
        >
          <div className="quest-progress">
            {[0, 1, 2].map(i => (
              <div 
                key={i} 
                className={`quest-pip ${i < questProgress ? 'completed' : ''}`}
              >
                {i < questProgress ? '✓' : ''}
              </div>
            ))}
          </div>
        </FeedCard>
      )}

      {/* Urgent Tasks */}
      {urgentAssignments.length > 0 && (
        <div className="feed-section">
          <div className="feed-section-header">
            <h2 className="feed-section-title">⚠️ Urgent</h2>
            <span className="feed-section-count">{urgentAssignments.length}</span>
          </div>
          
          {urgentAssignments.map(assignment => (
            <SwipeableCard
              key={assignment.id}
              onSwipeRight={() => onCompleteAssignment(assignment.id)}
              onSwipeLeft={() => onAssignmentClick(assignment)}
            >
              <div 
                className="assignment-card urgent"
                onClick={() => onAssignmentClick(assignment)}
              >
                <div 
                  className="assignment-stripe" 
                  style={{ backgroundColor: assignment.color || '#6366f1' }}
                />
                <div className="assignment-content">
                  <h3 className="assignment-title">{assignment.title}</h3>
                  <div className="assignment-meta">
                    <span className="assignment-subject">{assignment.subject}</span>
                    <span className="assignment-due urgent">
                      {daysUntil(assignment.dueDate) === 0 ? 'Due today' : 'Overdue'}
                    </span>
                  </div>
                </div>
              </div>
            </SwipeableCard>
          ))}
        </div>
      )}

      {/* Today's Classes */}
      {todayClasses.length > 0 && (
        <div className="feed-section">
          <div className="feed-section-header">
            <h2 className="feed-section-title">📚 Today's Classes</h2>
            <span className="feed-section-count">{todayClasses.length}</span>
          </div>
          
          {todayClasses
            .sort((a, b) => a.startTime.localeCompare(b.startTime))
            .map(cls => (
              <FeedCard
                key={cls.id}
                type="class"
                title={cls.name}
                subtitle={`${cls.startTime} - ${cls.endTime}${cls.room ? ` • ${cls.room}` : ''}`}
                color={cls.color}
              >
                <div 
                  className="class-indicator" 
                  style={{ backgroundColor: cls.color }}
                />
              </FeedCard>
            ))}
        </div>
      )}

      {/* Upcoming Tasks */}
      {upcomingAssignments.length > 0 && (
        <div className="feed-section">
          <div className="feed-section-header">
            <h2 className="feed-section-title">📋 Coming Up</h2>
            <span className="feed-section-count">{upcomingAssignments.length}</span>
          </div>
          
          {upcomingAssignments.map(assignment => (
            <SwipeableCard
              key={assignment.id}
              onSwipeRight={() => onCompleteAssignment(assignment.id)}
              onSwipeLeft={() => onAssignmentClick(assignment)}
            >
              <div 
                className="assignment-card"
                onClick={() => onAssignmentClick(assignment)}
              >
                <div 
                  className="assignment-stripe" 
                  style={{ backgroundColor: assignment.color || '#6366f1' }}
                />
                <div className="assignment-content">
                  <h3 className="assignment-title">{assignment.title}</h3>
                  <div className="assignment-meta">
                    <span className="assignment-subject">{assignment.subject}</span>
                    <span className="assignment-due">
                      Due {fmtDate(assignment.dueDate)}
                    </span>
                  </div>
                </div>
              </div>
            </SwipeableCard>
          ))}
        </div>
      )}

      {/* Empty State */}
      {urgentAssignments.length === 0 && upcomingAssignments.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🎉</div>
          <h3 className="empty-state-title">All caught up!</h3>
          <p className="empty-state-text">No urgent tasks right now</p>
          <button className="btn-primary" onClick={onAddTask}>
            Add New Task
          </button>
        </div>
      )}

      {/* FAB for adding tasks */}
      <button 
        className="fab"
        onClick={onAddTask}
        aria-label="Add task"
      >
        +
      </button>
    </div>
  );
}

export default HomeView;
