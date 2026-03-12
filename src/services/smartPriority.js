// ┌──────────────────────────────────────────────────────────────────────────────┐
// │  SMART PRIORITIZATION LOGIC                                                  │
// │  AI-powered assignment prioritization and recommendations                    │
// └──────────────────────────────────────────────────────────────────────────────┘

export function calculatePriorityScore(assignment, allAssignments, classes) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let score = 0;
  const factors = [];
  
  // Factor 1: Due date urgency (0-40 points)
  if (assignment.dueDate) {
    const dueDate = new Date(assignment.dueDate);
    const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue < 0) {
      score += 40; // Overdue - highest priority
      factors.push({ factor: 'Overdue', points: 40, icon: '🚨' });
    } else if (daysUntilDue === 0) {
      score += 35;
      factors.push({ factor: 'Due today', points: 35, icon: '⏰' });
    } else if (daysUntilDue === 1) {
      score += 30;
      factors.push({ factor: 'Due tomorrow', points: 30, icon: '📅' });
    } else if (daysUntilDue <= 3) {
      score += 20;
      factors.push({ factor: 'Due very soon', points: 20, icon: '⏳' });
    } else if (daysUntilDue <= 7) {
      score += 10;
      factors.push({ factor: 'Due this week', points: 10, icon: '📆' });
    }
  }
  
  // Factor 2: Priority level (0-25 points)
  if (assignment.priority === 'high') {
    score += 25;
    factors.push({ factor: 'High priority', points: 25, icon: '🔴' });
  } else if (assignment.priority === 'medium') {
    score += 15;
    factors.push({ factor: 'Medium priority', points: 15, icon: '🟡' });
  } else {
    score += 5;
    factors.push({ factor: 'Low priority', points: 5, icon: '🟢' });
  }
  
  // Factor 3: Progress (0-15 points) - less progress = higher priority
  const progressScore = Math.round((100 - assignment.progress) / 100 * 15);
  if (progressScore > 0) {
    score += progressScore;
    factors.push({ factor: `${assignment.progress}% complete`, points: progressScore, icon: '📊' });
  }
  
  // Factor 4: Subject performance (0-10 points)
  // If student struggles with this subject (low avg grade), prioritize it
  const subjectAssignments = allAssignments.filter(a => 
    a.subject === assignment.subject && a.grade != null
  );
  
  if (subjectAssignments.length > 0) {
    const avgGrade = subjectAssignments.reduce((sum, a) => sum + a.grade, 0) / subjectAssignments.length;
    if (avgGrade < 70) {
      score += 10;
      factors.push({ factor: 'Struggling subject', points: 10, icon: '📚' });
    } else if (avgGrade < 80) {
      score += 5;
      factors.push({ factor: 'Needs attention', points: 5, icon: '📖' });
    }
  }
  
  // Factor 5: Assignment type detection (0-10 points)
  const title = assignment.title.toLowerCase();
  if (title.includes('test') || title.includes('exam') || title.includes('quiz')) {
    score += 10;
    factors.push({ factor: 'Assessment', points: 10, icon: '📝' });
  } else if (title.includes('project') || title.includes('presentation')) {
    score += 8;
    factors.push({ factor: 'Major project', points: 8, icon: '🎯' });
  } else if (title.includes('essay') || title.includes('paper')) {
    score += 7;
    factors.push({ factor: 'Writing assignment', points: 7, icon: '✍️' });
  }
  
  return { score, factors };
}

export function getSmartRecommendations(assignments, classes, game) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Filter to incomplete assignments
  const incomplete = assignments.filter(a => a.progress < 100);
  
  // Calculate scores for all incomplete assignments
  const scored = incomplete.map(a => ({
    ...a,
    ...calculatePriorityScore(a, assignments, classes)
  }));
  
  // Sort by score (highest first)
  scored.sort((a, b) => b.score - a.score);
  
  // Get top 5 recommendations
  const recommendations = scored.slice(0, 5);
  
  // Generate insights
  const insights = [];
  
  // Check for overdue
  const overdue = incomplete.filter(a => {
    if (!a.dueDate) return false;
    const due = new Date(a.dueDate);
    return due < today;
  });
  
  if (overdue.length > 0) {
    insights.push({
      type: 'warning',
      icon: '⚠️',
      title: 'Overdue Assignments',
      message: `You have ${overdue.length} overdue assignment${overdue.length > 1 ? 's' : ''}. Focus on these first to get back on track.`,
      count: overdue.length
    });
  }
  
  // Check for due today/tomorrow
  const urgent = incomplete.filter(a => {
    if (!a.dueDate) return false;
    const due = new Date(a.dueDate);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return due <= tomorrow;
  });
  
  if (urgent.length > 0 && overdue.length === 0) {
    insights.push({
      type: 'urgent',
      icon: '🔥',
      title: 'Due Very Soon',
      message: `${urgent.length} assignment${urgent.length > 1 ? 's are' : ' is'} due today or tomorrow. Time to focus!`,
      count: urgent.length
    });
  }
  
  // Check for high priority items
  const highPriority = incomplete.filter(a => a.priority === 'high');
  if (highPriority.length > 0 && overdue.length === 0 && urgent.length === 0) {
    insights.push({
      type: 'priority',
      icon: '🎯',
      title: 'High Priority Work',
      message: `You have ${highPriority.length} high-priority assignment${highPriority.length > 1 ? 's' : ''}. These are important!`,
      count: highPriority.length
    });
  }
  
  // Check for subjects that need attention
  const subjectPerformance = {};
  assignments.filter(a => a.grade != null).forEach(a => {
    if (!subjectPerformance[a.subject]) {
      subjectPerformance[a.subject] = { total: 0, sum: 0 };
    }
    subjectPerformance[a.subject].total++;
    subjectPerformance[a.subject].sum += a.grade;
  });
  
  const strugglingSubjects = Object.entries(subjectPerformance)
    .filter(([_, stats]) => stats.total >= 2 && (stats.sum / stats.total) < 75)
    .map(([subject, stats]) => ({ subject, avg: Math.round(stats.sum / stats.total) }));
  
  if (strugglingSubjects.length > 0) {
    const subject = strugglingSubjects[0];
    insights.push({
      type: 'info',
      icon: '📚',
      title: 'Subject Needs Attention',
      message: `Your ${subject.subject} average is ${subject.avg}%. Consider spending extra time on this subject.`,
      subject: subject.subject
    });
  }
  
  // Positive reinforcement
  if (overdue.length === 0 && urgent.length === 0 && game.streak >= 3) {
    insights.push({
      type: 'success',
      icon: '✨',
      title: 'Great Work!',
      message: `You're ${game.streak} days into your streak and have no urgent assignments. Keep up the momentum!`,
      count: game.streak
    });
  }
  
  return { recommendations, insights };
}

export function getTimeBasedSuggestion(assignments, classes) {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay(); // 0 = Sunday
  
  // Get current or next class
  const currentDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek];
  const currentTime = `${String(hour).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  const todayClasses = classes.filter(c => c.days.includes(currentDay));
  
  // Find next class
  let nextClass = null;
  for (const cls of todayClasses) {
    if (cls.startTime > currentTime) {
      nextClass = cls;
      break;
    }
  }
  
  // Time-based suggestions
  if (hour >= 6 && hour < 8) {
    return {
      time: 'morning',
      icon: '🌅',
      title: 'Good Morning!',
      message: 'Morning is great for tackling difficult assignments. Your brain is fresh!',
      suggestion: 'Start with your most challenging work.'
    };
  } else if (hour >= 8 && hour < 12) {
    return {
      time: 'late-morning',
      icon: '☀️',
      title: 'Peak Focus Time',
      message: 'This is prime productivity time. Make the most of it!',
      suggestion: nextClass ? `You have ${nextClass.name} coming up. Review related assignments.` : 'Focus on high-priority tasks.'
    };
  } else if (hour >= 12 && hour < 14) {
    return {
      time: 'lunch',
      icon: '🍽️',
      title: 'Lunch Break',
      message: 'Take a proper break! Your brain needs rest too.',
      suggestion: 'Quick review or light reading works well now.'
    };
  } else if (hour >= 14 && hour < 17) {
    return {
      time: 'afternoon',
      icon: '📚',
      title: 'Afternoon Study',
      message: 'Good time for collaborative work or practice problems.',
      suggestion: 'Work on assignments that require active engagement.'
    };
  } else if (hour >= 17 && hour < 20) {
    return {
      time: 'evening',
      icon: '🌆',
      title: 'Evening Session',
      message: 'Great time to review what you learned today.',
      suggestion: 'Focus on completing started assignments.'
    };
  } else if (hour >= 20 && hour < 23) {
    return {
      time: 'night',
      icon: '🌙',
      title: 'Night Study',
      message: 'Wind down with lighter tasks. Avoid starting new complex work.',
      suggestion: 'Review notes, organize, or do simple homework.'
    };
  } else {
    return {
      time: 'late-night',
      icon: '😴',
      title: 'Time to Rest',
      message: 'Sleep is crucial for learning! Get some rest.',
      suggestion: 'Save your work and get a good night\'s sleep.'
    };
  }
}
