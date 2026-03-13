import React from 'react';

const features = [
  {
    id: 'canvas-integration',
    icon: '🔗',
    title: 'Canvas LMS Integration',
    description: 'Import assignments directly from Canvas with one click. Auto-sync grades and due dates to stay on top of everything.',
    highlight: true
  },
  {
    id: 'homework-tracker',
    icon: '📝',
    title: 'Smart Homework Tracker',
    description: 'Never miss a deadline again. Track progress, set priorities, and get intelligent completion reminders.',
    highlight: false
  },
  {
    id: 'study-timer',
    icon: '⏱️',
    title: 'Built-in Study Timer',
    description: 'Pomodoro timer with session tracking. Stay focused and build productive study habits that last.',
    highlight: false
  },
  {
    id: 'grade-analytics',
    icon: '📊',
    title: 'Grade Analytics',
    description: 'Monitor your academic performance with detailed grade tracking and trend analysis over time.',
    highlight: false
  }
];

function Features({ darkMode }) {
  return (
    <section className="features-section" aria-labelledby="features-heading">
      <div className="features-container">
        <div className="features-header animate-on-scroll fade-up">
          <h2 id="features-heading" className="features-title">
            Everything you need to succeed
          </h2>
          <p className="features-subtitle">
            Powerful tools designed specifically for high school students
          </p>
        </div>
        
        <div className="features-grid">
          {features.map((feature, index) => (
            <div 
              key={feature.id}
              className={`feature-card animate-on-scroll ${
                index % 2 === 0 ? 'fade-left' : 'fade-right'
              } ${feature.highlight ? 'highlight' : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="feature-icon-container">
                <span className="feature-icon" role="img" aria-hidden="true">
                  {feature.icon}
                </span>
                {feature.highlight && (
                  <div className="feature-badge">Popular</div>
                )}
              </div>
              
              <div className="feature-content">
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
              
              {/* Hover shimmer effect */}
              <div className="feature-shimmer"></div>
            </div>
          ))}
        </div>
        
        {/* Trust indicators */}
        <div className="trust-indicators animate-on-scroll fade-up">
          <div className="trust-item">
            <span className="trust-icon">🎓</span>
            <span className="trust-text">Built for students</span>
          </div>
          <div className="trust-item">
            <span className="trust-icon">🔒</span>
            <span className="trust-text">Privacy focused</span>
          </div>
          <div className="trust-item">
            <span className="trust-icon">💯</span>
            <span className="trust-text">Always free</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Features;