const { axios, getAmadeusToken } = require("./_utils");
const fs = require("fs");
const path = require("path");

const readJson = (p) => {
  try { return JSON.parse(fs.readFileSync(p, "utf-8")); } catch { return {}; }
};

const root = path.join(__dirname, "..");
const airlineCodes = readJson(path.join(root, "src", "airlineCodes.json"));

module.exports = async (req, res) => {
  let { airlineCode } = req.query;
  if (!airlineCode) return res.status(400).json({ error: "Airline code is required" });
  airlineCode = airlineCode.toLowerCase().trim();

  if (airlineCodes[airlineCode]) airlineCode = airlineCodes[airlineCode];
  else airlineCode = airlineCode.toUpperCase();

  try {
    const token = await getAmadeusToken();
    const { data } = await axios.get(
      `https://test.api.amadeus.com/v2/reference-data/urls/checkin-links?airlineCode=${airlineCode}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch check-in links" });
  }
};


