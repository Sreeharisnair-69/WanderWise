import React from "react";
import "./WeatherCard.css";

function WeatherCard({ weather }) {
  const getWeatherIcon = (weatherMain) => {
    const icons = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Snow': '❄️',
      'Thunderstorm': '⛈️',
      'Drizzle': '🌦️',
      'Mist': '🌫️',
      'Fog': '🌫️',
      'Haze': '🌫️',
      'Smoke': '🌫️',
      'Dust': '🌫️',
      'Sand': '🌫️',
      'Ash': '🌫️',
      'Squall': '💨',
      'Tornado': '🌪️'
    };
    return icons[weatherMain] || '🌤️';
  };

  const getTemperatureColor = (temp) => {
    if (temp < 0) return '#4A90E2'; // Very cold - blue
    if (temp < 10) return '#7ED321'; // Cold - light blue
    if (temp < 20) return '#F5A623'; // Cool - yellow
    if (temp < 30) return '#F8E71C'; // Warm - orange
    return '#D0021B'; // Hot - red
  };

  const getWindDirection = (deg) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return directions[Math.round(deg / 22.5) % 16];
  };

  const getUVIndex = (temp, humidity) => {
    // Simple UV index estimation based on temperature and humidity
    let uv = Math.round((temp - 10) / 3);
    if (humidity > 80) uv = Math.max(0, uv - 2);
    return Math.min(11, Math.max(0, uv));
  };

  const getComfortLevel = (temp, humidity, windSpeed) => {
    const heatIndex = temp + (humidity / 100) * 5;
    const windChill = temp - (windSpeed * 2);
    const comfort = (heatIndex + windChill) / 2;
    
    if (comfort < 10) return { level: 'Very Cold', color: '#4A90E2', emoji: '🥶' };
    if (comfort < 15) return { level: 'Cold', color: '#7ED321', emoji: '🧥' };
    if (comfort < 20) return { level: 'Cool', color: '#F5A623', emoji: '😊' };
    if (comfort < 25) return { level: 'Pleasant', color: '#F8E71C', emoji: '😌' };
    if (comfort < 30) return { level: 'Warm', color: '#F5A623', emoji: '😎' };
    if (comfort < 35) return { level: 'Hot', color: '#D0021B', emoji: '🥵' };
    return { level: 'Very Hot', color: '#D0021B', emoji: '🔥' };
  };

  const comfort = getComfortLevel(weather.main.temp, weather.main.humidity, weather.wind.speed);
  const uvIndex = getUVIndex(weather.main.temp, weather.main.humidity);

  return (
    <div className="weather-card">
      <div className="weather-header">
        <div className="weather-location">
          <h2>{weather.name}, {weather.sys.country}</h2>
          <p className="weather-description">
            {getWeatherIcon(weather.weather[0].main)} {weather.weather[0].description}
          </p>
        </div>
        <div className="weather-main-temp" style={{ color: getTemperatureColor(weather.main.temp) }}>
          {Math.round(weather.main.temp)}°C
        </div>
      </div>

      <div className="weather-details">
        <div className="weather-grid">
          <div className="weather-item">
            <div className="weather-item-icon">🌡️</div>
            <div className="weather-item-content">
              <span className="weather-item-label">Feels Like</span>
              <span className="weather-item-value">{Math.round(weather.main.feels_like)}°C</span>
            </div>
          </div>

          <div className="weather-item">
            <div className="weather-item-icon">📊</div>
            <div className="weather-item-content">
              <span className="weather-item-label">Min / Max</span>
              <span className="weather-item-value">{Math.round(weather.main.temp_min)}° / {Math.round(weather.main.temp_max)}°</span>
            </div>
          </div>

          <div className="weather-item">
            <div className="weather-item-icon">💨</div>
            <div className="weather-item-content">
              <span className="weather-item-label">Wind</span>
              <span className="weather-item-value">{weather.wind.speed} m/s {getWindDirection(weather.wind.deg)}</span>
            </div>
          </div>

          <div className="weather-item">
            <div className="weather-item-icon">💧</div>
            <div className="weather-item-content">
              <span className="weather-item-label">Humidity</span>
              <span className="weather-item-value">{weather.main.humidity}%</span>
            </div>
          </div>

          <div className="weather-item">
            <div className="weather-item-icon">🌡️</div>
            <div className="weather-item-content">
              <span className="weather-item-label">Pressure</span>
              <span className="weather-item-value">{weather.main.pressure} hPa</span>
            </div>
          </div>

          <div className="weather-item">
            <div className="weather-item-icon">👁️</div>
            <div className="weather-item-content">
              <span className="weather-item-label">Visibility</span>
              <span className="weather-item-value">{weather.visibility / 1000} km</span>
            </div>
          </div>
        </div>

        <div className="weather-comfort">
          <div className="comfort-level" style={{ color: comfort.color }}>
            <span className="comfort-emoji">{comfort.emoji}</span>
            <span className="comfort-text">{comfort.level}</span>
          </div>
          <div className="uv-index">
            <span className="uv-label">UV Index: </span>
            <span className="uv-value" style={{ color: uvIndex > 6 ? '#D0021B' : uvIndex > 3 ? '#F5A623' : '#7ED321' }}>
              {uvIndex}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WeatherCard;
