// src/App.js
import React, { useState } from "react";
import axios from "axios";
import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import WeatherCard from "./components/WeatherCard";
import ChatBox from "./components/ChatBox";
import FeatureShowcase from "./components/FeatureShowcase";
import LoadingSpinner from "./components/LoadingSpinner";
import "./App.css";

function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchWeather = async () => {
    if (!city) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/weather/${encodeURIComponent(city)}`);
      setWeather(res.data);
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert("City not found!");
    }
    setLoading(false);
  };

  return (
    <div className="app">
      <Header />
      
      <div className="main-container">
        <SearchBar 
          city={city} 
          setCity={setCity} 
          fetchWeather={fetchWeather} 
          loading={loading} 
        />

        {loading && <LoadingSpinner message="Fetching weather data..." />}
        
        {weather && (
          <div className="weather-card-wrapper">
            <WeatherCard weather={weather} />
          </div>
        )}

        <FeatureShowcase />

        <div className="chatbox-wrapper">
          <ChatBox />
        </div>
      </div>
    </div>
  );
}

export default App;
