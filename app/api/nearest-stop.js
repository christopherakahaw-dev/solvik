// Resolves the bus stop nearest a coordinate, so a report is filed against a
// real stop. The stop list changes rarely, so it's fetched once per
// serverless instance and kept in module memory.
import { ltaFetchAll } from "./_lib/lta.js";

let stopsCache = null; // { stops, at }
let inFlight = null;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

async function loadStops() {
  if (stopsCache && Date.now() - stopsCache.at < CACHE_TTL_MS) return stopsCache.stops;
  if (inFlight) return inFlight;
  inFlight = ltaFetchAll("BusStops")
    .then((stops) => {
      stopsCache = { stops, at: Date.now() };
      inFlight = null;
      return stops;
    })
    .catch((err) => {
      inFlight = null;
      throw err;
    });
  return inFlight;
}

function distanceMetres(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export default async function handler(req, res) {
  const q = req.query ?? Object.fromEntries(new URL(req.url, "http://localhost").searchParams);
  const lat = Number(q.lat);
  const lng = Number(q.lng);
  if (!isFinite(lat) || !isFinite(lng)) {
    res.status(400).json({ error: "Missing or invalid lat/lng" });
    return;
  }

  try {
    const stops = await loadStops();
    let best = null;
    let bestD = Infinity;
    for (const s of stops) {
      const d = distanceMetres(lat, lng, s.Latitude, s.Longitude);
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    if (!best) {
      res.status(404).json({ error: "No stops found" });
      return;
    }
    res.status(200).json({ code: best.BusStopCode, name: best.Description, road: best.RoadName, lat: best.Latitude, lng: best.Longitude, distanceM: bestD });
  } catch (err) {
    const msg = String(err && err.message ? err.message : err);
    res.status(msg.includes("not configured") ? 501 : 502).json({ error: msg });
  }
}
