import React from 'react';

function Hero({ onSignUp, onLearnMore, darkMode }) {
  return (
    <section className="hero-section" aria-labelledby="hero-heading">
      <div className="hero-container">
        <div className="hero-content-centered">
          <h1 id="hero-heading" className="hero-title animate-on-scroll fade-up">
            Track your homework. Stay organized.
          </h1>
          <p className="hero-subtitle animate-on-scroll fade-up">
            Free homework tracker built for high school students. Import from Canvas, set priorities, and never miss a deadline.
          </p>
          <div className="hero-cta-container animate-on-scroll fade-up">
            <button 
              className="btn-primary hero-cta"
              onClick={onSignUp}
              aria-describedby="cta-description"
            >
              Get Started
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
    </section>
  );
}

export default Hero;