import { getOneMapToken } from "./_lib/onemapAuth.js";

// Proxies OneMap's routing service (walk / drive / cycle / public transport).
// Public-transport routing needs an authenticated token, which is fetched
// server-side so the OneMap credentials never reach the browser.
export default async function handler(req, res) {
  const q = req.query ?? Object.fromEntries(new URL(req.url, "http://localhost").searchParams);
  const { start, end, routeType = "pt", mode = "TRANSIT", date, time } = q;

  if (!start || !end) {
    res.status(400).json({ error: "Missing start or end (lat,lng)" });
    return;
  }

  try {
    const token = await getOneMapToken();
    const url = new URL("https://www.onemap.gov.sg/api/public/routingsvc/route");
    url.searchParams.set("start", start);
    url.searchParams.set("end", end);
    url.searchParams.set("routeType", routeType);
    if (routeType === "pt") {
      url.searchParams.set("date", date || new Date().toISOString().slice(0, 10));
      url.searchParams.set("time", time || new Date().toTimeString().slice(0, 8));
      url.searchParams.set("mode", mode);
      url.searchParams.set("maxWalkDistance", "1000");
      url.searchParams.set("numItineraries", "3");
    }

    const upstream = await fetch(url.toString(), {
      headers: { Authorization: token },
    });
    const data = await upstream.json();
    if (!upstream.ok) {
      res.status(upstream.status).json({ error: "OneMap routing failed", detail: data });
      return;
    }
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ error: "OneMap routing request failed", detail: String(err) });
  }
}
