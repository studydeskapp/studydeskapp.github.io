import React from 'react';

function Hero({ onSignUp, onLearnMore, darkMode }) {
  return (
    <section className="hero-section" aria-labelledby="hero-heading">
      <div className="hero-container">
        <div className="hero-content-centered">
          <h1 id="hero-heading" className="hero-title animate-on-scroll fade-up">
            StudyDesk
          </h1>
          <p className="hero-subtitle animate-on-scroll fade-up">
            Smart homework tracker for high school students
          </p>
          <div className="hero-cta-container animate-on-scroll fade-up">
            <button 
              className="btn-primary hero-cta"
              onClick={onSignUp}
              aria-describedby="cta-description"
            >
              Start Now
            </button>
            <button 
              className="btn-secondary hero-cta-secondary"
              onClick={onLearnMore}
            >
              Learn More
            </button>
            <p id="cta-description" className="sr-only">
              Sign up for a free StudyDesk account
            </p>
          </div>
        </div>
      </div>
      
      {/* Enhanced Parallax background elements */}
      <div className="hero-bg-elements">
        <div className="bg-circle parallax-bg" data-speed="0.3"></div>
        <div className="bg-circle-2 parallax-bg" data-speed="0.5"></div>
        <div className="bg-circle-3 parallax-bg" data-speed="0.4"></div>
      </div>
    </section>
  );
}

export default Hero;