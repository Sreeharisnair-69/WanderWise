const { axios, getAmadeusToken } = require("./_utils");
const fs = require("fs");
const path = require("path");

const readJson = (p) => {
  try { return JSON.parse(fs.readFileSync(p, "utf-8")); } catch { return {}; }
};

const root = path.join(__dirname, "..");
const cityCodes = readJson(path.join(root, "src", "cityCodes.json"));

module.exports = async (req, res) => {
  let { city } = req.query;
  if (!city) return res.status(400).json({ error: "City is required" });
  city = city.toLowerCase().trim();

  // align with server.js mock data behavior is not necessary here; serverless will just call Amadeus if present
  try {
    const token = await getAmadeusToken();
    const cityCode = cityCodes[city];
    if (!cityCode) return res.status(404).json({ error: "City not found in our database" });

    const { data } = await axios.get(
      `https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city?cityCode=${cityCode}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch hotel data" });
  }
};


