// Resolves MRT station codes (the only identifier LTA's crowd feed returns)
// to a name and coordinates, using OneMap search as the authority. Nothing is
// hardcoded: a code that can't be resolved is dropped rather than guessed.
import { oneMapSearch } from "./onemap.js";

const cache = new Map(); // code -> { code, name, lat, lng } | null
const CONCURRENCY = 6;

function pickMatch(code, results) {
  const upper = code.toUpperCase();
  // OneMap names stations like "BISHAN MRT STATION (NS17/CC9)".
  const exact = results.find((r) => {
    const hay = `${r.name} ${r.searchval}`.toUpperCase();
    return hay.includes(`(${upper})`) || hay.includes(`/${upper})`) || hay.includes(`(${upper}/`) || hay.includes(`/${upper}/`);
  });
  if (exact) return exact;
  const mrt = results.find((r) => /MRT|LRT/i.test(`${r.name} ${r.searchval}`));
  return mrt || null;
}

async function resolveOne(code) {
  if (cache.has(code)) return cache.get(code);
  try {
    const results = await oneMapSearch(`${code} station`);
    const hit = pickMatch(code, results);
    const value = hit && isFinite(hit.lat) && isFinite(hit.lng)
      ? { code, name: cleanName(hit.name || hit.searchval), lat: hit.lat, lng: hit.lng }
      : null;
    cache.set(code, value);
    return value;
  } catch {
    // Don't cache transport failures — a later request should retry.
    return null;
  }
}

function cleanName(raw) {
  return String(raw)
    .replace(/\s*\((?:[A-Z]{2}\d+\/?)+\)\s*$/i, "")
    .replace(/\s+(MRT|LRT)\s+STATION$/i, "")
    .trim();
}

export async function resolveStations(codes) {
  const unique = [...new Set(codes.filter(Boolean))];
  const out = [];
  for (let i = 0; i < unique.length; i += CONCURRENCY) {
    const batch = unique.slice(i, i + CONCURRENCY);
    const settled = await Promise.all(batch.map(resolveOne));
    settled.forEach((v) => v && out.push(v));
  }
  return out;
}
