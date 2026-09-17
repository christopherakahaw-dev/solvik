// Planned works, as opposed to the faults TrainServiceAlerts carries.
//
// LTA's public feed for this is FacilitiesMaintenance, and it is narrower than
// the name suggests: adhoc *lift* maintenance in MRT stations, one row per lift,
// carrying the line, the station and a description of which lift is out. There
// is no public structured feed for station closures, early closures or
// engineering works — those are announced in prose, not JSON.
//
// So this is deliberately built around the event that data supports: a lift out
// at a station on your way. That is a planned event, it breaks a specific
// commute rather than the network, and for someone who needs step-free access it
// is the difference between a journey working and not. SOURCES is the seam: a
// real closures feed slots in beside this one without the client changing.
//
// Lives in src/lib rather than api/_lib because both sides read it, and the dev
// server's /api/ middleware treats every path under api/ as a serverless
// function — a browser import of api/_lib/* 404s in dev even though it bundles
// fine for production. Same direction as itinerary.js importing display.js.

export const FACILITIES_PATHS = ["v2/FacilitiesMaintenance", "FacilitiesMaintenance"];

const upper = (v) => String(v || "").trim().toUpperCase();

// One row per lift under maintenance. Rows without a station are dropped: a
// warning we cannot attach to a place on your route is not worth showing.
export function parseFacilities(payload) {
  const rows = (payload && (payload.value || payload.Value)) || [];
  const out = [];
  const seen = new Set();
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const stationCode = upper(row.StationCode);
    if (!stationCode) return;
    const liftId = String(row.LiftID || row.LiftId || "").trim();
    const key = `${stationCode}|${liftId}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({
      kind: "lift",
      line: upper(row.Line) || null,
      stationCode,
      stationName: String(row.StationName || "").trim() || null,
      liftId: liftId || null,
      liftDesc: String(row.LiftDesc || "").trim() || null,
    });
  });
  return out;
}

// Several lifts out at one station is one problem, not three.
export function byStation(items) {
  const map = new Map();
  (items || []).forEach((item) => {
    const group = map.get(item.stationCode) || {
      stationCode: item.stationCode,
      stationName: item.stationName,
      line: item.line,
      lifts: [],
    };
    group.stationName = group.stationName || item.stationName;
    group.line = group.line || item.line;
    group.lifts.push({ id: item.liftId, desc: item.liftDesc });
    map.set(item.stationCode, group);
  });
  return [...map.values()];
}

// The planned works that fall on a set of station codes — the stations a
// journey actually passes through, or the ones nearest somewhere you go.
export function worksAtStations(items, codes) {
  const wanted = new Set((codes || []).map(upper).filter(Boolean));
  if (!wanted.size) return [];
  return byStation(items).filter((group) => wanted.has(group.stationCode));
}

// "Lift out at Bishan · Exit B street level to concourse"
export function worksLabel(group) {
  if (!group) return "";
  const where = group.stationName || group.stationCode;
  const n = group.lifts.length;
  return n === 1 ? `Lift out at ${where}` : `${n} lifts out at ${where}`;
}

export function worksDetail(group) {
  if (!group) return "";
  const described = group.lifts.map((l) => l.desc).filter(Boolean);
  if (!described.length) return "LTA hasn't said which lift.";
  return described.slice(0, 2).join(" · ");
}

// --- Mitigation LTA has actually activated -----------------------------------
//
// TrainServiceAlerts carries FreePublicBus and FreeMRTShuttle inside each
// affected segment. The brief is blunt about what that means: "the mitigation is
// in the feed. You do not have to infer which buses might help." So this is
// quoted, never computed — which is why, unlike our own reroute, it carries no
// timetable caveat.

const STATION_LIST = /^[A-Z]{2}\d+(\s*,\s*[A-Z]{2}\d+)*$/i;

// The value is either a list of station codes or a sentence like "Free bus
// service island wide". Both are shown; only the first can be resolved to names.
export function mitigationOf(alert, nameFor = (code) => code) {
  if (!alert) return null;
  const asText = (raw) => {
    const value = String(raw || "").trim();
    if (!value) return null;
    // "Free bus service island wide" is a sentence, not a station list — read it
    // out as written rather than wrapping it in "at …".
    if (!STATION_LIST.test(value)) return { text: value, stations: [], sentence: true };
    const stations = value.split(",").map((c) => c.trim().toUpperCase()).filter(Boolean);
    return { text: stations.map(nameFor).join(", "), stations, sentence: false };
  };

  const bus = asText(alert.freeBus);
  const shuttle = asText(alert.freeShuttle);
  if (!bus && !shuttle) return null;

  const direction = String(alert.shuttleDirection || "").trim();
  return {
    line: alert.line || "",
    bus,
    shuttle,
    direction: direction && direction.toLowerCase() !== "both" ? direction : "",
    lines: [
      bus ? (bus.sentence ? bus.text : `Free bus boarding at ${bus.text}`) : null,
      shuttle
        ? (shuttle.sentence ? shuttle.text : `Free MRT shuttle at ${shuttle.text}`) +
          (direction && direction.toLowerCase() !== "both" ? ` ${direction}` : "")
        : null,
    ].filter(Boolean),
  };
}

// Across every current alert, the mitigations that touch a line this trip rides.
export function mitigationsFor(alerts, nameFor) {
  return (alerts || []).map((a) => mitigationOf(a, nameFor)).filter(Boolean);
}
