import React from 'react';
import './SearchBar.css';

function SearchBar({ city, setCity, fetchWeather, loading }) {
  return (
    <div className="search-container">
      <div className="search-wrapper">
        <div className="search-input-group">
          <div className="search-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <input
            type="text"
            placeholder="Enter a city name..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="search-input"
            onKeyDown={(e) => e.key === "Enter" && fetchWeather()}
            disabled={loading}
          />
          <button 
            onClick={fetchWeather} 
            className="search-button"
            disabled={loading || !city.trim()}
          >
            {loading ? (
              <div className="loading-spinner"></div>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>
        <div className="search-suggestions">
          <span className="suggestion-text">Try: London, Paris, Tokyo, New York, Dubai</span>
        </div>
      </div>
    </div>
  );
}

export default SearchBar;
