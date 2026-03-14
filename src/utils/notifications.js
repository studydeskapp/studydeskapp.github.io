// ┌──────────────────────────────────────────────────────────────────────────────┐
// │  NOTIFICATION SYSTEM                                                         │
// │  Push notifications, reminders, and in-app alerts for StudyDesk.           │
// └──────────────────────────────────────────────────────────────────────────────┘

export class NotificationManager {
  constructor() {
    this.permissions = 'default';
    this.notifications = [];
    this.reminders = [];
    this.checkPermissions();
  }

  async checkPermissions() {
    if ('Notification' in window) {
      this.permissions = Notification.permission;
    }
    return this.permissions;
  }

  async requestPermissions() {
    if ('Notification' in window && this.permissions === 'default') {
      const permission = await Notification.requestPermission();
      this.permissions = permission;
      return permission;
    }
    return this.permissions;
  }

  showNotification(title, options = {}) {
    const defaultOptions = {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'studydesk',
      requireInteraction: false,
      silent: false,
      ...options
    };

    // In-app notification
    this.showInAppNotification(title, defaultOptions);

    // Browser push notification (if permitted)
    if (this.permissions === 'granted' && 'Notification' in window) {
      try {
        const notification = new Notification(title, defaultOptions);
        notification.onclick = () => {
          window.focus();
          notification.close();
          if (options.onClick) {
            options.onClick();
          }
        };
        return notification;
      } catch (error) {
        console.warn('Notification failed:', error);
      }
    }

    return null;
  }

  showInAppNotification(title, options) {
    const notification = {
      id: Date.now() + Math.random(),
      title,
      message: options.body || '',
      type: options.type || 'info',
      duration: options.duration || 5000,
      timestamp: new Date(),
      ...options
    };

    this.notifications.push(notification);
    this.renderInAppNotification(notification);

    // Auto-remove after duration
    if (notification.duration > 0) {
      setTimeout(() => {
        this.removeNotification(notification.id);
      }, notification.duration);
    }

    return notification.id;
  }

  renderInAppNotification(notification) {
    // Remove existing container if any
    let container = document.querySelector('.notification-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'notification-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }

    const notificationEl = document.createElement('div');
    notificationEl.className = `notification notification--${notification.type}`;
    notificationEl.setAttribute('data-notification-id', notification.id);
    notificationEl.style.cssText = `
      background: ${this.getNotificationColor(notification.type).bg};
      color: ${this.getNotificationColor(notification.type).text};
      border: 1px solid ${this.getNotificationColor(notification.type).border};
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 12px;
      pointer-events: auto;
      cursor: pointer;
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;

    notificationEl.innerHTML = `
      <div class="notification-icon" style="
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: ${this.getNotificationColor(notification.type).icon};
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        flex-shrink: 0;
      ">
        ${this.getNotificationIcon(notification.type)}
      </div>
      <div style="flex: 1; min-width: 0;">
        <div style="font-weight: 600; font-size: 14px; margin-bottom: 2px;">${notification.title}</div>
        <div style="font-size: 13px; opacity: 0.8;">${notification.message}</div>
      </div>
      <button onclick="this.parentElement.remove()" style="
        background: none;
        border: none;
        color: inherit;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        opacity: 0.6;
      ">×</button>
    `;

    container.appendChild(notificationEl);

    // Animate in
    setTimeout(() => {
      notificationEl.style.transform = 'translateX(0)';
    }, 10);

    // Click handler
    notificationEl.addEventListener('click', () => {
      this.removeNotification(notification.id);
      if (notification.onClick) {
        notification.onClick();
      }
    });
  }

  getNotificationColor(type) {
    const colors = {
      success: { bg: '#d1fae5', text: '#065f46', border: '#10b981', icon: '#10b981' },
      error: { bg: '#fee2e2', text: '#991b1b', border: '#ef4444', icon: '#ef4444' },
      warning: { bg: '#fef3c7', text: '#92400e', border: '#f59e0b', icon: '#f59e0b' },
      info: { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6', icon: '#3b82f6' }
    };
    return colors[type] || colors.info;
  }

  getNotificationIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '!',
      info: 'i'
    };
    return icons[type] || 'i';
  }

  removeNotification(id) {
    const notificationEl = document.querySelector(`[data-notification-id="${id}"]`);
    if (notificationEl) {
      notificationEl.style.transform = 'translateX(100%)';
      setTimeout(() => {
        notificationEl.remove();
      }, 300);
    }
    this.notifications = this.notifications.filter(n => n.id !== id);
  }

  clearAllNotifications() {
    const container = document.querySelector('.notification-container');
    if (container) {
      container.innerHTML = '';
    }
    this.notifications = [];
  }

  // Assignment reminders
  scheduleAssignmentReminder(assignment, reminderTime) {
    const reminder = {
      id: Date.now() + Math.random(),
      type: 'assignment',
      assignmentId: assignment.id,
      title: assignment.title,
      dueDate: assignment.dueDate,
      reminderTime,
      scheduled: false
    };

    this.reminders.push(reminder);
    this.scheduleReminder(reminder);
    return reminder.id;
  }

  scheduleReminder(reminder) {
    const now = new Date();
    const reminderDate = new Date(reminder.reminderTime);

    if (reminderDate <= now) {
      // Reminder time has passed, show immediately
      this.triggerReminder(reminder);
      return;
    }

    const delay = reminderDate.getTime() - now.getTime();
    
    reminder.timeoutId = setTimeout(() => {
      this.triggerReminder(reminder);
    }, delay);

    reminder.scheduled = true;
  }

  triggerReminder(reminder) {
    const message = reminder.type === 'assignment' 
      ? `Assignment "${reminder.title}" is due ${this.formatTimeUntil(reminder.dueDate)}`
      : reminder.message;

    this.showNotification('Assignment Reminder', {
      body: message,
      type: 'warning',
      tag: `assignment-${reminder.assignmentId}`,
      requireInteraction: true,
      onClick: () => {
        // Navigate to assignment details
        window.location.hash = `#assignment-${reminder.assignmentId}`;
      }
    });

    // Remove reminder after triggering
    this.reminders = this.reminders.filter(r => r.id !== reminder.id);
  }

  formatTimeUntil(dueDate) {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = due.getTime() - now.getTime();

    if (diff < 0) return 'overdue';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `in ${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `in ${hours} hour${hours > 1 ? 's' : ''}`;
    return 'soon';
  }

  // Study session reminders
  scheduleStudyReminder(subject, time, message) {
    const reminder = {
      id: Date.now() + Math.random(),
      type: 'study',
      subject,
      time,
      message,
      scheduled: false
    };

    this.reminders.push(reminder);
    this.scheduleReminder(reminder);
    return reminder.id;
  }

  // Break reminders
  scheduleBreakReminder(duration) {
    const reminder = {
      id: Date.now() + Math.random(),
      type: 'break',
      duration,
      scheduled: false
    };

    this.reminders.push(reminder);
    
    reminder.timeoutId = setTimeout(() => {
      this.triggerBreakReminder(reminder);
    }, duration);

    reminder.scheduled = true;
    return reminder.id;
  }

  triggerBreakReminder(reminder) {
    this.showNotification('Time for a break!', {
      body: `You've been studying for a while. Take a ${Math.round(reminder.duration / 60000)} minute break to recharge.`,
      type: 'info',
      tag: 'break-reminder'
    });

    this.reminders = this.reminders.filter(r => r.id !== reminder.id);
  }

  // Achievement notifications
  showAchievement(achievement) {
    this.showNotification('🎉 Achievement Unlocked!', {
      body: achievement.description,
      type: 'success',
      duration: 8000,
      requireInteraction: false
    });
  }

  // Streak notifications
  showStreakUpdate(streakCount) {
    const message = streakCount === 1 
      ? 'Started a new study streak! Keep it up!'
      : `You're on a ${streakCount} day streak! Amazing consistency!`;

    this.showNotification('🔥 Streak Update', {
      body: message,
      type: 'success',
      duration: 6000
    });
  }

  // Timer notifications
  showTimerComplete(sessionType, duration) {
    const sessionTypeMap = {
      pomodoro: 'Pomodoro Session',
      study: 'Study Session',
      break: 'Break Time'
    };

    this.showNotification('⏰ Timer Complete', {
      body: `${sessionTypeMap[sessionType]} of ${Math.round(duration / 60000)} minutes is done!`,
      type: 'info',
      requireInteraction: true
    });
  }

  // Cancel reminder
  cancelReminder(reminderId) {
    const reminder = this.reminders.find(r => r.id === reminderId);
    if (reminder && reminder.timeoutId) {
      clearTimeout(reminder.timeoutId);
    }
    this.reminders = this.reminders.filter(r => r.id !== reminderId);
  }

  // Get all active reminders
  getActiveReminders() {
    return this.reminders.filter(r => r.scheduled);
  }

  // Clear all reminders
  clearAllReminders() {
    this.reminders.forEach(reminder => {
      if (reminder.timeoutId) {
        clearTimeout(reminder.timeoutId);
      }
    });
    this.reminders = [];
  }

  // Initialize notification styles
  initializeStyles() {
    const styleId = 'notification-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @media (max-width: 768px) {
          .notification-container {
            top: 10px !important;
            right: 10px !important;
            left: 10px !important;
            max-width: none !important;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }
}

// Global notification manager instance
export const notificationManager = new NotificationManager();

// Initialize styles
notificationManager.initializeStyles();

// Export convenience functions
export const showNotification = (title, options) => notificationManager.showNotification(title, options);
export const scheduleAssignmentReminder = (assignment, reminderTime) => 
  notificationManager.scheduleAssignmentReminder(assignment, reminderTime);
export const showAchievement = (achievement) => notificationManager.showAchievement(achievement);
export const showStreakUpdate = (streakCount) => notificationManager.showStreakUpdate(streakCount);
export const showTimerComplete = (sessionType, duration) => 
  notificationManager.showTimerComplete(sessionType, duration);
