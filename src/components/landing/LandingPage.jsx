import React, { useState, useEffect } from 'react';
import Navigation from './Navigation';
import Hero from './Hero';
import DetailedFeatures from './DetailedFeatures';
import Footer from './Footer';
import LandingPageErrorBoundary from './LandingPageErrorBoundary';
import './landing.css';

function LandingPage({ onSignIn, onSignUp, darkMode, onToggleDarkMode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initialize scroll animations when component mounts
  useEffect(() => {
    // Import and initialize scroll animation controller
    import('./ScrollAnimationController').then(({ ScrollAnimationController }) => {
      new ScrollAnimationController();
    });
  }, []);

  const handleLearnMore = () => {
    window.location.href = '/learn-more';
  };

  return (
    <LandingPageErrorBoundary>
      <div className={`landing-page ${darkMode ? 'dark' : ''}`}>
        <Navigation 
          onSignIn={onSignIn}
          onSignUp={onSignUp}
          darkMode={darkMode}
          onToggleDarkMode={onToggleDarkMode}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />
        
        <main role="main">
          <Hero 
            onSignUp={onSignUp}
            onLearnMore={handleLearnMore}
            darkMode={darkMode}
          />
          
          <DetailedFeatures 
            darkMode={darkMode}
          />
        </main>
        
        <Footer 
          darkMode={darkMode}
        />
      </div>
    </LandingPageErrorBoundary>
  );
}

export default LandingPage;