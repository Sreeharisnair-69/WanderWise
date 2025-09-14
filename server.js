// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Amadeus = require('amadeus');
const cityCodes = require('./cityCodes.json');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Amadeus in test environment
const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_API_KEY,
  clientSecret: process.env.AMADEUS_API_SECRET
});

// Example API call
amadeus.shopping.flightDestinations.get({ origin: "LON" })
  .then(response => console.log(response.data))
  .catch(err => console.error(err));

app.get('/api/travel/:cityName', async (req, res) => {
  try {
    const cityName = decodeURIComponent(req.params.cityName).toLowerCase();
    const cityCode = cityCodes[cityName];

    if (!cityCode) return res.status(404).json({ error: "City not found" });

    const response = await amadeus.shopping.flightOffers.inspirationSearch.get({
      origin: cityCode,
      departureDate: "2025-09-20",
      adults: 1
    });

    if (!response.data || response.data.length === 0) {
      return res.status(404).json({ error: "No travel suggestions found for this city" });
    }

    res.json(response.data);
  } catch (error) {
    console.error("Amadeus full error:", error);
    res.status(500).json({
      error: error.response?.data || error.message || "Unknown Amadeus error"
    });
  }
});


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
