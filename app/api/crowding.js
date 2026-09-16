// Live platform crowding per MRT station, plus the same-day forecast that
// drives the time scrubber. Joins LTA's crowd levels (which identify stations
// only by code) with OneMap coordinates.
import { realtimeLevels, forecastIndex, PCT } from "./_lib/crowd.js";
import { resolveStations } from "./_lib/stations.js";

let locatedCache = null; // { at, stations } — resolved coordinates, not levels
const LOCATED_TTL_MS = 60_000;

async function stationsWithLevels() {
  const levels = await realtimeLevels();
  if (locatedCache && Date.now() - locatedCache.at < LOCATED_TTL_MS) {
    return locatedCache.stations.map((st) => ({ ...st, level: levels.get(st.code), pct: PCT[levels.get(st.code)] || PCT.light }));
  }
  const located = await resolveStations([...levels.keys()]);
  locatedCache = { at: Date.now(), stations: located };
  return located.map((st) => ({ ...st, level: levels.get(st.code), pct: PCT[levels.get(st.code)] || PCT.light }));
}

export default async function handler(req, res) {
  const q = req.query ?? Object.fromEntries(new URL(req.url, "http://localhost").searchParams);

  try {
    const stations = await stationsWithLevels();

    let slots = [];
    let at = null;
    try {
      const fc = await forecastIndex();
      slots = fc.slots;
      if (q.at && fc.byCode.size) {
        at = q.at;
        stations.forEach((st) => {
          const level = (fc.byCode.get(st.code) || {})[q.at];
          if (level) {
            st.level = level;
            st.pct = PCT[level];
          }
        });
      }
    } catch {
      // Forecast is optional — real-time alone still renders the map.
      slots = [];
    }

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    res.status(200).json({ at, slots, stations });
  } catch (err) {
    const msg = String(err && err.message ? err.message : err);
    res.status(msg.includes("not configured") ? 501 : 502).json({ error: msg });
  }
}
