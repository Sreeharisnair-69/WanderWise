import React from 'react';
import './Header.css';

function Header() {
  return (
    <header className="app-header glass">
      <div className="header-content">
        <div className="logo-section">
          <h1 className="logo">🌍 WanderWise</h1>
          <p className="tagline">Your personal travel and weather guide</p>
        </div>
        <div className="header-features">
          <div className="feature-badge">
            <span className="feature-icon">🌤️</span>
            <span>Weather</span>
          </div>
          <div className="feature-badge">
            <span className="feature-icon">✈️</span>
            <span>Travel</span>
          </div>
          <div className="feature-badge">
            <span className="feature-icon">🛫</span>
            <span>Check-in</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
