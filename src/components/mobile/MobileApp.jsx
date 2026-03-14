import React, { useState, useEffect, useRef } from 'react';
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
 * Handles navigation, state, and view rendering with enhanced mobile features
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
  const [showFABMenu, setShowFABMenu] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPoints, setCelebrationPoints] = useState(0);
  
  const contentRef = useRef(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const pullStartY = useRef(0);
  const isPulling = useRef(false);

  const tabOrder = ['home', 'tasks', 'schedule', 'grades', 'buddy', 'shop', 'timer', 'ai'];

  // Online/Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Pull-to-refresh
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const handleTouchStart = (e) => {
      if (content.scrollTop === 0) {
        pullStartY.current = e.touches[0].clientY;
        isPulling.current = true;
      }
    };

    const handleTouchMove = (e) => {
      if (!isPulling.current) return;
      
      const currentY = e.touches[0].clientY;
      const pullDistance = currentY - pullStartY.current;
      
      if (pullDistance > 80 && !isRefreshing) {
        triggerRefresh();
      }
    };

    const handleTouchEnd = () => {
      isPulling.current = false;
    };

    content.addEventListener('touchstart', handleTouchStart);
    content.addEventListener('touchmove', handleTouchMove);
    content.addEventListener('touchend', handleTouchEnd);

    return () => {
      content.removeEventListener('touchstart', handleTouchStart);
      content.removeEventListener('touchmove', handleTouchMove);
      content.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isRefreshing]);

  // Swipe between tabs
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const handleTouchStart = (e) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX.current;
      const deltaY = touchEndY - touchStartY.current;

      // Only trigger if horizontal swipe is dominant
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 100) {
        const currentIndex = tabOrder.indexOf(activeTab);
        
        if (deltaX > 0 && currentIndex > 0) {
          // Swipe right - previous tab
          setActiveTab(tabOrder[currentIndex - 1]);
          triggerHaptic('light');
        } else if (deltaX < 0 && currentIndex < tabOrder.length - 1) {
          // Swipe left - next tab
          setActiveTab(tabOrder[currentIndex + 1]);
          triggerHaptic('light');
        }
      }
    };

    content.addEventListener('touchstart', handleTouchStart);
    content.addEventListener('touchend', handleTouchEnd);

    return () => {
      content.removeEventListener('touchstart', handleTouchStart);
      content.removeEventListener('touchend', handleTouchEnd);
    };
  }, [activeTab]);

  const triggerRefresh = async () => {
    setIsRefreshing(true);
    triggerHaptic('medium');
    
    // Simulate refresh - in real app, this would fetch new data
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsRefreshing(false);
    triggerHaptic('success');
  };

  const triggerHaptic = (type = 'light') => {
    if ('vibrate' in navigator) {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(20);
          break;
        case 'heavy':
          navigator.vibrate(30);
          break;
        case 'success':
          navigator.vibrate([10, 50, 10]);
          break;
        default:
          navigator.vibrate(10);
      }
    }
  };

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

  // Handle assignment completion with celebration
  const handleCompleteAssignment = (assignmentId) => {
    triggerHaptic('medium');
    
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
    setCelebrationPoints(points);
    setShowCelebration(true);
    triggerHaptic('success');
    
    setTimeout(() => {
      setShowCelebration(false);
    }, 2500);
  };

  const handleAssignmentClick = (assignment) => {
    triggerHaptic('light');
    setSelectedAssignment(assignment);
  };

  const handleAddTask = () => {
    triggerHaptic('medium');
    setShowFABMenu(false);
    onAddAssignment();
  };

  const handleAddClass = () => {
    triggerHaptic('medium');
    setShowFABMenu(false);
    onAddClass();
  };

  const handleTabChange = (tab) => {
    triggerHaptic('light');
    setActiveTab(tab);
    setShowMenu(false);
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
      {/* Offline Banner */}
      {!isOnline && (
        <div className="offline-banner">
          <span className="offline-icon">📡</span>
          You're offline - some features may be limited
        </div>
      )}

      {/* Pull-to-Refresh Indicator */}
      {isRefreshing && (
        <div className="pull-to-refresh-indicator refreshing">
          <div className="pull-to-refresh-spinner" />
        </div>
      )}

      <MobileHeader
        user={user}
        game={game}
        onMenuClick={() => {
          triggerHaptic('light');
          setShowMenu(true);
        }}
        title={tabTitles[activeTab]}
        darkMode={darkMode}
        onToggleDarkMode={() => {
          triggerHaptic('light');
          setDarkMode(!darkMode);
        }}
        onSignOut={onSignOut}
      />
      
      <div className="mobile-content" ref={contentRef}>
        {renderView()}
      </div>

      {/* Floating Action Button with Menu */}
      <div className="fab-container">
        <div className={`fab-menu ${showFABMenu ? 'open' : ''}`}>
          <button 
            className="fab-menu-item"
            onClick={handleAddTask}
          >
            <div className="fab-menu-item-icon">📝</div>
            <div className="fab-menu-item-label">Add Task</div>
          </button>
          <button 
            className="fab-menu-item"
            onClick={handleAddClass}
          >
            <div className="fab-menu-item-icon">📚</div>
            <div className="fab-menu-item-label">Add Class</div>
          </button>
        </div>
        
        <button 
          className={`fab ${showFABMenu ? 'open' : ''}`}
          onClick={() => {
            triggerHaptic('medium');
            setShowFABMenu(!showFABMenu);
          }}
        >
          +
        </button>
      </div>

      <MobileNav
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        game={game}
        onSignOut={onSignOut}
        darkMode={darkMode}
        onToggleDarkMode={() => {
          triggerHaptic('light');
          setDarkMode(!darkMode);
        }}
      />

      {/* Enhanced Assignment Detail Sheet */}
      <BottomSheet
        isOpen={!!selectedAssignment}
        onClose={() => setSelectedAssignment(null)}
        title=""
      >
        {selectedAssignment && (
          <div className="assignment-detail-sheet">
            <div className="assignment-detail-header">
              <h2 className="assignment-detail-title">{selectedAssignment.title}</h2>
              <div className="assignment-detail-meta">
                <span className="assignment-detail-badge">
                  📚 {selectedAssignment.subject}
                </span>
                <span className="assignment-detail-badge">
                  📅 {selectedAssignment.dueDate}
                </span>
                <span className="assignment-detail-badge">
                  ⚡ {selectedAssignment.priority}
                </span>
              </div>
            </div>
            
            <div className="assignment-detail-body">
              {selectedAssignment.notes && (
                <div className="assignment-detail-section">
                  <div className="assignment-detail-label">Notes</div>
                  <div className="assignment-detail-value">{selectedAssignment.notes}</div>
                </div>
              )}
              
              <div className="assignment-detail-section">
                <div className="assignment-detail-label">Progress</div>
                <div className="assignment-detail-progress">
                  <div className="assignment-detail-progress-bar">
                    <div 
                      className="assignment-detail-progress-fill"
                      style={{ width: `${selectedAssignment.progress || 0}%` }}
                    />
                  </div>
                  <div className="assignment-detail-progress-text">
                    {selectedAssignment.progress || 0}% complete
                  </div>
                </div>
              </div>
            </div>
            
            <div className="assignment-detail-actions">
              {selectedAssignment.progress < 100 && (
                <button 
                  className="btn-detail-action primary"
                  onClick={() => {
                    handleCompleteAssignment(selectedAssignment.id);
                    setSelectedAssignment(null);
                  }}
                >
                  ✓ Mark Complete
                </button>
              )}
              <button 
                className="btn-detail-action secondary"
                onClick={() => setSelectedAssignment(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Completion Celebration */}
      {showCelebration && (
        <div className="completion-celebration">
          <div className="celebration-content">
            <div className="celebration-icon">🎉</div>
            <div className="celebration-title">Great Job!</div>
            <div className="celebration-points">+{celebrationPoints} points</div>
            <div className="celebration-message">Keep up the amazing work!</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MobileApp;
