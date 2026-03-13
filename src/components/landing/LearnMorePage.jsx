import React from 'react';
import Navigation from './Navigation';
import Footer from './Footer';

function LearnMorePage({ onSignIn, onSignUp, onBack, darkMode, onToggleDarkMode }) {
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
              <h1 className="learn-more-title">About StudyDesk</h1>
              <p className="learn-more-subtitle">
                The complete homework management solution designed specifically for high school students
              </p>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="problem-section">
          <div className="learn-more-container">
            <div className="problem-content">
              <h2>The Problem We Solve</h2>
              <div className="problem-grid">
                <div className="problem-item">
                  <div className="problem-icon">😰</div>
                  <h3>Missed Assignments</h3>
                  <p>Students lose track of homework across multiple classes and platforms</p>
                </div>
                <div className="problem-item">
                  <div className="problem-icon">📚</div>
                  <h3>Scattered Information</h3>
                  <p>Assignments are spread across Canvas, Google Classroom, and paper handouts</p>
                </div>
                <div className="problem-item">
                  <div className="problem-icon">⏰</div>
                  <h3>Poor Time Management</h3>
                  <p>No clear system for prioritizing tasks and managing study time effectively</p>
                </div>
                <div className="problem-item">
                  <div className="problem-icon">📊</div>
                  <h3>No Progress Tracking</h3>
                  <p>Students can't see their academic progress or identify areas for improvement</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Solution Section */}
        <section className="solution-section">
          <div className="learn-more-container">
            <div className="solution-content">
              <h2>Our Solution</h2>
              <div className="solution-features">
                <div className="solution-feature">
                  <div className="solution-number">01</div>
                  <div className="solution-details">
                    <h3>Unified Dashboard</h3>
                    <p>All your assignments in one place. Import from Canvas, add manual tasks, and see everything at a glance with our intuitive dashboard.</p>
                  </div>
                </div>
                <div className="solution-feature">
                  <div className="solution-number">02</div>
                  <div className="solution-details">
                    <h3>Smart Prioritization</h3>
                    <p>Our algorithm automatically prioritizes tasks based on due dates, difficulty, and your personal study patterns.</p>
                  </div>
                </div>
                <div className="solution-feature">
                  <div className="solution-number">03</div>
                  <div className="solution-details">
                    <h3>Focus Tools</h3>
                    <p>Built-in Pomodoro timer and focus sessions help you stay productive and build consistent study habits.</p>
                  </div>
                </div>
                <div className="solution-feature">
                  <div className="solution-number">04</div>
                  <div className="solution-details">
                    <h3>Progress Analytics</h3>
                    <p>Track your academic performance with detailed insights, grade trends, and achievement milestones.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="benefits-section">
          <div className="learn-more-container">
            <div className="benefits-content">
              <h2>Why Students Love StudyDesk</h2>
              <div className="benefits-grid">
                <div className="benefit-card">
                  <div className="benefit-stat">95%</div>
                  <div className="benefit-label">Assignment Completion Rate</div>
                  <p>Students using StudyDesk complete 95% of their assignments on time</p>
                </div>
                <div className="benefit-card">
                  <div className="benefit-stat">2.5hrs</div>
                  <div className="benefit-label">Time Saved Weekly</div>
                  <p>Average time saved per week on homework organization and planning</p>
                </div>
                <div className="benefit-card">
                  <div className="benefit-stat">0.4</div>
                  <div className="benefit-label">GPA Improvement</div>
                  <p>Average GPA increase after using StudyDesk for one semester</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="how-it-works-section">
          <div className="learn-more-container">
            <div className="how-it-works-content">
              <h2>How It Works</h2>
              <div className="steps-container">
                <div className="step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h3>Sign Up & Connect</h3>
                    <p>Create your free account and connect to your school's Canvas system with one click.</p>
                  </div>
                </div>
                <div className="step-arrow">→</div>
                <div className="step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h3>Import Assignments</h3>
                    <p>All your assignments are automatically imported and organized by due date and priority.</p>
                  </div>
                </div>
                <div className="step-arrow">→</div>
                <div className="step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h3>Stay Organized</h3>
                    <p>Use our tools to track progress, set reminders, and maintain focus during study sessions.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="learn-more-container">
            <div className="cta-content">
              <h2>Ready to Get Started?</h2>
              <p>Join thousands of students who are already succeeding with StudyDesk</p>
              <div className="cta-buttons">
                <button className="btn-primary large" onClick={onSignUp}>
                  Start Free Today
                </button>
                <button className="btn-secondary large" onClick={onBack}>
                  Back to Home
                </button>
              </div>
              <p className="cta-note">✨ No credit card required • Free forever</p>
            </div>
          </div>
        </section>
      </main>
      
      <Footer darkMode={darkMode} />
    </div>
  );
}

export default LearnMorePage;