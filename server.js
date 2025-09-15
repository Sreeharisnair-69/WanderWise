require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

// Load city codes
const cityCodesPath = path.join(__dirname, "src", "cityCodes.json");
let cityCodes = {};
try {
  cityCodes = JSON.parse(fs.readFileSync(cityCodesPath, "utf-8"));
} catch (err) {
  console.error("Failed to load cityCodes.json:", err.message);
}

// Load capital cities map (country -> capital city)
const capitalCitiesPath = path.join(__dirname, "src", "capitalCities.json");
let capitalCities = {};
try {
  capitalCities = JSON.parse(fs.readFileSync(capitalCitiesPath, "utf-8"));
} catch (err) {
  console.error("Failed to load capitalCities.json:", err.message);
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

// Environment variables
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
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

// 🍽️ Route: Restaurants Information
app.get("/api/restaurants/:city", async (req, res) => {
  const city = req.params.city.toLowerCase().trim();
  const seedImage = (seed) => `https://picsum.photos/seed/${encodeURIComponent(seed)}/800/600`;

  // Mock restaurant data for demonstration
  const restaurantData = {
    "san francisco": [
      { name: "Tartine Bakery", rating: 4.7, price: "$$", link: "https://tartinebakery.com/", cuisine: "Bakery", image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=800", reviewCount: 12540 },
      { name: "Benu", rating: 4.8, price: "$$$", link: "https://www.benusf.com/", cuisine: "Fine Dining", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800", reviewCount: 2840 }
    ],
    "singapore": [
      { name: "Din Tai Fung", rating: 4.6, price: "$$", link: "https://dintaifung.com.sg/", cuisine: "Taiwanese", image: "https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=800", reviewCount: 16400 },
      { name: "Liao Fan", rating: 4.4, price: "$", link: "https://www.hawkerchan.com.sg/", cuisine: "Hawker", image: "https://images.unsplash.com/photo-1562157873-818bc0726fef?w=800", reviewCount: 9820 }
    ],
    "london": [
      { name: "Dishoom", rating: 4.6, price: "££", link: "https://www.dishoom.com/", cuisine: "Indian", image: "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=800", reviewCount: 12450 },
      { name: "Flat Iron", rating: 4.5, price: "££", link: "https://flatironsteak.co.uk/", cuisine: "Steakhouse", image: "https://images.unsplash.com/photo-1553163147-622ab57be1c7?w=800", reviewCount: 8450 },
      { name: "Padella", rating: 4.5, price: "£", link: "https://www.padella.co/", cuisine: "Italian", image: "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=800", reviewCount: 9650 },
      { name: "Hoppers", rating: 4.6, price: "££", link: "https://www.hopperslondon.com/", cuisine: "Sri Lankan", image: "https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=800", reviewCount: 6120 },
      { name: "Bao", rating: 4.5, price: "££", link: "https://baolondon.com/", cuisine: "Taiwanese", image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800", reviewCount: 5340 },
      { name: "Hakkasan", rating: 4.6, price: "£££", link: "https://hakkasan.com/", cuisine: "Chinese", image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800", reviewCount: 7420 },
      { name: "Gymkhana", rating: 4.7, price: "£££", link: "https://gymkhanalondon.com/", cuisine: "Indian", image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800", reviewCount: 6210 },
      { name: "St. JOHN", rating: 4.5, price: "£££", link: "https://stjohnrestaurant.com/", cuisine: "British", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800", reviewCount: 4890 },
      { name: "Homeslice", rating: 4.5, price: "£", link: "https://homeslicepizza.co.uk/", cuisine: "Pizza", image: "https://images.unsplash.com/photo-1548366086-7e0b62a4071e?w=800", reviewCount: 7120 },
      { name: "Franco Manca", rating: 4.4, price: "£", link: "https://www.francomanca.co.uk/", cuisine: "Pizza", image: "https://images.unsplash.com/photo-1548366086-7e0b62a4071e?w=800", reviewCount: 9020 },
      { name: "The Ledbury", rating: 4.8, price: "£££", link: "https://www.theledbury.com/", cuisine: "Modern", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800", reviewCount: 3580 },
      { name: "Barrafina", rating: 4.6, price: "££", link: "https://barrafina.co.uk/", cuisine: "Spanish", image: "https://images.unsplash.com/photo-1541542684-4a9c2d0b0b83?w=800", reviewCount: 5280 }
    ],
    "paris": [
      { name: "Le Relais de l'Entrecôte", rating: 4.4, price: "€€", link: "https://www.relaisentrecote.fr/", cuisine: "French", image: "https://images.unsplash.com/photo-1498654200943-1088dd4438ae?w=800", reviewCount: 10320 },
      { name: "Septime", rating: 4.7, price: "€€€", link: "https://septime-charonne.fr/", cuisine: "Modern French", image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800", reviewCount: 4210 },
      { name: "Breizh Café", rating: 4.5, price: "€", link: "https://breizhcafe.com/", cuisine: "Crêperie", image: "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=800", reviewCount: 7320 },
      { name: "Le Comptoir du Relais", rating: 4.6, price: "€€", link: "https://www.hotel-paris-relais-saint-germain.com/restaurant", cuisine: "French", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800", reviewCount: 6120 },
      { name: "Pierre Gagnaire", rating: 4.7, price: "€€€", link: "https://www.pierregagnaire.com/", cuisine: "Fine Dining", image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800", reviewCount: 3890 },
      { name: "Le Bouillon Chartier", rating: 4.3, price: "€", link: "https://bouillon-chartier.com/", cuisine: "French", image: "https://images.unsplash.com/photo-1498654200943-1088dd4438ae?w=800", reviewCount: 18420 }
    ],
    "tokyo": [
      { name: "Ichiran", rating: 4.5, price: "¥", link: "https://ichiran.com/", cuisine: "Ramen", image: "https://images.unsplash.com/photo-1557872943-16a5ac26437b?w=800", reviewCount: 16840 },
      { name: "Sukiyabashi Jiro", rating: 4.6, price: "¥¥¥", link: "https://www.sushi-jiro.jp/", cuisine: "Sushi", image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800", reviewCount: 3920 },
      { name: "Gyukatsu Motomura", rating: 4.6, price: "¥¥", link: "https://www.gyukatsu-motomura.com/", cuisine: "Beef Cutlet", image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800", reviewCount: 11230 },
      { name: "Uobei", rating: 4.4, price: "¥", link: "https://www.genki-sushi.com/", cuisine: "Sushi", image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800", reviewCount: 9420 },
      { name: "Torikizoku", rating: 4.3, price: "¥", link: "https://www.torikizoku.co.jp/", cuisine: "Yakitori", image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800", reviewCount: 8120 },
      { name: "Ramen Nagi", rating: 4.5, price: "¥", link: "https://n-nagi.com/", cuisine: "Ramen", image: "https://images.unsplash.com/photo-1557872943-16a5ac26437b?w=800", reviewCount: 10320 }
    ],
    "new york": [
      { name: "Katz's Delicatessen", rating: 4.6, price: "$", link: "https://katzsdelicatessen.com/", cuisine: "Deli", image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800", reviewCount: 20540 },
      { name: "Carbone", rating: 4.5, price: "$$$", link: "https://carbonenewyork.com/", cuisine: "Italian", image: "https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=800", reviewCount: 5120 },
      { name: "Joe's Pizza", rating: 4.5, price: "$", link: "https://www.joespizza.com/", cuisine: "Pizza", image: "https://images.unsplash.com/photo-1548366086-7e0b62a4071e?w=800", reviewCount: 18340 },
      { name: "Levain Bakery", rating: 4.7, price: "$", link: "https://levainbakery.com/", cuisine: "Bakery", image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=800", reviewCount: 16420 },
      { name: "Shake Shack", rating: 4.4, price: "$", link: "https://shakeshack.com/", cuisine: "Burgers", image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800", reviewCount: 25420 },
      { name: "Momofuku Noodle Bar", rating: 4.5, price: "$$", link: "https://momofuku.com/", cuisine: "Ramen", image: "https://images.unsplash.com/photo-1557872943-16a5ac26437b?w=800", reviewCount: 10450 }
    ],
    "dubai": [
      { name: "Al Ustad Special Kebab", rating: 4.5, price: "AED", link: "https://www.instagram.com/ustadspecialkabab/", cuisine: "Persian", image: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=800", reviewCount: 7430 },
      { name: "Zuma", rating: 4.6, price: "AED AED", link: "https://zumarestaurant.com/", cuisine: "Japanese", image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800", reviewCount: 6520 },
      { name: "Ravi Restaurant", rating: 4.4, price: "AED", link: "https://www.facebook.com/ravirestaurantuae/", cuisine: "Pakistani", image: "https://images.unsplash.com/photo-1604908812838-2f7532d6f2c1?w=800", reviewCount: 5820 },
      { name: "Bu Qtair", rating: 4.4, price: "AED", link: "https://www.instagram.com/buqtair/", cuisine: "Seafood", image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800", reviewCount: 8120 },
      { name: "Al Mallah", rating: 4.5, price: "AED", link: "https://www.almallah.ae/", cuisine: "Lebanese", image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800", reviewCount: 6920 },
      { name: "Operation Falafel", rating: 4.4, price: "AED", link: "https://www.operationfalafel.com/", cuisine: "Middle Eastern", image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800", reviewCount: 8420 }
    ],
    "madrid": [
      { name: "Sobrino de Botín", rating: 4.4, price: "€€", link: "https://botin.es/", cuisine: "Spanish", image: "https://images.unsplash.com/photo-1541542684-4a9c2d0b0b83?w=800", reviewCount: 8120 },
      { name: "StreetXO", rating: 4.6, price: "€€€", link: "https://www.streetxo.com/", cuisine: "Fusion", image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800", reviewCount: 4210 }
    ],
    "amsterdam": [
      { name: "Foodhallen", rating: 4.6, price: "€€", link: "https://www.foodhallen.nl/", cuisine: "Food Court", image: "https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=800", reviewCount: 5320 },
      { name: "Cannibale Royale", rating: 4.5, price: "€€", link: "https://www.cannibaleroyale.nl/", cuisine: "Grill", image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800", reviewCount: 3120 }
    ],
    "berlin": [
      { name: "Mustafa's Gemüse Kebap", rating: 4.5, price: "€", link: "https://www.mustafas.de/", cuisine: "Kebab", image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800", reviewCount: 6890 },
      { name: "Katz Orange", rating: 4.5, price: "€€€", link: "https://katzorange.com/", cuisine: "Modern", image: "https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=800", reviewCount: 2980 }
    ]
  };

  if (restaurantData[city]) {
    const data = restaurantData[city].map(r => ({
      ...r,
      image: seedImage(`${city}-${r.name}`)
    }));
    return res.json({
      data,
      meta: { count: data.length, source: "static_data" }
    });
  }

  return res.status(404).json({ error: "No restaurant data for this city" });
});


// --- Travel Route ---
app.get("/api/travel/:city", async (req, res) => {
  let city = req.params.city.toLowerCase();

  // If user provided a country name, map to its capital city
  if (capitalCities[city]) {
    city = capitalCities[city].toLowerCase();
  }
  
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
  const seedImage = (seed) => `https://picsum.photos/seed/${encodeURIComponent(seed)}/800/600`;
  
  // Mock hotel data for demonstration
  const hotelData = {
    "san francisco": {
      hotels: [
        { name: "Fairmont San Francisco", rating: 5, price: "$350-$700", link: "https://www.fairmont.com/san-francisco/", type: "Luxury", image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800", reviewCount: 2200 },
        { name: "Hotel Nikko", rating: 4, price: "$180-$300", link: "https://www.hotelnikkosf.com/", type: "Modern", image: "https://images.unsplash.com/photo-1551776235-dde6d4829808?w=800", reviewCount: 1600 }
      ]
    },
    "singapore": {
      hotels: [
        { name: "Marina Bay Sands", rating: 5, price: "S$400-S$800", link: "https://www.marinabaysands.com/", type: "Luxury", image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800", reviewCount: 8920 },
        { name: "YOTEL Singapore", rating: 4, price: "S$120-S$220", link: "https://www.yotel.com/", type: "Modern", image: "https://images.unsplash.com/photo-1501117716987-c8e76de02f2a?w=800", reviewCount: 2310 }
      ]
    },
    "london": {
      hotels: [
        { name: "The Savoy", rating: 5, price: "£400-£800", link: "https://www.fairmont.com/savoy-london/", type: "Luxury", image: "https://images.unsplash.com/photo-1551776245-69b5a5d2e7b2?w=800", reviewCount: 3210 },
        { name: "The Shard", rating: 5, price: "£300-£600", link: "https://www.shangri-la.com/london/shangrila/", type: "Luxury", image: "https://images.unsplash.com/photo-1538688423619-a81d3f23454b?w=800", reviewCount: 2874 },
        { name: "Premier Inn", rating: 4, price: "£80-£150", link: "https://www.premierinn.com/", type: "Budget", image: "https://images.unsplash.com/photo-1501117716987-c8e76de02f2a?w=800", reviewCount: 512 },
        { name: "Travelodge", rating: 3, price: "£60-£120", link: "https://www.travelodge.co.uk/", type: "Budget", image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800", reviewCount: 448 },
        { name: "The Connaught", rating: 5, price: "£450-£900", link: "https://www.the-connaught.co.uk/", type: "Luxury", image: "https://images.unsplash.com/photo-1502920917128-1aa500764b8a?w=800", reviewCount: 2980 },
        { name: "The Ned", rating: 5, price: "£280-£550", link: "https://www.thened.com/", type: "Boutique", image: "https://images.unsplash.com/photo-1568495248636-6432b97bd949?w=800", reviewCount: 2140 },
        { name: "citizenM London", rating: 4, price: "£120-£220", link: "https://www.citizenm.com/", type: "Modern", image: "https://images.unsplash.com/photo-1501117716987-c8e76de02f2a?w=800", reviewCount: 990 },
        { name: "Generator London", rating: 3, price: "£60-£120", link: "https://staygenerator.com/", type: "Budget", image: "https://images.unsplash.com/photo-1505692794403-34cbeb5ab5a1?w=800", reviewCount: 870 }
      ]
    },
    "paris": {
      hotels: [
        { name: "The Ritz Paris", rating: 5, price: "€500-€1000", link: "https://www.ritzparis.com/", type: "Luxury", image: "https://images.unsplash.com/photo-1502920917128-1aa500764b8a?w=800", reviewCount: 4012 },
        { name: "Hotel Plaza Athénée", rating: 5, price: "€400-€800", link: "https://www.dorchestercollection.com/paris/", type: "Luxury", image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800", reviewCount: 1890 },
        { name: "Ibis Paris", rating: 3, price: "€80-€150", link: "https://www.accorhotels.com/", type: "Budget", image: "https://images.unsplash.com/photo-1551776245-69b5a5d2e7b2?w=800", reviewCount: 932 },
        { name: "Hotel des Grands Boulevards", rating: 4, price: "€150-€300", link: "https://www.hoteldesgrandsboulevards.com/", type: "Boutique", image: "https://images.unsplash.com/photo-1568495248636-6432b97bd949?w=800", reviewCount: 678 },
        { name: "Hôtel Costes", rating: 5, price: "€400-€800", link: "https://www.hotelcostes.com/", type: "Boutique", image: "https://images.unsplash.com/photo-1502920917128-1aa500764b8a?w=800", reviewCount: 1420 },
        { name: "citizenM Paris", rating: 4, price: "€100-€200", link: "https://www.citizenm.com/", type: "Modern", image: "https://images.unsplash.com/photo-1501117716987-c8e76de02f2a?w=800", reviewCount: 980 }
      ]
    },
    "tokyo": {
      hotels: [
        { name: "The Ritz-Carlton Tokyo", rating: 5, price: "¥50,000-¥100,000", link: "https://www.ritzcarlton.com/tokyo", type: "Luxury", image: "https://images.unsplash.com/photo-1541976076758-347942db1970?w=800", reviewCount: 2550 },
        { name: "Aman Tokyo", rating: 5, price: "¥80,000-¥150,000", link: "https://www.aman.com/resorts/aman-tokyo", type: "Luxury", image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800", reviewCount: 1450 },
        { name: "Capsule Hotel", rating: 2, price: "¥3,000-¥6,000", link: "https://www.capsuleinn.com/", type: "Budget", image: "https://images.unsplash.com/photo-1549187774-b4e9b0445b41?w=800", reviewCount: 812 },
        { name: "Hotel Gracery Shinjuku", rating: 4, price: "¥15,000-¥30,000", link: "https://www.hotelgracery.com/", type: "Business", image: "https://images.unsplash.com/photo-1551776235-dde6d4829808?w=800", reviewCount: 1042 },
        { name: "Park Hyatt Tokyo", rating: 5, price: "¥50,000-¥120,000", link: "https://www.hyatt.com/en-US/hotel/japan/park-hyatt-tokyo/tyoph", type: "Luxury", image: "https://images.unsplash.com/photo-1541976076758-347942db1970?w=800", reviewCount: 2210 },
        { name: "Shinjuku Granbell Hotel", rating: 4, price: "¥10,000-¥20,000", link: "https://www.granbellhotel.jp/", type: "Modern", image: "https://images.unsplash.com/photo-1551776235-dde6d4829808?w=800", reviewCount: 1280 }
      ]
    },
    "new york": {
      hotels: [
        { name: "The Plaza", rating: 5, price: "$400-$800", link: "https://www.fairmont.com/the-plaza-new-york/", type: "Luxury", image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800", reviewCount: 3990 },
        { name: "The St. Regis New York", rating: 5, price: "$500-$1000", link: "https://www.marriott.com/hotels/travel/nycxr-the-st-regis-new-york/", type: "Luxury", image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800", reviewCount: 2760 },
        { name: "Pod Hotel", rating: 3, price: "$100-$200", link: "https://www.thepodhotel.com/", type: "Budget", image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800", reviewCount: 1180 },
        { name: "The Standard High Line", rating: 4, price: "$200-$400", link: "https://www.standardhotels.com/new-york/", type: "Boutique", image: "https://images.unsplash.com/photo-1501117716987-c8e76de02f2a?w=800", reviewCount: 1344 },
        { name: "Arlo SoHo", rating: 4, price: "$150-$250", link: "https://www.arlohotels.com/", type: "Boutique", image: "https://images.unsplash.com/photo-1511747779856-fd751a79aa23?w=800", reviewCount: 980 },
        { name: "citizenM New York", rating: 4, price: "$120-$220", link: "https://www.citizenm.com/", type: "Modern", image: "https://images.unsplash.com/photo-1501117716987-c8e76de02f2a?w=800", reviewCount: 1140 }
      ]
    },
    "dubai": {
      hotels: [
        { name: "Burj Al Arab", rating: 5, price: "AED 2,000-4,000", link: "https://www.jumeirah.com/burj-al-arab", type: "Luxury", image: "https://images.unsplash.com/photo-1500043357865-c6b8827edf10?w=800", reviewCount: 5120 },
        { name: "Atlantis The Palm", rating: 5, price: "AED 1,500-3,000", link: "https://www.atlantisthepalm.com/", type: "Luxury", image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800", reviewCount: 4320 },
        { name: "Ibis Dubai", rating: 3, price: "AED 200-400", link: "https://www.accorhotels.com/", type: "Budget", image: "https://images.unsplash.com/photo-1505692794403-34cbeb5ab5a1?w=800", reviewCount: 820 },
        { name: "Rove Downtown", rating: 4, price: "AED 300-600", link: "https://www.rovehotels.com/", type: "Modern", image: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800", reviewCount: 940 }
      ]
    },
    "madrid": {
      hotels: [
        { name: "Hotel Riu Plaza España", rating: 4, price: "€120-€250", link: "https://www.riu.com/en/hotel/spain/madrid/riu-plaza-espana/", type: "Modern", image: "https://images.unsplash.com/photo-1511747779856-fd751a79aa23?w=800", reviewCount: 980 },
        { name: "Only YOU Boutique Hotel", rating: 4, price: "€150-€300", link: "https://www.onlyyouhotels.com/", type: "Boutique", image: "https://images.unsplash.com/photo-1551776235-dde6d4829808?w=800", reviewCount: 760 },
        { name: "Ibis Madrid Centro", rating: 3, price: "€70-€120", link: "https://all.accor.com/", type: "Budget", image: "https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?w=800", reviewCount: 540 }
      ]
    },
    "amsterdam": {
      hotels: [
        { name: "Hotel Pulitzer", rating: 5, price: "€250-€500", link: "https://www.pulitzeramsterdam.com/", type: "Luxury", image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800", reviewCount: 2150 },
        { name: "citizenM Amsterdam", rating: 4, price: "€100-€200", link: "https://www.citizenm.com/", type: "Modern", image: "https://images.unsplash.com/photo-1500043357865-c6b8827edf10?w=800", reviewCount: 1120 },
        { name: "Generator Amsterdam", rating: 3, price: "€60-€120", link: "https://staygenerator.com/", type: "Budget", image: "https://images.unsplash.com/photo-1505692794403-34cbeb5ab5a1?w=800", reviewCount: 740 }
      ]
    },
    "berlin": {
      hotels: [
        { name: "Hotel Adlon Kempinski", rating: 5, price: "€250-€500", link: "https://www.kempinski.com/", type: "Luxury", image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800", reviewCount: 1540 },
        { name: "25hours Hotel Bikini", rating: 4, price: "€120-€250", link: "https://www.25hours-hotels.com/", type: "Boutique", image: "https://images.unsplash.com/photo-1511747779856-fd751a79aa23?w=800", reviewCount: 820 },
        { name: "Meininger Hotel", rating: 3, price: "€60-€120", link: "https://www.meininger-hotels.com/", type: "Budget", image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800", reviewCount: 610 }
      ]
    }
  };

  // Check if we have hotel data for this city
  if (hotelData[city]) {
    const data = hotelData[city].hotels.map(h => ({
      ...h,
      image: seedImage(`${city}-${h.name}`)
    }));
    return res.json({
      data,
      meta: {
        count: data.length,
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

// 🚗 Rental cars (mock)
app.get('/api/cars/:city', (req, res) => {
  const city = req.params.city.toLowerCase().trim();
  const carsDb = {
    "london": [
      { company: "Hertz", pricePerDay: "£45-£90", vehicle: "Compact/Full-size", url: "https://www.hertz.co.uk/" },
      { company: "Enterprise", pricePerDay: "£40-£85", vehicle: "Economy/SUV", url: "https://www.enterprise.co.uk/" }
    ],
    "paris": [
      { company: "Sixt", pricePerDay: "€40-€95", vehicle: "Compact/SUV", url: "https://www.sixt.fr/" },
      { company: "Avis", pricePerDay: "€38-€90", vehicle: "Economy/Midsize", url: "https://www.avis.fr/" }
    ],
    "san francisco": [
      { company: "Alamo", pricePerDay: "$45-$110", vehicle: "Economy/SUV", url: "https://www.alamo.com/" },
      { company: "Budget", pricePerDay: "$40-$95", vehicle: "Compact/Full-size", url: "https://www.budget.com/" }
    ],
    "singapore": [
      { company: "Hertz", pricePerDay: "S$60-S$120", vehicle: "Compact/SUV", url: "https://www.hertz.com.sg/" },
      { company: "Sixt", pricePerDay: "S$55-S$110", vehicle: "Economy/Full-size", url: "https://www.sixt.com.sg/" }
    ]
  };
  if (carsDb[city]) {
    return res.json({ data: carsDb[city], meta: { count: carsDb[city].length, source: 'static_data' } });
  }
  return res.status(404).json({ error: 'No rental cars data for this city' });
});

// --- Simple Auth (file-based users with JWT) ---
const usersDbPath = path.join(__dirname, 'users.json');
const readUsers = () => {
  try { return JSON.parse(fs.readFileSync(usersDbPath, 'utf-8')); } catch { return []; }
};
const writeUsers = (users) => fs.writeFileSync(usersDbPath, JSON.stringify(users, null, 2));
const hashPassword = (pwd) => crypto.createHash('sha256').update(pwd).digest('hex');

app.post('/api/auth/signup', (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const users = readUsers();
  if (users.find(u => u.email === email)) return res.status(409).json({ error: 'Email already registered' });
  const user = { id: crypto.randomUUID(), email, name: name || email.split('@')[0], passwordHash: hashPassword(password) };
  users.push(user); writeUsers(users);
  const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

app.post('/api/auth/signin', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const users = readUsers();
  const user = users.find(u => u.email === email && u.passwordHash === hashPassword(password));
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

app.get('/api/auth/me', (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.substring(7) : null;
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const users = readUsers();
    const user = users.find(u => u.id === payload.sub);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, email: user.email, name: user.name });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});
