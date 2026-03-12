// ┌──────────────────────────────────────────────────────────────────────────────┐
// │  BUDDY INTERACTION LOGIC                                                     │
// │  Handles buddy reactions, quotes, and animations                            │
// └──────────────────────────────────────────────────────────────────────────────┘

export const BUDDY_QUOTES = {
  welcome: [
    "Ready to crush some homework? 💪",
    "Let's make today productive! ✨",
    "Your study buddy is here to help! 🎓",
    "Time to level up your learning! 🚀",
    "Let's do this together! 🌟"
  ],
  completed: [
    "Amazing work! Keep it up! 🎉",
    "You're on fire! 🔥",
    "That's what I'm talking about! ⭐",
    "Crushing it! Way to go! 💪",
    "You're unstoppable! 🚀",
    "Brilliant! Another one done! ✨",
    "You're making this look easy! 😎"
  ],
  streak: [
    "Your streak is incredible! 🔥",
    "Consistency is key - you've got it! 📈",
    "Day after day, you show up! 💪",
    "This streak is legendary! 👑",
    "Keep that momentum going! 🚀"
  ],
  overdue: [
    "Let's tackle those overdue items! 💪",
    "No worries, we can catch up! 🎯",
    "One step at a time, you've got this! 🌟",
    "Let's get back on track together! 🚀",
    "Every assignment completed is progress! ✨"
  ],
  encouragement: [
    "You're doing great! Keep going! 💫",
    "Believe in yourself! 🌟",
    "Small steps lead to big wins! 🎯",
    "You've got this! 💪",
    "Progress, not perfection! ✨",
    "Every effort counts! 🚀",
    "You're stronger than you think! 💙"
  ],
  study: [
    "Focus time! Let's do this! 🎯",
    "Study mode: activated! 📚",
    "Time to learn something awesome! 🧠",
    "Let's make these minutes count! ⏰",
    "You're investing in your future! 🌟"
  ],
  break: [
    "Great work! Time for a break! ☕",
    "You earned this rest! 😌",
    "Recharge and come back stronger! 🔋",
    "Breaks are part of productivity! 🌸",
    "Rest up, you're doing amazing! ✨"
  ],
  milestone: [
    "Wow! You hit a major milestone! 🎊",
    "This is huge! Celebrate this win! 🎉",
    "You're reaching new heights! 🏆",
    "Incredible achievement! 👏",
    "This calls for a celebration! 🎈"
  ]
};

export function getBuddyQuote(category = 'encouragement') {
  const quotes = BUDDY_QUOTES[category] || BUDDY_QUOTES.encouragement;
  return quotes[Math.floor(Math.random() * quotes.length)];
}

export function getBuddyMood(game, assignments) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const overdue = assignments.filter(a => {
    if (a.progress >= 100 || !a.dueDate) return false;
    const due = new Date(a.dueDate);
    return due < today;
  });
  
  const completed = assignments.filter(a => a.progress >= 100);
  const completionRate = assignments.length > 0 
    ? (completed.length / assignments.length) * 100 
    : 0;
  
  // Determine mood based on stats
  if (game.streak >= 7 && completionRate >= 80) {
    return { mood: 'ecstatic', emoji: '🤩', animation: 'bounce' };
  } else if (game.streak >= 3 && overdue.length === 0) {
    return { mood: 'happy', emoji: '😊', animation: 'wiggle' };
  } else if (overdue.length > 3) {
    return { mood: 'concerned', emoji: '😟', animation: 'shake' };
  } else if (overdue.length > 0) {
    return { mood: 'worried', emoji: '😕', animation: 'none' };
  } else {
    return { mood: 'content', emoji: '😌', animation: 'float' };
  }
}

export function getBuddyReaction(event, data = {}) {
  const reactions = {
    assignmentCompleted: {
      animation: 'celebrate',
      quote: getBuddyQuote('completed'),
      duration: 3000
    },
    streakIncreased: {
      animation: 'fire',
      quote: getBuddyQuote('streak'),
      duration: 4000
    },
    timerStarted: {
      animation: 'focus',
      quote: getBuddyQuote('study'),
      duration: 2000
    },
    timerCompleted: {
      animation: 'relax',
      quote: getBuddyQuote('break'),
      duration: 3000
    },
    milestoneReached: {
      animation: 'party',
      quote: getBuddyQuote('milestone'),
      duration: 5000
    },
    overdueDetected: {
      animation: 'alert',
      quote: getBuddyQuote('overdue'),
      duration: 3000
    },
    login: {
      animation: 'wave',
      quote: getBuddyQuote('welcome'),
      duration: 3000
    }
  };
  
  return reactions[event] || { animation: 'none', quote: '', duration: 0 };
}

// Check if buddy should show a reaction based on time of day and user activity
export function shouldShowDailyQuote(lastQuoteTime) {
  if (!lastQuoteTime) return true;
  
  const now = new Date();
  const last = new Date(lastQuoteTime);
  
  // Show once per session (4 hours)
  const hoursSince = (now - last) / (1000 * 60 * 60);
  return hoursSince >= 4;
}

// Get contextual tip based on user's current situation
export function getBuddyTip(assignments, game, classes) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const overdue = assignments.filter(a => {
    if (a.progress >= 100 || !a.dueDate) return false;
    const due = new Date(a.dueDate);
    return due < today;
  });
  
  const dueSoon = assignments.filter(a => {
    if (a.progress >= 100 || !a.dueDate) return false;
    const due = new Date(a.dueDate);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 2);
    return due >= today && due <= tomorrow;
  });
  
  const highPriority = assignments.filter(a => 
    a.progress < 100 && a.priority === 'high'
  );
  
  // Priority tips
  if (overdue.length > 0) {
    return {
      type: 'warning',
      icon: '⚠️',
      title: 'Overdue Assignments',
      message: `You have ${overdue.length} overdue assignment${overdue.length > 1 ? 's' : ''}. Let's tackle the oldest one first!`,
      action: 'View Overdue'
    };
  }
  
  if (dueSoon.length > 0) {
    return {
      type: 'info',
      icon: '📅',
      title: 'Due Soon',
      message: `${dueSoon.length} assignment${dueSoon.length > 1 ? 's are' : ' is'} due in the next 2 days. Start early to avoid stress!`,
      action: 'View Upcoming'
    };
  }
  
  if (highPriority.length > 0) {
    return {
      type: 'priority',
      icon: '🎯',
      title: 'High Priority',
      message: `You have ${highPriority.length} high-priority assignment${highPriority.length > 1 ? 's' : ''}. These should be your focus!`,
      action: 'View Priority'
    };
  }
  
  if (game.streak >= 7) {
    return {
      type: 'success',
      icon: '🔥',
      title: 'Amazing Streak!',
      message: `${game.streak} days strong! You're building incredible study habits. Keep it up!`,
      action: null
    };
  }
  
  // Default encouragement
  return {
    type: 'encouragement',
    icon: '✨',
    title: 'You\'re Doing Great!',
    message: getBuddyQuote('encouragement'),
    action: null
  };
}
