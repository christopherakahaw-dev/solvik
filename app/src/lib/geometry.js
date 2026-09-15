// How far along a polyline a position sits, 0..1 — used to advance
// turn-by-turn from the device's real position instead of a timer.
export function fractionAlong(coords, point) {
  if (!coords || coords.length < 2 || !point) return null;
  let best = 0, bestDist = Infinity, travelled = 0, total = 0;
  const seg = [];
  for (let i = 0; i < coords.length - 1; i++) {
    const d = Math.hypot(coords[i + 1][0] - coords[i][0], coords[i + 1][1] - coords[i][1]);
    seg.push(d);
    total += d;
  }
  if (!total) return null;
  for (let i = 0; i < coords.length - 1; i++) {
    const dist = Math.hypot(coords[i][0] - point[0], coords[i][1] - point[1]);
    if (dist < bestDist) {
      bestDist = dist;
      best = travelled;
    }
    travelled += seg[i];
  }
  // Too far from the line to be meaningful (roughly 400 m in degrees).
  if (bestDist > 0.004) return null;
  return Math.max(0, Math.min(1, best / total));
}

