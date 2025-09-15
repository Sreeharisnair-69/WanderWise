// src/App.js
import React, { useState } from "react";
import axios from "axios";
import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import WeatherCard from "./components/WeatherCard";
import ChatBox from "./components/ChatBox";
import FeatureShowcase from "./components/FeatureShowcase";
import DiscoverSection from "./components/DiscoverSection";
import LoadingSpinner from "./components/LoadingSpinner";
import TravelSummary from "./components/TravelSummary";
import CarsSummary from "./components/CarsSummary";
import CheckinSummary from "./components/CheckinSummary";
import cityToCountry from "./cityToCountry.json";
import countryToFlagCarrier from "./countryToFlagCarrier.json";
import "./App.css";

import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, SignIn, SignUp } from "@clerk/clerk-react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

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
    <BrowserRouter>
      <div className="app">
        <div className="topbar">
          <Link to="/" className="brand">🌍 WanderWise</Link>
          <div className="auth-group">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="btn-outline" aria-label="Open sign in">Sign in</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="btn-primary" aria-label="Open sign up">Sign up</button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton appearance={{ elements: { userButtonAvatarBox: { border: '1px solid rgba(255,255,255,0.2)' } } }} />
            </SignedIn>
          </div>
        </div>
        <Header />

        <Routes>
          <Route path="/sign-in/*" element={<SignIn routing="path" path="/sign-in" />} />
          <Route path="/sign-up/*" element={<SignUp routing="path" path="/sign-up" />} />
          <Route path="/" element={(
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

              {/* Summaries */}
              {city && (
                <div className="summaries-grid">
                  <TravelSummary city={city} />
                  <CarsSummary city={city} />
                  {(() => {
                    const key = city.toLowerCase().trim();
                    const country = cityToCountry[key] || key;
                    const carrier = countryToFlagCarrier[country];
                    return <CheckinSummary airlineHint={carrier || ""} />;
                  })()}
                </div>
              )}

              <DiscoverSection externalCity={city} />

              <FeatureShowcase />

              {/* Chat launcher floating button */}
              <button 
                className={`chat-launcher ${isChatOpen ? 'hidden' : ''}`}
                aria-label="Open travel assistant chat"
                onClick={() => setIsChatOpen(true)}
              >
                🤖
              </button>

              {isChatOpen && (
                <div className="chat-modal" role="dialog" aria-modal="true">
                  <div className="chat-panel">
                    <div className="chat-panel-header">
                      <span className="chat-title">Travel Assistant</span>
                      <button className="chat-close" onClick={() => setIsChatOpen(false)} aria-label="Close chat">✕</button>
                    </div>
                    <ChatBox />
                  </div>
                </div>
              )}
            </div>
          )} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
