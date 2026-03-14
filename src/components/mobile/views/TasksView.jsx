import React, { useState } from 'react';
import SwipeableCard from '../SwipeableCard';
import { daysUntil, fmtDate } from '../../../utils/helpers';

/**
 * Tasks View - All assignments with filtering and sorting
 */
function TasksView({ 
  assignments, 
  onCompleteAssignment,
  onAssignmentClick,
  onAddTask
}) {
  const [filter, setFilter] = useState('active'); // active, completed, all
  const [sortBy, setSortBy] = useState('date'); // date, priority, subject

  const filters = [
    { id: 'active', label: 'Active', icon: '📝' },
    { id: 'completed', label: 'Done', icon: '✓' },
    { id: 'all', label: 'All', icon: '📋' }
  ];

  const getFilteredAssignments = () => {
    let filtered = assignments;
    
    if (filter === 'active') {
      filtered = assignments.filter(a => a.progress < 100);
    } else if (filter === 'completed') {
      filtered = assignments.filter(a => a.progress === 100);
    }

    // Sort
    if (sortBy === 'date') {
      filtered = [...filtered].sort((a, b) => 
        new Date(a.dueDate) - new Date(b.dueDate)
      );
    } else if (sortBy === 'priority') {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      filtered = [...filtered].sort((a, b) => 
        priorityOrder[a.priority] - priorityOrder[b.priority]
      );
    } else if (sortBy === 'subject') {
      filtered = [...filtered].sort((a, b) => 
        (a.subject || '').localeCompare(b.subject || '')
      );
    }

    return filtered;
  };

  const filteredAssignments = getFilteredAssignments();

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6366f1';
    }
  };

  const getDueStatus = (dueDate) => {
    const days = daysUntil(dueDate);
    if (days < 0) return { text: 'Overdue', class: 'overdue' };
    if (days === 0) return { text: 'Due today', class: 'today' };
    if (days === 1) return { text: 'Due tomorrow', class: 'soon' };
    return { text: `Due ${fmtDate(dueDate)}`, class: 'normal' };
  };

  return (
    <div className="mobile-view tasks-view">
      {/* Header with filters */}
      <div className="tasks-header">
        <h1 className="tasks-title">Tasks</h1>
        <div className="tasks-count">
          {filteredAssignments.length} {filter === 'active' ? 'active' : filter}
        </div>
      </div>

      {/* Filter Pills */}
      <div className="filter-pills">
        {filters.map(f => (
          <button
            key={f.id}
            className={`filter-pill ${filter === f.id ? 'active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            <span className="filter-pill-icon">{f.icon}</span>
            <span className="filter-pill-label">{f.label}</span>
          </button>
        ))}
      </div>

      {/* Sort Options */}
      <div className="sort-bar">
        <span className="sort-label">Sort by:</span>
        <select 
          className="sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="date">Due Date</option>
          <option value="priority">Priority</option>
          <option value="subject">Subject</option>
        </select>
      </div>

      {/* Tasks List */}
      <div className="tasks-list">
        {filteredAssignments.map(assignment => {
          const dueStatus = getDueStatus(assignment.dueDate);
          
          return (
            <SwipeableCard
              key={assignment.id}
              onSwipeRight={() => onCompleteAssignment(assignment.id)}
              onSwipeLeft={() => onAssignmentClick(assignment)}
              disabled={assignment.progress === 100}
            >
              <div 
                className={`task-card ${assignment.progress === 100 ? 'completed' : ''}`}
                onClick={() => onAssignmentClick(assignment)}
              >
                <div 
                  className="task-priority-indicator" 
                  style={{ backgroundColor: getPriorityColor(assignment.priority) }}
                />
                
                <div className="task-content">
                  <h3 className="task-title">{assignment.title}</h3>
                  
                  <div className="task-meta">
                    {assignment.subject && (
                      <span className="task-subject">{assignment.subject}</span>
                    )}
                    <span className={`task-due ${dueStatus.class}`}>
                      {dueStatus.text}
                    </span>
                  </div>

                  {assignment.progress > 0 && assignment.progress < 100 && (
                    <div className="task-progress">
                      <div className="task-progress-bar">
                        <div 
                          className="task-progress-fill"
                          style={{ width: `${assignment.progress}%` }}
                        />
                      </div>
                      <span className="task-progress-text">{assignment.progress}%</span>
                    </div>
                  )}
                </div>

                {assignment.progress === 100 && (
                  <div className="task-completed-badge">✓</div>
                )}
              </div>
            </SwipeableCard>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredAssignments.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">
            {filter === 'completed' ? '🎉' : '📝'}
          </div>
          <h3 className="empty-state-title">
            {filter === 'completed' ? 'No completed tasks yet' : 'No tasks found'}
          </h3>
          <p className="empty-state-text">
            {filter === 'completed' 
              ? 'Complete some tasks to see them here' 
              : 'Add your first task to get started'}
          </p>
          {filter !== 'completed' && (
            <button className="btn-primary" onClick={onAddTask}>
              Add Task
            </button>
          )}
        </div>
      )}

      {/* FAB */}
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

export default TasksView;
