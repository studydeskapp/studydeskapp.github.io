import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LandingPage from './LandingPage';
import LearnMorePage from './LearnMorePage';
import ReleaseNotesPage from './ReleaseNotesPage';

function Router({ darkMode, onToggleDarkMode, onSignIn, onSignUp }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleSignIn = () => {
    navigate('/sign-in');
    if (onSignIn) onSignIn();
  };

  const handleSignUp = () => {
    navigate('/sign-up');
    if (onSignUp) onSignUp();
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  // Route to Learn More page
  if (pathname === '/learn-more' || pathname === '/learn-more/') {
    return (
      <LearnMorePage
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        onBack={handleBackToHome}
        darkMode={darkMode}
        onToggleDarkMode={onToggleDarkMode}
      />
    );
  }

  // Route to Release Notes page
  if (pathname === '/release-notes' || pathname === '/release-notes/') {
    return (
      <ReleaseNotesPage
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        onBack={handleBackToHome}
        darkMode={darkMode}
        onToggleDarkMode={onToggleDarkMode}
      />
    );
  }

  // Route to Contact page
  if (pathname === '/contact' || pathname === '/contact/') {
    return (
      <div className={`landing-page ${darkMode ? 'dark' : ''}`}>
        <div className="learn-more-main">
          <section className="learn-more-hero">
            <div className="learn-more-container">
              <div className="learn-more-header">
                <h1 className="learn-more-title">Contact Us</h1>
                <p className="learn-more-subtitle">
                  Have questions or feedback? We'd love to hear from you!
                </p>
              </div>
            </div>
          </section>
          <section className="problem-section">
            <div className="learn-more-container">
              <div className="problem-content">
                <h2>Get in Touch</h2>
                <div style={{maxWidth: '600px', margin: '0 auto', textAlign: 'left'}}>
                  <p style={{fontSize: '1.125rem', color: 'var(--landing-text2)', marginBottom: '2rem', lineHeight: '1.7'}}>
                    For support, questions, or feedback, please reach out to us at:
                  </p>
                  <p style={{fontSize: '1.25rem', marginBottom: '2rem'}}>
                    <a 
                      href="mailto:support@mystudydesk.app" 
                      style={{
                        color: 'var(--landing-accent)', 
                        fontWeight: '600',
                        textDecoration: 'none',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                      onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                    >
                      support@mystudydesk.app
                    </a>
                  </p>
                  <p style={{fontSize: '1rem', color: 'var(--landing-text2)', lineHeight: '1.7'}}>
                    We typically respond within 24-48 hours. For urgent issues, please include "URGENT" in your subject line.
                  </p>
                </div>
              </div>
            </div>
          </section>
          <div style={{textAlign: 'center', padding: '3rem 2rem'}}>
            <button className="btn-primary" onClick={handleBackToHome}>
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Route to Help page
  if (pathname === '/help' || pathname === '/help/') {
    return (
      <div className={`landing-page ${darkMode ? 'dark' : ''}`}>
        <div className="learn-more-main">
          <section className="learn-more-hero">
            <div className="learn-more-container">
              <div className="learn-more-header">
                <h1 className="learn-more-title">Help Center</h1>
                <p className="learn-more-subtitle">
                  Find answers to common questions and learn how to use StudyDesk
                </p>
              </div>
            </div>
          </section>
          <section className="problem-section">
            <div className="learn-more-container">
              <div className="problem-content">
                <h2>Frequently Asked Questions</h2>
                <div style={{maxWidth: '800px', margin: '0 auto', textAlign: 'left'}}>
                  <div style={{marginBottom: '2rem'}}>
                    <h3 style={{color: 'var(--landing-text)', fontSize: '1.25rem', marginBottom: '0.75rem'}}>How do I get started?</h3>
                    <p style={{color: 'var(--landing-text2)', lineHeight: '1.7'}}>
                      Simply sign up with your email or Google account, then start adding your assignments and classes. You can also import assignments from Canvas!
                    </p>
                  </div>
                  <div style={{marginBottom: '2rem'}}>
                    <h3 style={{color: 'var(--landing-text)', fontSize: '1.25rem', marginBottom: '0.75rem'}}>How do I connect Canvas?</h3>
                    <p style={{color: 'var(--landing-text2)', lineHeight: '1.7'}}>
                      Go to Settings, click "Connect Canvas", and follow the instructions to generate an API token from your school's Canvas account.
                    </p>
                  </div>
                  <div style={{marginBottom: '2rem'}}>
                    <h3 style={{color: 'var(--landing-text)', fontSize: '1.25rem', marginBottom: '0.75rem'}}>Is StudyDesk free?</h3>
                    <p style={{color: 'var(--landing-text2)', lineHeight: '1.7'}}>
                      Yes! StudyDesk is completely free for all students. We believe every student deserves access to great organizational tools.
                    </p>
                  </div>
                  <div style={{marginBottom: '2rem'}}>
                    <h3 style={{color: 'var(--landing-text)', fontSize: '1.25rem', marginBottom: '0.75rem'}}>How does the study timer work?</h3>
                    <p style={{color: 'var(--landing-text2)', lineHeight: '1.7'}}>
                      Our built-in Pomodoro timer helps you focus with 25-minute work sessions followed by short breaks. You can customize the duration to fit your study style.
                    </p>
                  </div>
                  <div style={{marginTop: '3rem', padding: '2rem', background: 'var(--landing-card)', border: '2px solid var(--landing-border)', borderRadius: '16px', textAlign: 'center'}}>
                    <h3 style={{color: 'var(--landing-text)', fontSize: '1.25rem', marginBottom: '1rem'}}>Still need help?</h3>
                    <p style={{color: 'var(--landing-text2)', marginBottom: '1rem'}}>
                      Can't find what you're looking for? Reach out to us:
                    </p>
                    <a 
                      href="mailto:support@mystudydesk.app" 
                      style={{
                        color: 'var(--landing-accent)', 
                        fontWeight: '600',
                        fontSize: '1.125rem',
                        textDecoration: 'none',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                      onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                    >
                      support@mystudydesk.app
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <div style={{textAlign: 'center', padding: '3rem 2rem'}}>
            <button className="btn-primary" onClick={handleBackToHome}>
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default to landing page
  return (
    <LandingPage
      onSignIn={handleSignIn}
      onSignUp={handleSignUp}
      darkMode={darkMode}
      onToggleDarkMode={onToggleDarkMode}
    />
  );
}

export default Router;