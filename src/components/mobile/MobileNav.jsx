import React from 'react';

/**
 * Hamburger Menu - Slide-out navigation drawer
 */
function MobileNav({ isOpen, onClose, activeTab, onTabChange, game, onSignOut, darkMode, onToggleDarkMode }) {
  const tabs = [
    { 
      id: 'home', 
      label: 'Home',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    },
    { 
      id: 'tasks', 
      label: 'Tasks',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
    },
    { 
      id: 'schedule', 
      label: 'Schedule',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
    },
    { 
      id: 'grades', 
      label: 'Grades',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
    },
    { 
      id: 'buddy', 
      label: 'Buddy',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
      badge: game?.streak > 0 ? game.streak : null
    },
    { 
      id: 'shop', 
      label: 'Shop',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
    },
    { 
      id: 'timer', 
      label: 'Timer',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M9 1h6M12 1v3"/></svg>
    },
    { 
      id: 'ai', 
      label: 'AI',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 8v4l3 3"/><circle cx="18" cy="5" r="3" fill="currentColor" stroke="none"/></svg>
    },
  ];

  if (!isOpen) return null;

  return (
    <>
      <div className="mobile-nav-overlay" onClick={onClose} />
      <nav className="mobile-nav-drawer">
        <div className="mobile-nav-header">
          <button className="mobile-nav-header-btn" onClick={onClose}>
            <h2 className="mobile-nav-title">Menu</h2>
          </button>
        </div>

        <div className="mobile-nav-items">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`mobile-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => {
                onTabChange(tab.id);
                onClose();
              }}
            >
              <span className="mobile-nav-item-icon">{tab.icon}</span>
              <span className="mobile-nav-item-label">{tab.label}</span>
              {tab.badge && <span className="mobile-nav-item-badge">{tab.badge}</span>}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}

export default MobileNav;
