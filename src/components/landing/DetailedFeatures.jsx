import React from 'react';

const detailedFeatures = [
  {
    id: 'homework-tracking',
    title: 'Smart Homework Tracking',
    description: 'Never miss another assignment with our intelligent tracking system. Organize tasks by priority, set custom reminders, and track your progress with visual indicators.',
    features: [
      'Priority-based task organization',
      'Custom reminder notifications',
      'Progress tracking with visual indicators',
      'Due date management and alerts'
    ],
    image: 'homework-tracker',
    reverse: false
  },
  {
    id: 'canvas-integration',
    title: 'Canvas LMS Integration',
    description: 'Seamlessly sync with your school\'s Canvas system. Import assignments automatically, sync grades in real-time, and keep everything organized in one place.',
    features: [
      'One-click Canvas import',
      'Automatic grade synchronization',
      'Real-time assignment updates',
      'Unified dashboard view'
    ],
    image: 'canvas-sync',
    reverse: true
  },
  {
    id: 'study-analytics',
    title: 'Study Analytics & Insights',
    description: 'Track your academic performance with detailed analytics. Monitor study patterns, identify improvement areas, and celebrate your achievements.',
    features: [
      'Performance trend analysis',
      'Study time tracking',
      'Grade improvement insights',
      'Achievement milestones'
    ],
    image: 'analytics',
    reverse: false
  },
  {
    id: 'study-timer',
    title: 'Focus Timer & Sessions',
    description: 'Built-in Pomodoro timer helps you stay focused during study sessions. Track your productivity and build consistent study habits.',
    features: [
      'Pomodoro technique timer',
      'Session tracking and history',
      'Focus streak monitoring',
      'Productivity insights'
    ],
    image: 'timer',
    reverse: true
  }
];

function DetailedFeatures({ darkMode }) {
  const renderMockupImage = (imageType) => {
    switch (imageType) {
      case 'homework-tracker':
        return (
          <div className="feature-mockup homework-mockup">
            <div className="mockup-window">
              <div className="mockup-header">
                <div className="mockup-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="mockup-title-bar">Assignments</div>
              </div>
              <div className="mockup-content">
                <div className="assignment-list">
                  <div className="assignment-item high-priority">
                    <div className="assignment-stripe red"></div>
                    <div className="assignment-content">
                      <h4>Math Quiz - Chapter 7</h4>
                      <p>Due tomorrow at 11:59 PM</p>
                      <div className="assignment-tags">
                        <span className="tag urgent">Urgent</span>
                        <span className="tag math">Math</span>
                      </div>
                    </div>
                    <div className="assignment-progress">
                      <div className="progress-circle">
                        <span>0%</span>
                      </div>
                    </div>
                  </div>
                  <div className="assignment-item medium-priority">
                    <div className="assignment-stripe orange"></div>
                    <div className="assignment-content">
                      <h4>History Essay Draft</h4>
                      <p>Due Friday at 3:00 PM</p>
                      <div className="assignment-tags">
                        <span className="tag medium">Medium</span>
                        <span className="tag history">History</span>
                      </div>
                    </div>
                    <div className="assignment-progress">
                      <div className="progress-circle partial">
                        <span>65%</span>
                      </div>
                    </div>
                  </div>
                  <div className="assignment-item completed">
                    <div className="assignment-stripe green"></div>
                    <div className="assignment-content">
                      <h4>Science Lab Report</h4>
                      <p>Submitted yesterday</p>
                      <div className="assignment-tags">
                        <span className="tag completed">Completed</span>
                        <span className="tag science">Science</span>
                      </div>
                    </div>
                    <div className="assignment-progress">
                      <div className="check-mark">✓</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'canvas-sync':
        return (
          <div className="feature-mockup canvas-mockup">
            <div className="mockup-window">
              <div className="mockup-header">
                <div className="mockup-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="mockup-title-bar">Canvas Integration</div>
              </div>
              <div className="mockup-content">
                <div className="sync-status">
                  <div className="sync-indicator active">
                    <div className="sync-icon">🔄</div>
                    <span>Syncing with Canvas...</span>
                  </div>
                </div>
                <div className="imported-assignments">
                  <h4>Recently Imported</h4>
                  <div className="import-item">
                    <div className="import-icon">📝</div>
                    <div className="import-details">
                      <span>Biology Assignment #3</span>
                      <small>From: BIO 101 - Spring 2026</small>
                    </div>
                    <div className="import-status">✓</div>
                  </div>
                  <div className="import-item">
                    <div className="import-icon">📊</div>
                    <div className="import-details">
                      <span>Statistics Project</span>
                      <small>From: MATH 201 - Spring 2026</small>
                    </div>
                    <div className="import-status">✓</div>
                  </div>
                  <div className="import-item">
                    <div className="import-icon">📚</div>
                    <div className="import-details">
                      <span>Literature Analysis</span>
                      <small>From: ENG 102 - Spring 2026</small>
                    </div>
                    <div className="import-status">✓</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'analytics':
        return (
          <div className="feature-mockup analytics-mockup">
            <div className="mockup-window">
              <div className="mockup-header">
                <div className="mockup-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="mockup-title-bar">Analytics Dashboard</div>
              </div>
              <div className="mockup-content">
                <div className="analytics-grid">
                  <div className="stat-card">
                    <div className="stat-number">87%</div>
                    <div className="stat-label">Completion Rate</div>
                    <div className="stat-trend up">↗ +5%</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">3.7</div>
                    <div className="stat-label">Average GPA</div>
                    <div className="stat-trend up">↗ +0.2</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">24h</div>
                    <div className="stat-label">Study Time</div>
                    <div className="stat-trend">→ This week</div>
                  </div>
                </div>
                <div className="chart-area">
                  <div className="chart-title">Grade Trends</div>
                  <div className="mini-chart">
                    <div className="chart-bars">
                      <div className="bar" style={{height: '60%'}}></div>
                      <div className="bar" style={{height: '75%'}}></div>
                      <div className="bar" style={{height: '85%'}}></div>
                      <div className="bar" style={{height: '90%'}}></div>
                      <div className="bar" style={{height: '87%'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'timer':
        return (
          <div className="feature-mockup timer-mockup">
            <div className="mockup-window">
              <div className="mockup-header">
                <div className="mockup-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="mockup-title-bar">Focus Timer</div>
              </div>
              <div className="mockup-content">
                <div className="timer-display">
                  <div className="timer-circle">
                    <div className="timer-progress"></div>
                    <div className="timer-time">
                      <span className="minutes">25</span>
                      <span className="separator">:</span>
                      <span className="seconds">00</span>
                    </div>
                  </div>
                  <div className="timer-label">Focus Session</div>
                  <div className="timer-controls">
                    <button className="timer-btn start">Start</button>
                    <button className="timer-btn pause">Pause</button>
                  </div>
                </div>
                <div className="session-stats">
                  <div className="session-item">
                    <span className="session-icon">🍅</span>
                    <span className="session-text">3 sessions today</span>
                  </div>
                  <div className="session-item">
                    <span className="session-icon">🔥</span>
                    <span className="session-text">7 day streak</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <section className="detailed-features-section">
      <div className="detailed-features-container">
        {detailedFeatures.map((feature, index) => (
          <div 
            key={feature.id}
            className={`detailed-feature ${feature.reverse ? 'reverse' : ''} animate-on-scroll fade-up`}
          >
            <div className="feature-content">
              <h2 className="feature-title">{feature.title}</h2>
              <p className="feature-description">{feature.description}</p>
              <ul className="feature-list">
                {feature.features.map((item, idx) => (
                  <li key={idx} className="feature-list-item">
                    <span className="feature-check">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="feature-visual">
              {renderMockupImage(feature.image)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default DetailedFeatures;