const { axios, getAmadeusToken } = require("./_utils");
const fs = require("fs");
const path = require("path");

const readJson = (p) => {
  try { return JSON.parse(fs.readFileSync(p, "utf-8")); } catch { return {}; }
};

const root = path.join(__dirname, "..");
const cityCodes = readJson(path.join(root, "src", "cityCodes.json"));
const travelData = readJson(path.join(root, "src", "travelData.json"));
const capitalCities = readJson(path.join(root, "src", "capitalCities.json"));

module.exports = async (req, res) => {
  let { city } = req.query;
  if (!city) return res.status(400).json({ error: "City is required" });
  city = city.toLowerCase().trim();

  if (capitalCities[city]) city = capitalCities[city].toLowerCase();

  if (travelData[city]) {
    const staticData = travelData[city];
    return res.status(200).json({
      data: staticData.destinations.map((d) => ({ destination: d, type: "airport" })),
      meta: { count: staticData.destinations.length, source: "static_data" },
    });
  }

  const originCode = cityCodes[city];
  if (!originCode) return res.status(404).json({ error: "City not found in our database" });

  try {
    const token = await getAmadeusToken();
    const { data } = await axios.get(
      `https://test.api.amadeus.com/v1/shopping/flight-destinations?origin=${originCode}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    res.status(200).json(data);
  } catch (err) {
    if (travelData[city]) {
      const staticData = travelData[city];
      return res.status(200).json({
        data: staticData.destinations.map((d) => ({ destination: d, type: "airport" })),
        meta: { count: staticData.destinations.length, source: "static_data_fallback" },
      });
    }
    res.status(500).json({ error: "Failed to fetch travel data" });
  }
};


