import React from 'react';

/**
 * Error boundary that catches React errors and shows a fallback UI.
 * Use to wrap app or major sections to prevent white screen on errors.
 */
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props;
      if (Fallback) {
        return <Fallback error={this.state.error} onRetry={this.handleRetry} />;
      }
      return (
        <div
          style={{
            padding: '3rem 2rem',
            maxWidth: 480,
            margin: '2rem auto',
            textAlign: 'center',
            fontFamily: 'system-ui, sans-serif',
            background: 'var(--card, #fff)',
            borderRadius: 16,
            border: '1px solid var(--border, #e2e8f0)',
            boxShadow: '0 4px 20px rgba(0,0,0,.08)',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#1e293b' }}>
            Something went wrong
          </h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            We're sorry, but something unexpected happened. Please try refreshing the page.
          </p>
          <button
            onClick={this.handleRetry}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#4f46e5',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Refresh page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
