import React, { useState } from "react";
import axios from "axios";
import WeatherCard from "./components/WeatherCard";
import ChatBox from "./components/ChatBox";
import "./App.css";

function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);

  const apiKey = process.env.REACT_APP_WEATHER_API_KEY;

  const fetchWeather = async () => {
    if (!city) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
      );
      setWeather(res.data);
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert("City not found!");
    }
    setLoading(false);
  };

  return (
    <div className="app">
      <div className="title-container">
        <h1>WanderWise</h1>
      </div>

      <div className="search">
        <input
          type="text"
          placeholder="Enter a city..."
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <button onClick={fetchWeather}>Search</button>
      </div>

      {loading && <p>Loading...</p>}
      {weather && <WeatherCard weather={weather} />}

      <h2 className="chatbot-name">Wander Buddy</h2>
      <ChatBox apiKey={apiKey} />
    </div>
  );
}

export default App;
