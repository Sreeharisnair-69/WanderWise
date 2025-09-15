const { axios, WEATHER_API_KEY } = require("./_utils");

module.exports = async (req, res) => {
  const { city } = req.query;
  if (!city) return res.status(400).json({ error: "City is required" });
  if (!WEATHER_API_KEY) return res.status(500).json({ error: "Server misconfigured" });
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${WEATHER_API_KEY}&units=metric`;
    const { data } = await axios.get(url);
    res.status(200).json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: "Failed", message: err.response?.data?.message || err.message });
  }
};


