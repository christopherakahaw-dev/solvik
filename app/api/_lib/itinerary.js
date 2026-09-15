// Turns OneMap's OTP-shaped routing response into the option cards and
// turn-by-turn steps the UI renders. Kept separate from the endpoint so the
// mapping can be tested against recorded fixtures without any network.
import { decodePolyline } from "./polyline.js";

const CROWD_SCORE = { light: 0, moderate: 1, busy: 2 };

export function legLabel(leg) {
  const mode = String(leg.mode || "").toUpperCase();
  const route = String(leg.routeShortName || leg.route || "").trim();
  if (mode === "BUS") return route ? `BUS ${route}` : "BUS";
  if (mode === "WALK") return "WALK";
  if (!route) return mode;
  // NS -> NSL, so the label matches the line badges the design uses.
  return /^[A-Z]{2}$/.test(route) ? `${route}L` : route;
}

export function clockFrom(ms) {
  if (!ms) return "";
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function fareOf(itin) {
  const raw = itin.fare ?? (itin.fareProducts && itin.fareProducts[0] && itin.fareProducts[0].amount);
  const n = Number(raw);
  return isFinite(n) ? n : null;
}

export function geometryOf(itin) {
  const coords = [];
  (itin.legs || []).forEach((leg) => {
    if (leg.legGeometry && leg.legGeometry.points) coords.push(...decodePolyline(leg.legGeometry.points));
  });
  return coords;
}

// Steps for the turn-by-turn pager: walk / board / transfer / arrive, with the
// real stop sequence between board and alight.
export function stepsOf(itin, destName) {
  const legs = itin.legs || [];
  const steps = [];
  legs.forEach((leg, i) => {
    const mode = String(leg.mode || "").toUpperCase();
    const secs = Math.max(30, Math.round((leg.duration || 0) || ((leg.endTime - leg.startTime) / 1000) || 0));
    const toName = (leg.to && leg.to.name) || "";
    const fromName = (leg.from && leg.from.name) || "";

    if (mode === "WALK") {
      const last = i === legs.length - 1;
      const metres = Math.round(leg.distance || 0);
      steps.push({
        icon: last ? "flag" : "footprints",
        title: last ? `Walk to ${destName || toName}` : `Walk to ${toName}`,
        detail: metres ? `${metres} m on foot` : "Walk",
        secs,
      });
      return;
    }

    const stops = (leg.intermediateStops || []).map((st) => st.name).filter(Boolean);
    const alight = toName || stops[stops.length - 1] || "";
    const label = legLabel(leg);
    const headsign = leg.headsign || leg.tripHeadsign || alight;
    steps.push({
      icon: mode === "BUS" ? "bus" : "train-front",
      title: `Board ${label}${headsign ? ` toward ${headsign}` : ""}`,
      detail: `${stops.length + 1} stop${stops.length === 0 ? "" : "s"} · alight at ${alight}`,
      stops: stops.concat(alight ? [alight] : []),
      alight,
      boardStopCode: (leg.from && (leg.from.stopCode || leg.from.stopId)) || null,
      service: mode === "BUS" ? String(leg.routeShortName || leg.route || "") : null,
      from: fromName,
      secs,
    });
  });
  return steps;
}

export function normalizeItinerary(itin, destName) {
  const legs = (itin.legs || []).filter((l) => String(l.mode).toUpperCase() !== "WALK");
  const fare = fareOf(itin);
  const durationSecs = itin.duration || Math.round(((itin.endTime || 0) - (itin.startTime || 0)) / 1000);
  return {
    mins: Math.max(1, Math.round(durationSecs / 60)),
    eta: clockFrom(itin.endTime),
    fare: fare == null ? null : `$${fare.toFixed(2)}`,
    fareValue: fare,
    walk: `${Math.round((itin.walkTime || 0) / 60)} min`,
    walkSecs: itin.walkTime || 0,
    walkDistance: itin.walkDistance || 0,
    transfers: itin.transfers != null ? itin.transfers : Math.max(0, legs.length - 1),
    legs: legs.map(legLabel),
    transitLegs: legs.map((leg) => ({
      label: legLabel(leg),
      mode: String(leg.mode || "").toUpperCase(),
      service: String(leg.routeShortName || leg.route || ""),
      fromName: (leg.from && leg.from.name) || "",
      fromStopCode: (leg.from && (leg.from.stopCode || leg.from.stopId)) || null,
    })),
    geometry: geometryOf(itin),
    steps: stepsOf(itin, destName),
    startTime: itin.startTime || null,
    endTime: itin.endTime || null,
  };
}

export function crowdScoreOf(option) {
  const levels = option.transitLegs.map((l) => l.crowdLevel).filter(Boolean);
  if (!levels.length) return null;
  return levels.reduce((a, l) => a + CROWD_SCORE[l], 0) / levels.length;
}

export function crowdLevelOf(option) {
  const score = crowdScoreOf(option);
  if (score == null) return null;
  return score >= 1.5 ? "busy" : score >= 0.5 ? "moderate" : "light";
}

// A signature for de-duplicating itineraries that differ only by seconds.
export function signature(option) {
  return `${option.legs.join(">")}|${option.mins}`;
}
