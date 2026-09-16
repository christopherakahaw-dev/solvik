// Everything the app remembers between visits lives behind these two helpers.
// Storage can be unavailable (private mode, blocked site data), so a failure to
// read or write is never allowed to take the session down with it.

export const KEYS = {
  onboarded: "solvik:onboarded",
  places: "solvik:places",
  commutes: "solvik:commutes",
  searches: "solvik:searches",
  alertsRead: "solvik:alertsRead",
};

export function loadStored(key, fallback) {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function store(key, value) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Out of quota or storage denied; the session still works.
  }
}

const MAX_SEARCHES = 8;

// Destinations the user actually travelled to, newest first. Matching on name
// and coordinate keeps the same place from filling the list.
export function rememberSearch(dest, now = Date.now()) {
  if (!dest || !dest.name || !dest.ll) return loadStored(KEYS.searches, []);
  const entry = { name: dest.name, detail: dest.detail || "", ll: dest.ll, kind: dest.kind || null, at: now };
  const same = (a, b) =>
    a.name === b.name && Math.abs((a.ll[0] || 0) - (b.ll[0] || 0)) < 1e-6 && Math.abs((a.ll[1] || 0) - (b.ll[1] || 0)) < 1e-6;
  const list = [entry, ...loadStored(KEYS.searches, []).filter((p) => p && p.ll && !same(p, entry))].slice(0, MAX_SEARCHES);
  store(KEYS.searches, list);
  return list;
}

export function recentSearches() {
  return loadStored(KEYS.searches, []).filter((p) => p && p.name && Array.isArray(p.ll));
}

export function clearSearches() {
  store(KEYS.searches, []);
  return [];
}

const READ_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Read alerts are kept by content id rather than list position: LTA's feed
// reorders, and an alert that briefly disappears shouldn't come back unread.
export function loadReadAlerts(now = Date.now()) {
  const raw = loadStored(KEYS.alertsRead, {});
  const out = {};
  Object.keys(raw || {}).forEach((id) => {
    const at = Number(raw[id]);
    if (isFinite(at) && now - at < READ_TTL_MS) out[id] = at;
  });
  return out;
}

export function markAlertsRead(ids, current, now = Date.now()) {
  const next = { ...(current || {}) };
  (Array.isArray(ids) ? ids : [ids]).filter(Boolean).forEach((id) => {
    next[id] = now;
  });
  store(KEYS.alertsRead, next);
  return next;
}

// A stable id for an alert, derived from what it says. Same wording, same id.
export function alertId(item) {
  const text = [item.line, item.tag, item.title, item.detail].filter(Boolean).join("|");
  let hash = 5381;
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) + hash + text.charCodeAt(i)) >>> 0;
  return `a${hash.toString(36)}`;
}
