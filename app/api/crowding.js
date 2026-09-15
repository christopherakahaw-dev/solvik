// Live platform crowding per MRT station, plus the same-day forecast that
// drives the time scrubber. Joins LTA's crowd levels (which identify stations
// only by code) with OneMap coordinates.
import { ltaFetch, crowdLevelFrom, TRAIN_LINES } from "./_lib/lta.js";
import { resolveStations } from "./_lib/stations.js";

// DataMall renamed these; try both spellings.
const REALTIME = ["PCDRealTime", "PlatformCrowdDensityRealTime"];
const FORECAST = ["PCDForecast", "PlatformCrowdDensityForecast"];

const PCT = { light: 35, moderate: 65, busy: 92 };

let realtimeCache = null; // { at, stations }
const REALTIME_TTL_MS = 60_000;
let forecastCache = null; // { at, byStation, slots }
const FORECAST_TTL_MS = 10 * 60_000;

async function perLine(paths, params) {
  const results = await Promise.allSettled(
    TRAIN_LINES.map((line) => ltaFetch(paths, { ...params, TrainLine: line }))
  );
  const ok = results.filter((r) => r.status === "fulfilled");
  if (!ok.length) {
    const reason = results[0] && results[0].reason;
    throw new Error(reason ? String(reason.message || reason) : "No crowd data");
  }
  return ok.flatMap((r) => r.value.value || []);
}

async function realtimeStations() {
  if (realtimeCache && Date.now() - realtimeCache.at < REALTIME_TTL_MS) return realtimeCache.stations;

  const rows = await perLine(REALTIME);
  const levels = new Map();
  rows.forEach((row) => {
    const level = crowdLevelFrom(row.CrowdLevel);
    if (row.Station && level) levels.set(row.Station, level);
  });

  const located = await resolveStations([...levels.keys()]);
  const stations = located.map((st) => ({
    ...st,
    level: levels.get(st.code),
    pct: PCT[levels.get(st.code)] || PCT.light,
  }));
  realtimeCache = { at: Date.now(), stations };
  return stations;
}

// Forecast rows carry a station's level at 30-minute intervals for the day.
async function forecastIndex() {
  if (forecastCache && Date.now() - forecastCache.at < FORECAST_TTL_MS) return forecastCache;

  const rows = await perLine(FORECAST);
  const byStation = new Map(); // "CODE|ISO" -> level
  const slots = new Set();
  rows.forEach((row) => {
    (row.Stations || []).forEach((st) => {
      (st.Interval || []).forEach((iv) => {
        const level = crowdLevelFrom(iv.CrowdLevel);
        if (!level || !iv.Start) return;
        slots.add(iv.Start);
        byStation.set(`${st.Station}|${iv.Start}`, level);
      });
    });
  });
  forecastCache = { at: Date.now(), byStation, slots: [...slots].sort() };
  return forecastCache;
}

export default async function handler(req, res) {
  const q = req.query ?? Object.fromEntries(new URL(req.url, "http://localhost").searchParams);

  try {
    const stations = await realtimeStations();

    let slots = [];
    let at = null;
    try {
      const fc = await forecastIndex();
      slots = fc.slots;
      if (q.at && fc.byStation.size) {
        at = q.at;
        stations.forEach((st) => {
          const level = fc.byStation.get(`${st.code}|${q.at}`);
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
