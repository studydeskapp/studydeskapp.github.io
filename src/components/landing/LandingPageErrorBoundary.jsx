import React from 'react';

class LandingPageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Landing page error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback" style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: "'Plus Jakarta Sans', sans-serif"
        }}>
          <div style={{
            background: 'var(--card, #fff)',
            border: '1.5px solid var(--border, #ddd)',
            borderRadius: '1.5rem',
            padding: '2rem',
            maxWidth: '400px'
          }}>
            <h2 style={{ 
              color: 'var(--text, #333)', 
              marginBottom: '1rem',
              fontFamily: "'Fraunces', serif"
            }}>
              Something went wrong
            </h2>
            <p style={{ 
              color: 'var(--text2, #666)', 
              marginBottom: '1.5rem',
              lineHeight: 1.6
            }}>
              We're sorry, but there was an error loading the page. Please refresh and try again.
            </p>
            <button 
              onClick={() => window.location.reload()}
              style={{
                background: 'linear-gradient(135deg, #5B8DEE, #7C85FF)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.75rem',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'transform 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default LandingPageErrorBoundary;