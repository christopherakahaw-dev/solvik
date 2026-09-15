// Generic proxy for LTA DataMall so the AccountKey never reaches the
// browser. Only a fixed set of read-only endpoints can be requested, and the
// path is validated against that allowlist before being forwarded.
const ALLOWED_ENDPOINTS = new Set([
  "v3/BusArrival",
  "BusArrivalv2",
  "PCDRealTime",
  "PCDForecast",
  "FacilitiesMaintenance",
  "BusServices",
  "BusRoutes",
  "BusStops",
  "TrainServiceAlerts",
  "PlatformCrowdDensityRealTime",
  "PlatformCrowdDensityForecast",
  "TrafficIncidents",
  "CarParkAvailability",
  "TaxiAvailability",
  "FaultyTrafficLights",
]);

export default async function handler(req, res) {
  const key = process.env.LTA_ACCOUNT_KEY;
  if (!key) {
    res.status(501).json({ error: "LTA_ACCOUNT_KEY is not configured on the server." });
    return;
  }

  const q = req.query ?? Object.fromEntries(new URL(req.url, "http://localhost").searchParams);
  const { endpoint, ...rest } = q;
  if (!endpoint || !ALLOWED_ENDPOINTS.has(endpoint)) {
    res.status(400).json({ error: "Missing or unsupported endpoint", allowed: Array.from(ALLOWED_ENDPOINTS) });
    return;
  }

  const url = new URL(`https://datamall2.mytransport.sg/ltaodataservice/${endpoint}`);
  for (const [k, v] of Object.entries(rest)) {
    if (v != null) url.searchParams.set(k, v);
  }

  try {
    const upstream = await fetch(url.toString(), {
      headers: { AccountKey: key, accept: "application/json" },
    });
    const data = await upstream.json();
    if (!upstream.ok) {
      res.status(upstream.status).json({ error: `LTA DataMall request failed (${upstream.status})`, detail: data });
      return;
    }
    res.setHeader("Cache-Control", "s-maxage=15, stale-while-revalidate=30");
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ error: "LTA DataMall request failed", detail: String(err) });
  }
}
