const axios = require("axios");

const getEnv = (key) => process.env[key] || process.env[`NEXT_PUBLIC_${key}`];

const WEATHER_API_KEY = getEnv("WEATHER_API_KEY");
const AMADEUS_CLIENT_ID = getEnv("AMADEUS_CLIENT_ID");
const AMADEUS_CLIENT_SECRET = getEnv("AMADEUS_CLIENT_SECRET");

const getAmadeusToken = async () => {
  const res = await axios.post(
    "https://test.api.amadeus.com/v1/security/oauth2/token",
    new URLSearchParams({
      grant_type: "client_credentials",
      client_id: AMADEUS_CLIENT_ID,
      client_secret: AMADEUS_CLIENT_SECRET,
    }).toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  return res.data.access_token;
};

module.exports = {
  axios,
  WEATHER_API_KEY,
  AMADEUS_CLIENT_ID,
  AMADEUS_CLIENT_SECRET,
  getAmadeusToken,
};


