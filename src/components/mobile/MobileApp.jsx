import React, { useState } from 'react';
import MobileHeader from './MobileHeader';
import MobileNav from './MobileNav';
import HomeView from './views/HomeView';
import TasksView from './views/TasksView';
import ScheduleView from './views/ScheduleView';
import GradesView from './views/GradesView';
import BuddyView from './views/BuddyView';
import ShopView from './views/ShopView';
import TimerView from './views/TimerView';
import AIView from './views/AIView';
import BottomSheet from './BottomSheet';
import '../../styles/mobile.css';

/**
 * Mobile App Container - Main mobile UI wrapper
 * Handles navigation, state, and view rendering
 */
function MobileApp({ 
  user,
  assignments,
  setAssignments,
  classes,
  game,
  setGame,
  darkMode,
  setDarkMode,
  onAddAssignment,
  onAddClass,
  onSignOut,
  // Timer props
  timerMode,
  setTimerMode,
  timerSeconds,
  timerRunning,
  timerSessions,
  startTimer,
  resetTimer,
  fmtTimer,
  customFocus,
  setCustomFocus,
  customShort,
  setCustomShort,
  customLong,
  setCustomLong,
  // Shop props
  buyItem,
  equipItem
}) {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  const tabTitles = {
    home: 'StudyDesk',
    tasks: 'Tasks',
    schedule: 'Schedule',
    grades: 'Grades',
    buddy: 'Buddy',
    shop: 'Shop',
    timer: 'Timer',
    ai: 'AI'
  };

  // Handle assignment completion
  const handleCompleteAssignment = (assignmentId) => {
    setAssignments(prev => prev.map(a => {
      if (a.id === assignmentId) {
        const wasIncomplete = a.progress < 100;
        const newProgress = 100;
        
        // Update game points if completing for first time
        if (wasIncomplete) {
          const today = new Date().toISOString().split('T')[0];
          const todayCompleted = assignments.filter(a => {
            const completedDate = a.completedDate?.split('T')[0];
            return completedDate === today;
          }).length;

          // Award points
          let pointsEarned = 15; // Base points
          
          // Check for daily quest completion (3 tasks)
          if (todayCompleted + 1 >= 3) {
            const streakBonus = Math.round(10 + game.streak * 4);
            pointsEarned += streakBonus;
          }

          setGame(prev => ({
            ...prev,
            points: prev.points + pointsEarned
          }));

          // Show celebration animation
          showCompletionAnimation(pointsEarned);
        }

        return {
          ...a,
          progress: newProgress,
          completedDate: new Date().toISOString()
        };
      }
      return a;
    }));
  };

  const showCompletionAnimation = (points) => {
    // TODO: Add confetti/celebration animation
    console.log(`🎉 +${points} points!`);
  };

  const handleAssignmentClick = (assignment) => {
    setSelectedAssignment(assignment);
  };

  const handleAddTask = () => {
    onAddAssignment();
  };

  const handleAddClass = () => {
    onAddClass();
  };

  const renderView = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeView
            assignments={assignments}
            classes={classes}
            game={game}
            onCompleteAssignment={handleCompleteAssignment}
            onAssignmentClick={handleAssignmentClick}
            onAddTask={handleAddTask}
          />
        );
      
      case 'tasks':
        return (
          <TasksView
            assignments={assignments}
            onCompleteAssignment={handleCompleteAssignment}
            onAssignmentClick={handleAssignmentClick}
            onAddTask={handleAddTask}
          />
        );
      
      case 'schedule':
        return (
          <ScheduleView
            classes={classes}
            onAddClass={handleAddClass}
          />
        );
      
      case 'grades':
        return (
          <GradesView
            assignments={assignments}
            classes={classes}
          />
        );
      
      case 'buddy':
        return (
          <BuddyView
            game={game}
            assignments={assignments}
          />
        );
      
      case 'shop':
        return (
          <ShopView
            game={game}
            onBuyItem={buyItem}
            onEquipItem={equipItem}
          />
        );
      
      case 'timer':
        return (
          <TimerView
            timerMode={timerMode}
            setTimerMode={setTimerMode}
            timerSeconds={timerSeconds}
            timerRunning={timerRunning}
            timerSessions={timerSessions}
            startTimer={startTimer}
            resetTimer={resetTimer}
            fmtTimer={fmtTimer}
            customFocus={customFocus}
            setCustomFocus={setCustomFocus}
            customShort={customShort}
            setCustomShort={setCustomShort}
            customLong={customLong}
            setCustomLong={setCustomLong}
          />
        );
      
      case 'ai':
        return (
          <AIView
            assignments={assignments}
            classes={classes}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`mobile-container ${darkMode ? 'dark' : ''}`}>
      <MobileHeader
        user={user}
        game={game}
        onMenuClick={() => setShowMenu(true)}
        title={tabTitles[activeTab]}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onSignOut={onSignOut}
      />
      
      <div className="mobile-content">
        {renderView()}
      </div>

      <MobileNav
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        game={game}
        onSignOut={onSignOut}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />

      {/* Assignment Detail Sheet */}
      <BottomSheet
        isOpen={!!selectedAssignment}
        onClose={() => setSelectedAssignment(null)}
        title={selectedAssignment?.title}
      >
        {selectedAssignment && (
          <div>
            <p><strong>Subject:</strong> {selectedAssignment.subject}</p>
            <p><strong>Due:</strong> {selectedAssignment.dueDate}</p>
            <p><strong>Priority:</strong> {selectedAssignment.priority}</p>
            {selectedAssignment.notes && (
              <p><strong>Notes:</strong> {selectedAssignment.notes}</p>
            )}
            <button 
              className="btn-primary"
              onClick={() => {
                handleCompleteAssignment(selectedAssignment.id);
                setSelectedAssignment(null);
              }}
              style={{ width: '100%', marginTop: '16px' }}
            >
              Mark Complete
            </button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

export default MobileApp;
