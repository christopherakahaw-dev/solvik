// Thin client for the OneMap proxy endpoints in /api. Every function throws
// on failure (network error, missing server credentials, no results) so
// callers can fall back to illustrative data when live keys aren't wired up
// yet — see src/lib/withFallback.js.

export async function searchPlaces(query) {
  const res = await fetch(`/api/onemap-search?q=${encodeURIComponent(query)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "OneMap search failed");
  return data.results;
}

// start/end: [lat, lng]
export async function getPublicTransportRoute(start, end, { date, time, mode = "TRANSIT" } = {}) {
  const params = new URLSearchParams({
    start: `${start[0]},${start[1]}`,
    end: `${end[0]},${end[1]}`,
    routeType: "pt",
    mode,
  });
  if (date) params.set("date", date);
  if (time) params.set("time", time);
  const res = await fetch(`/api/onemap-route?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "OneMap routing failed");
  return data;
}

export async function getWalkingRoute(start, end) {
  const params = new URLSearchParams({
    start: `${start[0]},${start[1]}`,
    end: `${end[0]},${end[1]}`,
    routeType: "walk",
  });
  const res = await fetch(`/api/onemap-route?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "OneMap routing failed");
  return data;
}
