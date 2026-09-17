import { getSupabase } from "./supabase.js";

const PLACE_KEYS = ["home", "work", "school"];

function finiteCoordinate(value, latitude) {
  const number = Number(value);
  const limit = latitude ? 90 : 180;
  return Number.isFinite(number) && Math.abs(number) <= limit ? number : null;
}

export function cloudPlace(place, key) {
  if (!place || typeof place !== "object") return null;
  const name = String(place.name || place.label || "").trim();
  if (!name) return null;
  const lat = finiteCoordinate(place.ll?.[0], true);
  const lng = finiteCoordinate(place.ll?.[1], false);
  return {
    id: key,
    name,
    address: String(place.address || place.detail || name).trim(),
    postal: place.postal ? String(place.postal) : null,
    ll: lat == null || lng == null ? null : [lat, lng],
    source: place.source === "onemap" && lat != null && lng != null ? "onemap" : "legacy",
    verified: place.source === "onemap" && lat != null && lng != null && place.verified !== false,
    updatedAt: Number(place.updatedAt) || Date.now(),
  };
}

function cloudEndpoint(place) {
  if (!place || typeof place !== "object") return null;
  const lat = finiteCoordinate(place.ll?.[0], true);
  const lng = finiteCoordinate(place.ll?.[1], false);
  if (lat == null || lng == null) return null;
  return {
    id: String(place.id || ""),
    label: String(place.label || place.name || "Place").trim(),
    place: String(place.place || place.detail || place.address || place.label || "").trim(),
    ll: [lat, lng],
  };
}

export function cloudCommute(commute) {
  if (!commute || typeof commute !== "object" || commute.source === "auto") return null;
  const days = Array.isArray(commute.days)
    ? commute.days.filter((day) => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].includes(day))
    : [];
  const mins = Number(commute.mins);
  return {
    from: String(commute.from || ""),
    to: String(commute.to || ""),
    fromPlace: cloudEndpoint(commute.fromPlace),
    toPlace: cloudEndpoint(commute.toPlace),
    days,
    mins: Number.isFinite(mins) ? ((Math.round(mins) % 1440) + 1440) % 1440 : 0,
    mode: String(commute.mode || "Comfort"),
    arriveBy: Number.isFinite(Number(commute.arriveBy)) ? Number(commute.arriveBy) : null,
    source: "manual",
  };
}

export function snapshotForCloud(state) {
  const places = Object.fromEntries(
    PLACE_KEYS.map((key) => [key, cloudPlace(state.savedPlaces?.[key], key)])
  );
  return {
    places,
    preferences: {
      stepFree: Boolean(state.routingPreferences?.stepFree),
      lessWalking: Boolean(state.routingPreferences?.lessWalking),
      avoidCrowds: Boolean(state.routingPreferences?.avoidCrowds),
      studentFare: Boolean(state.routingPreferences?.studentFare),
      routineCommute: Boolean(state.routingPreferences?.routineCommute),
      showSavedPlaces: state.routingPreferences?.showSavedPlaces !== false,
    },
    commutes: (state.savedList || []).map(cloudCommute).filter(Boolean),
  };
}

export function snapshotHasPersonalData(snapshot) {
  return Boolean(
    snapshot &&
      (Object.values(snapshot.places || {}).some(Boolean) || (snapshot.commutes || []).length)
  );
}

export async function loadCloudSnapshot() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");

  const [placesResult, preferencesResult, commutesResult] = await Promise.all([
    supabase.from("saved_places").select("place_key, place, updated_at"),
    supabase.from("user_preferences").select("preferences, updated_at").maybeSingle(),
    supabase.from("saved_commutes").select("position, commute, updated_at").order("position"),
  ]);
  const error = placesResult.error || preferencesResult.error || commutesResult.error;
  if (error) throw error;

  const places = { home: null, work: null, school: null };
  for (const row of placesResult.data || []) {
    if (PLACE_KEYS.includes(row.place_key)) places[row.place_key] = cloudPlace(row.place, row.place_key);
  }
  const snapshot = {
    places,
    preferences: preferencesResult.data?.preferences || null,
    commutes: (commutesResult.data || []).map((row) => cloudCommute(row.commute)).filter(Boolean),
  };
  return {
    ...snapshot,
    hasPersonalData: snapshotHasPersonalData(snapshot),
    hasCloudData: Boolean(preferencesResult.data) || snapshotHasPersonalData(snapshot),
  };
}

export async function saveCloudSnapshot(snapshot) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");
  const clean = snapshotForCloud(snapshot);
  const { error } = await supabase.rpc("sync_user_data", {
    p_places: clean.places,
    p_preferences: clean.preferences,
    p_commutes: clean.commutes,
  });
  if (error) throw error;
  return clean;
}

export function applyCloudSnapshot(state, snapshot) {
  return {
    savedPlaces: {
      ...(state.savedPlaces || {}),
      ...(snapshot.places || {}),
    },
    routingPreferences: {
      ...(state.routingPreferences || {}),
      ...(snapshot.preferences || {}),
    },
    savedList: Array.isArray(snapshot.commutes) ? snapshot.commutes : state.savedList,
  };
}
