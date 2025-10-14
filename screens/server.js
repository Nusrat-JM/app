
const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors()); 

app.get("/route", async (req, res) => {
  const { originLat, originLng, destLat, destLng } = req.query;

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`;
    const r = await fetch(url);
    const json = await r.json();
    res.json(json);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));//api connection
