require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

// Configure CORS for Vercel deployment
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://weather-travel-buddy.vercel.app', 'https://wanderwise.vercel.app'] 
    : 'http://localhost:3000',
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));
}

// Load city codes
const cityCodesPath = path.join(__dirname, "src", "cityCodes.json");
let cityCodes = {};
try {
  cityCodes = JSON.parse(fs.readFileSync(cityCodesPath, "utf-8"));
} catch (err) {
  console.error("Failed to load cityCodes.json:", err.message);
}

// Load static travel data
const travelDataPath = path.join(__dirname, "src", "travelData.json");
let travelData = {};
try {
  travelData = JSON.parse(fs.readFileSync(travelDataPath, "utf-8"));
} catch (err) {
  console.error("Failed to load travelData.json:", err.message);
}

// Load airline codes
const airlineCodesPath = path.join(__dirname, "src", "airlineCodes.json");
let airlineCodes = {};
try {
  airlineCodes = JSON.parse(fs.readFileSync(airlineCodesPath, "utf-8"));
} catch (err) {
  console.error("Failed to load airlineCodes.json:", err.message);
}

// Load capital cities
const capitalCitiesPath = path.join(__dirname, "src", "capitalCities.json");
let capitalCities = {};
try {
  capitalCities = JSON.parse(fs.readFileSync(capitalCitiesPath, "utf-8"));
} catch (err) {
  console.error("Failed to load capitalCities.json:", err.message);
}

// Environment variables
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const AMADEUS_CLIENT_ID = process.env.AMADEUS_CLIENT_ID;
const AMADEUS_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET;

// Validate required environment variables
if (!WEATHER_API_KEY) {
  console.error("ERROR: WEATHER_API_KEY is required in .env file");
  process.exit(1);
}


// Helper: get Amadeus access token
const getAmadeusToken = async () => {
  try {
    const tokenRes = await axios.post(
      "https://test.api.amadeus.com/v1/security/oauth2/token",
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: AMADEUS_CLIENT_ID,
        client_secret: AMADEUS_CLIENT_SECRET,
      }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    return tokenRes.data.access_token;
  } catch (err) {
    console.error("Failed to get Amadeus token:", err.response?.data || err.message);
    throw new Error("Amadeus authentication failed");
  }
};

// --- Weather Route ---
app.get("/api/weather/:city", async (req, res) => {
  const city = req.params.city;
  if (!city) return res.status(400).json({ error: "City is required" });

  // Check if API key is available
  if (!WEATHER_API_KEY) {
    console.error("Weather API key is missing!");
    return res.status(500).json({ error: "Weather API configuration error" });
  }

  try {
    const baseUrl = 'https://api.openweathermap.org/data/2.5/weather';
    const url = `${baseUrl}?q=${encodeURIComponent(city)}&appid=${WEATHER_API_KEY}&units=metric`;
    
    console.log("Calling weather API for city:", city); // Debug URL without exposing full URL

    const weatherRes = await axios.get(url, {
      timeout: 5000, // 5 second timeout
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!weatherRes.data) {
      throw new Error("No data received from weather API");
    }

    // Log successful response without sensitive data
    console.log("Weather API response received for:", city);
    res.json(weatherRes.data);
  } catch (err) {
    const errorMessage = err.response?.data?.message || err.message;
    const statusCode = err.response?.status || 500;
    console.error("Weather API error details:", {
      status: statusCode,
      message: errorMessage,
      city: city
    });
    res.status(statusCode).json({ 
      error: "Failed to fetch weather data",
      message: errorMessage
    });
  }
});


// --- Travel Route ---
app.get("/api/travel/:city", async (req, res) => {
  const city = req.params.city.toLowerCase();
  
  // First try to get data from static travel database
  if (travelData[city]) {
    const staticData = travelData[city];
    return res.json({
      data: staticData.destinations.map(dest => ({
        destination: dest,
        type: "airport"
      })),
      meta: {
        count: staticData.destinations.length,
        source: "static_data"
      }
    });
  }

  // Fallback to Amadeus API for cities with IATA codes
  const originCode = cityCodes[city];
  if (!originCode) return res.status(404).json({ error: "City not found in our database" });

  try {
    const accessToken = await getAmadeusToken();

    const travelRes = await axios.get(
      `https://test.api.amadeus.com/v1/shopping/flight-destinations?origin=${originCode}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    res.json(travelRes.data);
  } catch (err) {
    console.error("Amadeus travel error:", err.response?.data || err.message);
    
    // If Amadeus fails, try to return static data if available
    if (travelData[city]) {
      const staticData = travelData[city];
      return res.json({
        data: staticData.destinations.map(dest => ({
          destination: dest,
          type: "airport"
        })),
        meta: {
          count: staticData.destinations.length,
          source: "static_data_fallback"
        }
      });
    }
    
    res.status(500).json({ error: "Failed to fetch travel data" });
  }
});

// 🛫 Route: Airline Check-in Links
app.get("/api/checkin/:airlineCode", async (req, res) => {
  let airlineCode = req.params.airlineCode.toLowerCase().trim();
  
  // Try to find the airline code in our mapping
  if (airlineCodes[airlineCode]) {
    airlineCode = airlineCodes[airlineCode];
  } else {
    // If not found, try uppercase (might be a direct IATA code)
    airlineCode = airlineCode.toUpperCase();
  }
  
  if (!airlineCode) return res.status(400).json({ error: "Airline code is required" });

  try {
    const token = await getAmadeusToken();

    const checkinRes = await axios.get(
      `https://test.api.amadeus.com/v2/reference-data/urls/checkin-links?airlineCode=${airlineCode}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    res.json(checkinRes.data);
  } catch (err) {
    console.error("Amadeus Check-in error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch check-in links" });
  }
});

// 🏨 Route: Hotel Information
app.get("/api/hotels/:city", async (req, res) => {
  const city = req.params.city.toLowerCase().trim();
  
  // Mock hotel data for demonstration
  const hotelData = {
    "london": {
      hotels: [
        { name: "The Savoy", rating: 5, price: "£400-£800", link: "https://www.fairmont.com/savoy-london/", type: "Luxury" },
        { name: "The Shard", rating: 5, price: "£300-£600", link: "https://www.shangri-la.com/london/shangrila/", type: "Luxury" },
        { name: "Premier Inn", rating: 4, price: "£80-£150", link: "https://www.premierinn.com/", type: "Budget" },
        { name: "Travelodge", rating: 3, price: "£60-£120", link: "https://www.travelodge.co.uk/", type: "Budget" }
      ]
    },
    "paris": {
      hotels: [
        { name: "The Ritz Paris", rating: 5, price: "€500-€1000", link: "https://www.ritzparis.com/", type: "Luxury" },
        { name: "Hotel Plaza Athénée", rating: 5, price: "€400-€800", link: "https://www.dorchestercollection.com/paris/", type: "Luxury" },
        { name: "Ibis Paris", rating: 3, price: "€80-€150", link: "https://www.accorhotels.com/", type: "Budget" },
        { name: "Hotel des Grands Boulevards", rating: 4, price: "€150-€300", link: "https://www.hoteldesgrandsboulevards.com/", type: "Boutique" }
      ]
    },
    "tokyo": {
      hotels: [
        { name: "The Ritz-Carlton Tokyo", rating: 5, price: "¥50,000-¥100,000", link: "https://www.ritzcarlton.com/tokyo", type: "Luxury" },
        { name: "Aman Tokyo", rating: 5, price: "¥80,000-¥150,000", link: "https://www.aman.com/resorts/aman-tokyo", type: "Luxury" },
        { name: "Capsule Hotel", rating: 2, price: "¥3,000-¥6,000", link: "https://www.capsuleinn.com/", type: "Budget" },
        { name: "Hotel Gracery Shinjuku", rating: 4, price: "¥15,000-¥30,000", link: "https://www.hotelgracery.com/", type: "Business" }
      ]
    },
    "new york": {
      hotels: [
        { name: "The Plaza", rating: 5, price: "$400-$800", link: "https://www.fairmont.com/the-plaza-new-york/", type: "Luxury" },
        { name: "The St. Regis New York", rating: 5, price: "$500-$1000", link: "https://www.marriott.com/hotels/travel/nycxr-the-st-regis-new-york/", type: "Luxury" },
        { name: "Pod Hotel", rating: 3, price: "$100-$200", link: "https://www.thepodhotel.com/", type: "Budget" },
        { name: "The Standard High Line", rating: 4, price: "$200-$400", link: "https://www.standardhotels.com/new-york/", type: "Boutique" }
      ]
    },
    "dubai": {
      hotels: [
        { name: "Burj Al Arab", rating: 5, price: "AED 2,000-4,000", link: "https://www.jumeirah.com/burj-al-arab", type: "Luxury" },
        { name: "Atlantis The Palm", rating: 5, price: "AED 1,500-3,000", link: "https://www.atlantisthepalm.com/", type: "Luxury" },
        { name: "Ibis Dubai", rating: 3, price: "AED 200-400", link: "https://www.accorhotels.com/", type: "Budget" },
        { name: "Rove Downtown", rating: 4, price: "AED 300-600", link: "https://www.rovehotels.com/", type: "Modern" }
      ]
    }
  };

  // Check if we have hotel data for this city
  if (hotelData[city]) {
    return res.json({
      data: hotelData[city].hotels,
      meta: {
        count: hotelData[city].hotels.length,
        source: "static_data"
      }
    });
  }

  // If no static data, try to get from Amadeus API
  try {
    const token = await getAmadeusToken();
    
    // Get city code for Amadeus API
    const cityCode = cityCodes[city];
    if (!cityCode) {
      return res.status(404).json({ error: "City not found in our database" });
    }

    const hotelsRes = await axios.get(
      `https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city?cityCode=${cityCode}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    res.json(hotelsRes.data);
  } catch (err) {
    console.error("Amadeus Hotels error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch hotel data" });
  }
});

// 🚀 Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
