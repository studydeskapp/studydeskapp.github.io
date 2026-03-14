import React from 'react';

/**
 * Mobile Header - Clean header with hamburger menu
 */
function MobileHeader({ user, game, onMenuClick, title = 'StudyDesk', darkMode, onToggleDarkMode, onSignOut }) {
  return (
    <header className="mobile-header-new">
      <div className="mobile-header-content">
        <button 
          className="mobile-header-hamburger"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        <h1 className="mobile-header-title">
          <span className="mobile-header-title-text">{title}</span>
        </h1>
        
        <div className="mobile-header-actions">
          {game?.streak > 0 && (
            <div className="mobile-header-streak">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2c1.5 3 4 4 7 4-3.5 3.5-3.5 9.5 0 13-3 0-5.5-1-7-3-1.5 2-4 3-7 3 3.5-3.5 3.5-9.5 0-13 3 0 5.5-1 7-4z"/>
              </svg>
              <span>{game.streak}</span>
            </div>
          )}
          <div className="mobile-header-points">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <span>{game?.points || 0}</span>
          </div>
          
          <button 
            className="mobile-header-icon-btn"
            onClick={onToggleDarkMode}
            aria-label={darkMode ? 'Light Mode' : 'Dark Mode'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {darkMode ? (
                <>
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </>
              ) : (
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              )}
            </svg>
          </button>
          
          <button 
            className="mobile-header-icon-btn danger"
            onClick={onSignOut}
            aria-label="Sign Out"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

export default MobileHeader;
