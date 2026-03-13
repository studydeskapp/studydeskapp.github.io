import React from 'react';
import Navigation from './Navigation';
import Footer from './Footer';
import { RELEASES } from '../../constants';

function ReleaseNotesPage({ onSignIn, onSignUp, onBack, darkMode, onToggleDarkMode }) {
  return (
    <div className={`landing-page ${darkMode ? 'dark' : ''}`}>
      <Navigation 
        onSignIn={onSignIn}
        onSignUp={onSignUp}
        darkMode={darkMode}
        onToggleDarkMode={onToggleDarkMode}
        showBack={true}
        onBack={onBack}
      />
      
      <main className="learn-more-main">
        {/* Hero Section */}
        <section className="learn-more-hero">
          <div className="learn-more-container">
            <div className="learn-more-header">
              <h1 className="learn-more-title">Release Notes</h1>
              <p className="learn-more-subtitle">
                Track all updates and improvements to StudyDesk
              </p>
            </div>
          </div>
        </section>

        {/* Release Notes Content */}
        <section className="problem-section" style={{paddingTop: '4rem', paddingBottom: '6rem'}}>
          <div className="learn-more-container">
            <div className="releases-list-container">
              {RELEASES.map((release, index) => (
                <div key={release.version} className="release-note-card">
                  <div className="release-note-header">
                    <div className="release-note-version-info">
                      <span className="release-note-version-badge">Version {release.version}</span>
                      {index === 0 && <span className="release-note-latest-badge">Latest</span>}
                    </div>
                    <span className="release-note-date">{release.date}</span>
                  </div>
                  <h2 className="release-note-title">{release.title}</h2>
                  <ul className="release-note-changes">
                    {release.changes.map((change, idx) => (
                      <li key={idx} className="release-note-change">{change}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      
      <Footer darkMode={darkMode} />
    </div>
  );
}

export default ReleaseNotesPage;
