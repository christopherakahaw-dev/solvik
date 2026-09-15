// Real journey options for the map sheet. Asks OneMap for itineraries with
// parameters suited to the chosen mode, enriches them with live LTA crowding
// and accessibility, ranks them by what the mode actually promises, and
// returns at most three cards in the shape the UI already renders.
import { oneMapRoute } from "./_lib/onemap.js";
import { ltaFetch, busLoadLevel, crowdLevelFrom } from "./_lib/lta.js";
import { normalizeItinerary, crowdLevelOf, crowdScoreOf, signature, clockFrom } from "./_lib/itinerary.js";
import { decodePolyline } from "./_lib/polyline.js";

const MODES = {
  fast: { query: [{ mode: "transit", maxWalkDistance: 1000 }], rank: (a, b) => a.mins - b.mins, tag: "Fastest" },
  budget: { query: [{ mode: "transit", maxWalkDistance: 1000 }, { mode: "bus", maxWalkDistance: 1200 }], rank: (a, b) => (a.fareValue ?? 99) - (b.fareValue ?? 99) || a.mins - b.mins, tag: "Cheapest" },
  quiet: { query: [{ mode: "transit", maxWalkDistance: 1000 }], rank: (a, b) => (crowdScoreOf(a) ?? 9) - (crowdScoreOf(b) ?? 9) || a.mins - b.mins, tag: "Quietest" },
  step: { query: [{ mode: "transit", maxWalkDistance: 800 }], rank: (a, b) => (b.accessibleScore ?? 0) - (a.accessibleScore ?? 0) || a.mins - b.mins, tag: "Step-free" },
  few: { query: [{ mode: "transit", maxWalkDistance: 1200 }], rank: (a, b) => a.transfers - b.transfers || a.mins - b.mins, tag: "Fewest changes" },
  walk: { query: [{ mode: "transit", maxWalkDistance: 500 }], rank: (a, b) => a.walkSecs - b.walkSecs || a.mins - b.mins, tag: "Least walking" },
  bike: { cycle: true, tag: "Bike" },
};

const REALTIME = ["PCDRealTime", "PlatformCrowdDensityRealTime"];

// Crowd level per rail station code, cached briefly across requests.
let railCrowd = null; // { at, byCode }
async function railCrowdByCode(lines = ["NSL", "EWL", "CCL", "DTL", "NEL", "TEL"]) {
  if (railCrowd && Date.now() - railCrowd.at < 60_000) return railCrowd.byCode;
  const byCode = new Map();
  const settled = await Promise.allSettled(lines.map((line) => ltaFetch(REALTIME, { TrainLine: line })));
  settled.forEach((r) => {
    if (r.status !== "fulfilled") return;
    (r.value.value || []).forEach((row) => {
      const level = crowdLevelFrom(row.CrowdLevel);
      if (row.Station && level) byCode.set(String(row.Station).toUpperCase(), level);
    });
  });
  if (!byCode.size) return null;
  railCrowd = { at: Date.now(), byCode };
  return byCode;
}

async function busInfo(stopCode, service) {
  if (!stopCode || !service) return null;
  try {
    const data = await ltaFetch(["v3/BusArrival", "BusArrivalv2"], { BusStopCode: stopCode, ServiceNo: service });
    const svc = (data.Services || [])[0];
    const next = svc && svc.NextBus;
    if (!next) return null;
    return {
      crowdLevel: busLoadLevel(next.Load),
      accessible: next.Feature === "WAB",
      etaMins: next.EstimatedArrival ? Math.max(0, Math.round((new Date(next.EstimatedArrival) - Date.now()) / 60000)) : null,
    };
  } catch {
    return null;
  }
}

async function enrich(options) {
  const byCode = await railCrowdByCode().catch(() => null);

  await Promise.all(
    options.map(async (opt) => {
      await Promise.all(
        opt.transitLegs.map(async (leg) => {
          if (leg.mode === "BUS") {
            const info = await busInfo(leg.fromStopCode, leg.service);
            if (info) {
              leg.crowdLevel = info.crowdLevel;
              leg.accessible = info.accessible;
              leg.etaMins = info.etaMins;
            }
            return;
          }
          if (byCode && leg.fromStopCode) {
            const level = byCode.get(String(leg.fromStopCode).toUpperCase());
            if (level) leg.crowdLevel = level;
          }
        })
      );
      opt.crowdLevel = crowdLevelOf(opt);
      // Rail is step-free by default in Singapore; buses only when flagged WAB.
      const busLegs = opt.transitLegs.filter((l) => l.mode === "BUS");
      const accessibleBuses = busLegs.filter((l) => l.accessible).length;
      opt.accessibleScore = busLegs.length ? accessibleBuses / busLegs.length : 1;
    })
  );
  return options;
}

function noteFor(opt) {
  const bits = [];
  bits.push(opt.transfers === 0 ? "No transfers" : `${opt.transfers} transfer${opt.transfers === 1 ? "" : "s"}`);
  if (opt.walkSecs) bits.push(`${Math.round(opt.walkSecs / 60)} min on foot`);
  const nextBus = opt.transitLegs.find((l) => l.mode === "BUS" && l.etaMins != null);
  if (nextBus) bits.push(`next ${nextBus.service} in ${nextBus.etaMins} min`);
  return bits.join(" · ");
}

function tagsFor(options, modeTag) {
  const cheapest = options.reduce((a, b) => ((a.fareValue ?? 99) <= (b.fareValue ?? 99) ? a : b), options[0]);
  const fastest = options.reduce((a, b) => (a.mins <= b.mins ? a : b), options[0]);
  return options.map((opt, i) => {
    let tag = i === 0 ? modeTag : opt === fastest ? "Fastest" : opt === cheapest ? "Cheapest" : opt.transfers === 0 ? "Direct" : "Alternative";
    return { ...opt, tag, tagTone: i === 0 ? "soft" : i === 1 ? "outline" : "neutral" };
  });
}

async function cycleOption(start, end) {
  const data = await oneMapRoute({ start, end, routeType: "cycle" });
  const summary = data.route_summary || {};
  const secs = summary.total_time || 0;
  const metres = summary.total_distance || 0;
  if (!secs) return [];
  return [
    {
      mins: Math.max(1, Math.round(secs / 60)),
      eta: clockFrom(Date.now() + secs * 1000),
      fare: "$0.00",
      fareValue: 0,
      walk: "0 min",
      walkSecs: 0,
      transfers: 0,
      legs: [`CYCLE ${(metres / 1000).toFixed(1)} km`],
      transitLegs: [],
      crowdLevel: null,
      geometry: data.route_geometry ? decodePolyline(data.route_geometry) : [],
      steps: [{ icon: "bike", title: "Cycle to your destination", detail: `${(metres / 1000).toFixed(1)} km on the cycling network`, secs }],
      note: `${(metres / 1000).toFixed(1)} km ride · no fare`,
      tag: "Bike",
      tagTone: "soft",
    },
  ];
}

export default async function handler(req, res) {
  const q = req.query ?? Object.fromEntries(new URL(req.url, "http://localhost").searchParams);
  const { from, to, mode = "fast", destName = "", date, time } = q;
  if (!from || !to) {
    res.status(400).json({ error: "Missing from or to (lat,lng)" });
    return;
  }
  const spec = MODES[mode] || MODES.fast;

  try {
    if (spec.cycle) {
      res.status(200).json({ mode, options: await cycleOption(from, to) });
      return;
    }

    const settled = await Promise.allSettled(
      spec.query.map((params) => oneMapRoute({ start: from, end: to, routeType: "pt", date, time, numItineraries: 3, ...params }))
    );
    const responses = settled.filter((r) => r.status === "fulfilled").map((r) => r.value);
    // Only surface a failure if nothing succeeded — one mode of a two-query
    // search (transit + bus) coming back empty is not itself an error.
    if (!responses.length) {
      const rejection = settled.find((r) => r.status === "rejected");
      if (rejection) throw rejection.reason;
    }
    const itineraries = responses.flatMap((data) => (data.plan && data.plan.itineraries) || []);
    if (!itineraries.length) {
      res.status(200).json({ mode, options: [] });
      return;
    }

    const seen = new Set();
    const normalized = itineraries
      .map((itin) => normalizeItinerary(itin, destName))
      .filter(Boolean)
      .filter((opt) => {
        const sig = signature(opt);
        if (seen.has(sig)) return false;
        seen.add(sig);
        return true;
      });

    await enrich(normalized);
    const ranked = normalized.sort(spec.rank).slice(0, 3).map((opt) => ({ ...opt, note: noteFor(opt) }));

    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
    res.status(200).json({ mode, options: tagsFor(ranked, spec.tag) });
  } catch (err) {
    const msg = String(err && err.message ? err.message : err);
    // OneMap says "no trip possible" with its own error id 404 and HTTP 200;
    // that genuinely means no route. Anything else is a fault worth showing.
    if (err && err.otpErrorId === 404) {
      res.status(200).json({ mode, options: [] });
      return;
    }
    res.status(msg.includes("not configured") || msg.includes("credentials") ? 501 : 502).json({ error: msg });
  }
}
