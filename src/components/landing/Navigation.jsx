import React from 'react';

function Navigation({ onSignIn, onSignUp, darkMode, onToggleDarkMode, mobileMenuOpen, setMobileMenuOpen, showBack, onBack }) {
  return (
    <header role="banner" className="landing-nav">
      <nav aria-label="Main navigation" className="nav-container">
        {/* Logo */}
        <div className="nav-logo">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="40" height="40">
            <defs>
              <linearGradient id="sd-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1B1F3B"/>
                <stop offset="100%" stopColor="#2d3561"/>
              </linearGradient>
              <linearGradient id="sd-acc" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f5a623"/>
                <stop offset="100%" stopColor="#f7c059"/>
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="48" fill="url(#sd-bg)"/>
            <rect x="24" y="30" width="24" height="38" rx="3" fill="#fff" opacity="0.15"/>
            <rect x="26" y="30" width="22" height="38" rx="2" fill="#fff" opacity="0.9"/>
            <rect x="24" y="30" width="4" height="38" rx="2" fill="#ddd"/>
            <line x1="32" y1="40" x2="44" y2="40" stroke="#1B1F3B" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
            <line x1="32" y1="45" x2="44" y2="45" stroke="#1B1F3B" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
            <line x1="32" y1="50" x2="40" y2="50" stroke="#1B1F3B" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
            <circle cx="63" cy="57" r="16" fill="url(#sd-acc)"/>
            <polyline points="55,57 61,63 72,50" fill="none" stroke="#1B1F3B" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="nav-logo-text">StudyDesk</span>
        </div>

        {/* Desktop Navigation */}
        <div className="nav-desktop">
          {/* Back Button (if on Learn More page) */}
          {showBack && (
            <button 
              className="btn-secondary back-btn"
              onClick={onBack}
            >
              ← Back
            </button>
          )}

          {/* Dark Mode Toggle */}
          <button 
            className="dm-toggle"
            onClick={onToggleDarkMode}
            aria-label="Toggle dark mode"
          >
            <div className={`dm-knob ${darkMode ? 'dark' : ''}`}>
              {darkMode ? '🌙' : '☀️'}
            </div>
          </button>

          {/* Auth Buttons */}
          <div className="nav-auth-buttons">
            <button 
              className="btn-secondary"
              onClick={onSignIn}
            >
              Sign In
            </button>
            <button 
              className="btn-primary"
              onClick={onSignUp}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen && setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
          aria-label="Toggle mobile menu"
        >
          <span className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
      </nav>

      {/* Mobile Menu */}
      {setMobileMenuOpen && (
        <div 
          id="mobile-menu"
          className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}
        >
          <div className="mobile-menu-content">
            {showBack && (
              <button 
                className="btn-secondary mobile back-btn"
                onClick={() => {
                  onBack();
                  setMobileMenuOpen(false);
                }}
              >
                ← Back
              </button>
            )}
            
            <button 
              className="dm-toggle mobile"
              onClick={onToggleDarkMode}
              aria-label="Toggle dark mode"
            >
              <span>{darkMode ? '🌙' : '☀️'} {darkMode ? 'Dark' : 'Light'} Mode</span>
            </button>
            
            <button 
              className="btn-secondary mobile"
              onClick={() => {
                onSignIn();
                setMobileMenuOpen(false);
              }}
            >
              Sign In
            </button>
            
            <button 
              className="btn-primary mobile"
              onClick={() => {
                onSignUp();
                setMobileMenuOpen(false);
              }}
            >
              Sign Up
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navigation;