// ┌──────────────────────────────────────────────────────────────────────────────┐
// │  ASSIGNMENT TEMPLATE LOGIC                                                   │
// │  Handles recurring assignment templates and auto-creation                   │
// └──────────────────────────────────────────────────────────────────────────────┘

export function createTemplateFromAssignment(assignment) {
  return {
    id: Date.now().toString(),
    name: assignment.title,
    subject: assignment.subject,
    priority: assignment.priority,
    notes: assignment.notes || '',
    recurrence: 'weekly', // weekly | biweekly | monthly | custom
    dayOfWeek: null, // 0-6 for weekly templates
    dayOfMonth: null, // 1-31 for monthly templates
    customDays: [], // for custom recurrence
    active: true,
    createdAt: new Date().toISOString(),
    lastCreated: null
  };
}

export function shouldCreateFromTemplate(template, lastCreated, today = new Date()) {
  if (!template.active) return false;
  
  today.setHours(0, 0, 0, 0);
  
  // If never created, create it
  if (!lastCreated) return true;
  
  const last = new Date(lastCreated);
  last.setHours(0, 0, 0, 0);
  
  // Check based on recurrence type
  if (template.recurrence === 'weekly') {
    // Check if it's the right day of week and at least 7 days since last creation
    const daysSince = Math.floor((today - last) / (1000 * 60 * 60 * 24));
    const todayDayOfWeek = today.getDay();
    
    return daysSince >= 7 && todayDayOfWeek === template.dayOfWeek;
  } else if (template.recurrence === 'biweekly') {
    const daysSince = Math.floor((today - last) / (1000 * 60 * 60 * 24));
    const todayDayOfWeek = today.getDay();
    
    return daysSince >= 14 && todayDayOfWeek === template.dayOfWeek;
  } else if (template.recurrence === 'monthly') {
    const daysSince = Math.floor((today - last) / (1000 * 60 * 60 * 24));
    const todayDayOfMonth = today.getDate();
    
    return daysSince >= 28 && todayDayOfMonth === template.dayOfMonth;
  } else if (template.recurrence === 'custom') {
    // Custom days - check if today is in the list and enough time has passed
    const daysSince = Math.floor((today - last) / (1000 * 60 * 60 * 24));
    const todayDayOfWeek = today.getDay();
    
    return daysSince >= 1 && template.customDays.includes(todayDayOfWeek);
  }
  
  return false;
}

export function createAssignmentFromTemplate(template, dueDate = null) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Calculate due date if not provided
  if (!dueDate) {
    if (template.recurrence === 'weekly' || template.recurrence === 'biweekly') {
      // Due next occurrence of the day
      const daysUntilDue = (template.dayOfWeek - today.getDay() + 7) % 7 || 7;
      dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + daysUntilDue);
    } else if (template.recurrence === 'monthly') {
      dueDate = new Date(today.getFullYear(), today.getMonth(), template.dayOfMonth);
      if (dueDate <= today) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      }
    } else {
      // Default to 7 days from now
      dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + 7);
    }
  }
  
  return {
    id: Date.now().toString(),
    title: template.name,
    subject: template.subject,
    dueDate: dueDate.toISOString().split('T')[0],
    priority: template.priority,
    progress: 0,
    notes: template.notes,
    grade: null,
    createdAt: new Date().toISOString(),
    fromTemplate: template.id,
    source: 'template'
  };
}

export function checkAndCreateFromTemplates(templates, assignments, setAssignments) {
  const today = new Date();
  const created = [];
  
  templates.forEach(template => {
    // Find last assignment created from this template
    const lastFromTemplate = assignments
      .filter(a => a.fromTemplate === template.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    
    const lastCreated = lastFromTemplate?.createdAt || null;
    
    if (shouldCreateFromTemplate(template, lastCreated, today)) {
      const newAssignment = createAssignmentFromTemplate(template);
      created.push(newAssignment);
    }
  });
  
  if (created.length > 0) {
    setAssignments(prev => [...prev, ...created]);
  }
  
  return created;
}

export function getTemplatePreview(template) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  let schedule = '';
  if (template.recurrence === 'weekly') {
    schedule = `Every ${days[template.dayOfWeek]}`;
  } else if (template.recurrence === 'biweekly') {
    schedule = `Every other ${days[template.dayOfWeek]}`;
  } else if (template.recurrence === 'monthly') {
    schedule = `Monthly on the ${template.dayOfMonth}${getOrdinalSuffix(template.dayOfMonth)}`;
  } else if (template.recurrence === 'custom') {
    const customDayNames = template.customDays.map(d => days[d].slice(0, 3));
    schedule = `Every ${customDayNames.join(', ')}`;
  }
  
  return schedule;
}

function getOrdinalSuffix(day) {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

export function validateTemplate(template) {
  const errors = [];
  
  if (!template.name || template.name.trim().length === 0) {
    errors.push('Template name is required');
  }
  
  if (!template.subject || template.subject.trim().length === 0) {
    errors.push('Subject is required');
  }
  
  if (template.recurrence === 'weekly' || template.recurrence === 'biweekly') {
    if (template.dayOfWeek === null || template.dayOfWeek < 0 || template.dayOfWeek > 6) {
      errors.push('Day of week must be selected');
    }
  } else if (template.recurrence === 'monthly') {
    if (template.dayOfMonth === null || template.dayOfMonth < 1 || template.dayOfMonth > 31) {
      errors.push('Day of month must be between 1 and 31');
    }
  } else if (template.recurrence === 'custom') {
    if (!template.customDays || template.customDays.length === 0) {
      errors.push('At least one day must be selected for custom recurrence');
    }
  }
  
  return { valid: errors.length === 0, errors };
}
