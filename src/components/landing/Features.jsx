import React from 'react';

const features = [
  {
    id: 'canvas-integration',
    title: 'Canvas Integration',
    description: 'Import assignments directly from Canvas. Auto-sync grades and due dates.',
    highlight: true
  },
  {
    id: 'homework-tracker',
    title: 'Assignment Tracking',
    description: 'Track progress, set priorities, and mark completion percentages.',
    highlight: false
  },
  {
    id: 'study-timer',
    title: 'Study Timer',
    description: 'Built-in Pomodoro timer to help you focus during study sessions.',
    highlight: false
  },
  {
    id: 'grade-analytics',
    title: 'Grade Tracking',
    description: 'Monitor your grades and academic performance across all classes.',
    highlight: false
  }
];

function Features({ darkMode }) {
  return (
    <section className="features-section" aria-labelledby="features-heading">
      <div className="features-container">
        <div className="features-header animate-on-scroll fade-up">
          <h2 id="features-heading" className="features-title">
            Features
          </h2>
        </div>
        
        <div className="features-grid">
          {features.map((feature, index) => (
            <div 
              key={feature.id}
              className={`feature-card animate-on-scroll ${
                index % 2 === 0 ? 'fade-left' : 'fade-right'
              } ${feature.highlight ? 'highlight' : ''}`}
            >
              <div className="feature-content">
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="trust-indicators animate-on-scroll fade-up">
          <div className="trust-item">
            <span className="trust-text">Built for students</span>
          </div>
          <div className="trust-item">
            <span className="trust-text">Privacy focused</span>
          </div>
          <div className="trust-item">
            <span className="trust-text">Always free</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Features;