// Live bus arrivals for every bus leg currently on screen, in one round trip.
// The route sheet polls this while it's open, so the times on the cards tick
// down instead of being frozen at whenever the trip was planned.
import { nextBuses } from "./_lib/arrivals.js";

const MAX_PAIRS = 12;

export default async function handler(req, res) {
  const q = req.query ?? Object.fromEntries(new URL(req.url, "http://localhost").searchParams);
  const raw = String(q.stops || "").trim();
  if (!raw) {
    res.status(400).json({ error: "Missing stops (stopCode:service,…)" });
    return;
  }

  const pairs = raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, MAX_PAIRS)
    .map((part) => {
      const [stop, service] = part.split(":");
      return { key: part, stop: (stop || "").trim(), service: (service || "").trim() };
    });

  const results = await Promise.all(
    pairs.map(async ({ key, stop, service }) => [key, await nextBuses(stop, service)])
  );

  const arrivals = {};
  for (const [key, value] of results) arrivals[key] = value;
  res.status(200).json({ arrivals, at: new Date().toISOString() });
}
