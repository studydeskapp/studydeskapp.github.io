import React from 'react';

function Footer({ darkMode }) {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="landing-footer" role="contentinfo">
      <div className="footer-container">
        <div className="footer-content">
          {/* Logo and tagline */}
          <div className="footer-brand">
            <div className="footer-logo">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="32" height="32">
                <defs>
                  <linearGradient id="footer-sd-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1B1F3B"/>
                    <stop offset="100%" stopColor="#2d3561"/>
                  </linearGradient>
                  <linearGradient id="footer-sd-acc" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f5a623"/>
                    <stop offset="100%" stopColor="#f7c059"/>
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="48" fill="url(#footer-sd-bg)"/>
                <rect x="24" y="30" width="24" height="38" rx="3" fill="#fff" opacity="0.15"/>
                <rect x="26" y="30" width="22" height="38" rx="2" fill="#fff" opacity="0.9"/>
                <rect x="24" y="30" width="4" height="38" rx="2" fill="#ddd"/>
                <line x1="32" y1="40" x2="44" y2="40" stroke="#1B1F3B" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
                <line x1="32" y1="45" x2="44" y2="45" stroke="#1B1F3B" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
                <line x1="32" y1="50" x2="40" y2="50" stroke="#1B1F3B" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
                <circle cx="63" cy="57" r="16" fill="url(#footer-sd-acc)"/>
                <polyline points="55,57 61,63 72,50" fill="none" stroke="#1B1F3B" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="footer-logo-text">StudyDesk</span>
            </div>
            <p className="footer-tagline">
              Free homework tracker for high school students
            </p>
          </div>
          
          {/* Quick Links */}
          <div className="footer-links">
            <h4 className="footer-section-title">Quick Links</h4>
            <ul className="footer-link-list">
              <li><a href="/learn-more" className="footer-link">Features</a></li>
              <li><a href="/release-notes" className="footer-link">Release Notes</a></li>
              <li><a href="/contact" className="footer-link">Contact</a></li>
              <li><a href="/help" className="footer-link">Help Center</a></li>
            </ul>
          </div>
        </div>
        
        {/* Bottom bar */}
        <div className="footer-bottom">
          <div className="footer-copyright">
            <p>{currentYear} StudyDesk</p>
          </div>
          
          <div className="footer-social">
            <p className="footer-made">
              Made with ❤️ for students
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;