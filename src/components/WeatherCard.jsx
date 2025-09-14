import React from "react";
import "./WeatherCard.css";

function WeatherCard({ weather }) {
  return (
    <div className="weather-card">
      <h2>{weather.name}, {weather.sys.country}</h2>
      <p><strong>{weather.weather[0].main}</strong> - {weather.weather[0].description}</p>
      <p>🌡️ Temp: {weather.main.temp} °C</p>
      <p>💨 Wind: {weather.wind.speed} m/s</p>
      <p>💧 Humidity: {weather.main.humidity}%</p>
    </div>
  );
}

export default WeatherCard;
