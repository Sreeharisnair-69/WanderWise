// server.js
require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Load city codes JSON
const cityCodesPath = path.join(__dirname, "src", "cityCodes.json");
const cityCodes = JSON.parse(fs.readFileSync(cityCodesPath, "utf-8"));

// Environment variables
const WEATHER_API_KEY = process.env.REACT_APP_WEATHER_API_KEY;
const AMADEUS_CLIENT_ID = process.env.AMADEUS_CLIENT_ID;
const AMADEUS_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET;

// ==========================
let amadeusToken = null;
let tokenExpiry = null;

async function getAmadeusToken() {
  // If token is still valid, reuse it
  if (amadeusToken && tokenExpiry && Date.now() < tokenExpiry) {
    return amadeusToken;
  }

  try {
    const response = await axios.post(
      "https://test.api.amadeus.com/v1/security/oauth2/token",
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: AMADEUS_CLIENT_ID,
        client_secret: AMADEUS_CLIENT_SECRET,
      }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    amadeusToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000; // Refresh 1 min before expiry

    console.log("✅ Amadeus access token fetched successfully");
    return amadeusToken;
  } catch (err) {
    console.error("❌ Failed to fetch Amadeus token:", err.response?.data || err.message);
    throw new Error("Amadeus authentication failed");
  }
}


// ----- Weather Route -----
app.get("/api/weather/:city", async (req, res) => {
  const city = req.params.city;
  if (!city) return res.status(400).json({ error: "City is required" });

  try {
    const weatherRes = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        city
      )}&appid=${WEATHER_API_KEY}&units=metric`
    );
    res.json(weatherRes.data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
});

// ----- Travel Route -----
app.get("/api/travel/:city", async (req, res) => {
  const userCityKey = req.params.city.toLowerCase();
  const originCode = cityCodes[userCityKey];

  if (!originCode) return res.status(404).json({ error: "City code not found" });

  try {
    // 1️⃣ Get Amadeus Access Token
    const tokenRes = await axios.post(
      "https://test.api.amadeus.com/v1/security/oauth2/token",
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: AMADEUS_CLIENT_ID,
        client_secret: AMADEUS_CLIENT_SECRET,
      }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const accessToken = tokenRes.data.access_token;

    // 2️⃣ Get top travel destinations
    const travelRes = await axios.get(
      `https://test.api.amadeus.com/v1/shopping/flight-destinations?origin=${originCode}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    res.json(travelRes.data);
  } catch (err) {
    console.error("Amadeus error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch travel data" });
  }
});

// ----- Start Server -----
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
