// Shared LTA DataMall fetch helper. DataMall has renamed some endpoints over
// time (the crowd-density paths in particular), so callers pass every known
// spelling and the first one that answers wins.
const BASE = "https://datamall2.mytransport.sg/ltaodataservice/";

export function ltaKey() {
  return process.env.LTA_ACCOUNT_KEY || null;
}

export async function ltaFetch(paths, params = {}) {
  const key = ltaKey();
  if (!key) throw new Error("LTA_ACCOUNT_KEY is not configured on the server.");

  const candidates = Array.isArray(paths) ? paths : [paths];
  let lastStatus = null;
  for (const path of candidates) {
    const url = new URL(BASE + path);
    for (const [k, v] of Object.entries(params)) {
      if (v != null) url.searchParams.set(k, v);
    }
    const res = await fetch(url.toString(), { headers: { AccountKey: key, accept: "application/json" } });
    if (res.ok) return res.json();
    lastStatus = res.status;
    // Only a missing path is worth retrying under another spelling.
    if (res.status !== 404) break;
  }
  throw new Error(`LTA DataMall request failed (${lastStatus})`);
}

// Paginated collections come back 500 rows at a time.
export async function ltaFetchAll(paths, params = {}, max = 10000) {
  const out = [];
  for (let skip = 0; skip < max; skip += 500) {
    const body = await ltaFetch(paths, { ...params, $skip: skip });
    const batch = body.value || [];
    out.push(...batch);
    if (batch.length < 500) break;
  }
  return out;
}

// DataMall crowd levels are l / m / h.
export function crowdLevelFrom(raw) {
  const v = String(raw || "").toLowerCase();
  if (v === "h" || v === "high") return "busy";
  if (v === "m" || v === "moderate") return "moderate";
  if (v === "l" || v === "low") return "light";
  return null;
}

// Bus occupancy: SEA seats available, SDA standing available, LSD limited standing.
export function busLoadLevel(load) {
  if (load === "SEA") return "light";
  if (load === "SDA") return "moderate";
  if (load === "LSD") return "busy";
  return null;
}

export const TRAIN_LINES = ["NSL", "EWL", "CGL", "CCL", "DTL", "NEL", "TEL", "BPL", "SLRT", "PLRT"];
