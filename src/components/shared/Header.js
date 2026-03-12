import React from 'react';

function Header({ 
  user, 
  tab, 
  setTab, 
  darkMode, 
  setDarkMode, 
  handleLogoClick, 
  isMobile,
  showSearch,
  setShowSearch,
  searchQuery,
  setSearchQuery
}) {
  const tabs = [
    {id:"dashboard", label:"Dashboard", mobile:"📊"},
    {id:"assignments", label:"Assignments", mobile:"📝"},
    {id:"grades", label:"Grades", mobile:"📊"},
    {id:"schedule", label:"Schedule", mobile:"🏫"},
    {id:"timer", label:"Timer", mobile:"⏰"},
    {id:"buddy", label:"Buddy", mobile:"🐾"},
    {id:"shop", label:"Shop", mobile:"🛍️"},
    {id:"ai", label:"AI Assistant", mobile:"🤖"}
  ];

  if (isMobile) {
    return (
      <div className="mobile-header">
        <div className="mobile-top">
          <div className="logo-section" onClick={handleLogoClick}>
            <div className="logo">📚</div>
            <div className="app-name">Study Desk</div>
          </div>
          <div className="header-actions">
            <button className="icon-btn" onClick={() => setShowSearch(!showSearch)}>🔍</button>
            <button className="icon-btn" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
        
        {showSearch && (
          <div className="mobile-search">
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        )}
        
        <div className="mobile-nav">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`nav-btn ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.mobile}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="desktop-header">
      <div className="header-left">
        <div className="logo-section" onClick={handleLogoClick}>
          <div className="logo">📚</div>
          <div className="app-name">Study Desk</div>
        </div>
        
        <nav className="desktop-nav">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`nav-btn ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>
      
      <div className="header-right">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search assignments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        
        <button className="icon-btn" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? '☀️' : '🌙'}
        </button>
        
        <div className="user-info">
          <span>{user?.displayName || user?.email?.split('@')[0] || 'User'}</span>
        </div>
      </div>
    </div>
  );
}

export default Header;