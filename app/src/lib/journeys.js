// What Solvik remembers about where you go.
//
// Only deliberate actions are recorded — a destination you chose, a journey you
// started — never a background trace of where the device has been. Everything
// stays in this browser: no endpoint in api/ receives any of it.
//
// Two shapes are kept per journey: where it went (so repeats can be spotted)
// and which lines it used (so a disruption can be matched to a trip you
// actually make). Nothing else.

import { KEYS, loadStored, store } from "./storage.js";

export const MAX_JOURNEYS = 200;
export const JOURNEY_TTL_MS = 90 * 24 * 60 * 60 * 1000;

const isLL = (v) => Array.isArray(v) && v.length >= 2 && Number.isFinite(Number(v[0])) && Number.isFinite(Number(v[1]));

function clean(entry) {
  if (!entry || !isLL(entry.toLL)) return null;
  return {
    id: entry.id,
    at: Number(entry.at) || 0,
    fromLL: isLL(entry.fromLL) ? [Number(entry.fromLL[0]), Number(entry.fromLL[1])] : null,
    fromName: entry.fromName || null,
    toLL: [Number(entry.toLL[0]), Number(entry.toLL[1])],
    toName: entry.toName || "",
    mode: entry.mode || null,
    legs: Array.isArray(entry.legs) ? entry.legs.slice(0, 6).map(String) : [],
    started: !!entry.started,
    completed: !!entry.completed,
  };
}

// Old entries fall away on their own: a commute you stopped making three
// months ago should stop being remembered without you having to say so.
export function loadJourneys(now = Date.now()) {
  return loadStored(KEYS.journeys, [])
    .map(clean)
    .filter((j) => j && now - j.at < JOURNEY_TTL_MS)
    .sort((a, b) => b.at - a.at)
    .slice(0, MAX_JOURNEYS);
}

export function saveJourneys(list, now = Date.now()) {
  const kept = (list || [])
    .map(clean)
    .filter((j) => j && now - j.at < JOURNEY_TTL_MS)
    .sort((a, b) => b.at - a.at)
    .slice(0, MAX_JOURNEYS);
  store(KEYS.journeys, kept);
  return kept;
}

export function clearJourneys() {
  store(KEYS.journeys, []);
  return [];
}

// A journey begins when a route is actually started, not when a destination is
// browsed. `started: false` records the weaker signal — a destination chosen —
// which counts for less when a pattern is judged.
export function recordJourney(entry, now = Date.now()) {
  const next = clean({ ...entry, id: entry.id || `j${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`, at: entry.at || now });
  if (!next) return loadJourneys(now);
  return saveJourneys([next, ...loadJourneys(now)], now);
}

// Marks the most recent started journey to this destination as completed.
// Arriving is what separates a trip you took from a tap you abandoned.
export function completeJourney(toLL, now = Date.now()) {
  if (!isLL(toLL)) return loadJourneys(now);
  const list = loadJourneys(now);
  const idx = list.findIndex((j) => j.started && !j.completed && near(j.toLL, toLL, 0.004));
  if (idx < 0) return list;
  const next = list.slice();
  next[idx] = { ...next[idx], completed: true };
  return saveJourneys(next, now);
}

function near(a, b, tol) {
  return Math.abs(a[0] - b[0]) < tol && Math.abs(a[1] - b[1]) < tol;
}

// What the "what Solvik remembers" panel reports.
export function journeySummary(list) {
  const journeys = list || [];
  const started = journeys.filter((j) => j.started);
  return {
    total: journeys.length,
    started: started.length,
    completed: journeys.filter((j) => j.completed).length,
    oldest: journeys.length ? Math.min(...journeys.map((j) => j.at)) : null,
    newest: journeys.length ? Math.max(...journeys.map((j) => j.at)) : null,
    lines: [...new Set(started.flatMap((j) => j.legs))].sort(),
  };
}
