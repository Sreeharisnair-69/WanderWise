import React from 'react';
import './FeatureShowcase.css';

function FeatureShowcase() {
  const features = [
    {
      icon: '🌤️',
      title: 'Weather Intelligence',
      description: 'Get real-time weather data for any city worldwide with detailed forecasts and conditions.',
      color: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)'
    },
    {
      icon: '✈️',
      title: 'Travel Planning',
      description: 'Discover popular destinations from any city with comprehensive travel information.',
      color: 'linear-gradient(135deg, #45B7D1 0%, #96CEB4 100%)'
    },
    {
      icon: '🏨',
      title: 'Hotels & Stays',
      description: 'Find curated hotel options across budget to luxury in top cities worldwide.',
      color: 'linear-gradient(135deg, #B497FF 0%, #6EE7B7 100%)'
    },
    {
      icon: '🍽️',
      title: 'Restaurants',
      description: 'Browse top places to eat by cuisine and budget with easy filters.',
      color: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)'
    },
    {
      icon: '🚗',
      title: 'Rental cars',
      description: 'Find car hire options with typical daily prices and providers per city.',
      color: 'linear-gradient(135deg, #0ea5e9 0%, #1d4ed8 100%)'
    },
    {
      icon: '🛫',
      title: 'Airline Check-in',
      description: 'Quick access to airline check-in links with support for 80+ major airlines worldwide.',
      color: 'linear-gradient(135deg, #FFEAA7 0%, #FF6B6B 100%)'
    },
    {
      icon: '🤖',
      title: 'Smart Chatbot',
      description: 'Interactive AI assistant that understands natural language for all your travel needs.',
      color: 'linear-gradient(135deg, #4ECDC4 0%, #45B7D1 100%)'
    }
  ];

  return (
    <div className="feature-showcase">
      <div className="showcase-header">
        <h2>Why Choose WanderWise?</h2>
        <p>Everything you need for seamless travel planning in one place</p>
      </div>
      <div className="features-grid">
        {features.map((feature, index) => (
          <div key={index} className="feature-card">
            <div className="feature-icon" style={{ background: feature.color }}>
              <span className="icon-emoji">{feature.icon}</span>
            </div>
            <div className="feature-content">
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FeatureShowcase;
