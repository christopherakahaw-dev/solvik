// The failures that used to collapse into "No public transport route found"
// each have to produce a distinct, visible outcome. OneMap is unreachable from
// CI here, so fetch is stubbed with the shapes it really returns.
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { normalizeItinerary } from "../api/_lib/itinerary.js";
import { otpError, oneMapRoute } from "../api/_lib/onemap.js";

const realFetch = globalThis.fetch;

beforeEach(() => {
  process.env.ONEMAP_TOKEN = "test-token";
});
afterEach(() => {
  globalThis.fetch = realFetch;
  delete process.env.ONEMAP_TOKEN;
});

const ptArgs = { start: "1.0,103.0", end: "1.1,103.1", date: "09-15-2026", time: "08:00:00" };

test("a walk-only itinerary is a walking option, not a dropped result", () => {
  const opt = normalizeItinerary(
    {
      duration: 600,
      startTime: 1789430400000,
      endTime: 1789431000000,
      walkTime: 600,
      walkDistance: 780,
      legs: [{ mode: "WALK", duration: 600, distance: 780, from: { name: "A" }, to: { name: "B" } }],
    },
    "Somewhere close"
  );
  assert.ok(opt, "should not be null");
  assert.equal(opt.walkOnly, true);
  assert.deepEqual(opt.legs, ["WALK 0.8 km"]);
  assert.equal(opt.fare, "$0.00");
  assert.equal(opt.steps[0].title, "Walk to Somewhere close");
});

test("an itinerary with no legs at all is still rejected", () => {
  assert.equal(normalizeItinerary({ legs: [] }, "x"), null);
});

test("OneMap's 200-with-error payload is detected", () => {
  const err = otpError({ error: { id: 404, msg: "Trip is not possible." } });
  assert.equal(err.id, 404);
  assert.match(err.msg, /not possible/);
  assert.equal(otpError({ plan: { itineraries: [] } }), null);
});

test("a 200-with-error surfaces as a thrown error, not an empty plan", async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ error: { id: 404, msg: "Trip is not possible." } }), { status: 200, headers: { "content-type": "application/json" } });
  await assert.rejects(() => oneMapRoute(ptArgs), (err) => {
    assert.match(err.message, /not possible/);
    assert.equal(err.otpErrorId, 404);
    return true;
  });
});

test("a non-JSON error body reports its HTTP status instead of a parser crash", async () => {
  globalThis.fetch = async () => new Response("<html><body>502 Bad Gateway</body></html>", { status: 502, headers: { "content-type": "text/html" } });
  await assert.rejects(() => oneMapRoute(ptArgs), (err) => {
    assert.match(err.message, /OneMap routing failed \(502\)/);
    assert.equal(err.status, 502);
    return true;
  });
});

test("a rejected token is retried as Bearer before giving up", async () => {
  const seen = [];
  globalThis.fetch = async (_url, init) => {
    seen.push(init.headers.Authorization);
    if (seen.length === 1) return new Response("", { status: 401 });
    return new Response(JSON.stringify({ plan: { itineraries: [] } }), { status: 200, headers: { "content-type": "application/json" } });
  };
  const data = await oneMapRoute(ptArgs);
  assert.deepEqual(data.plan.itineraries, []);
  assert.equal(seen[0], "test-token");
  assert.equal(seen[1], "Bearer test-token");
});

// --- request-shape probing -------------------------------------------------
// OneMap answers an unparsed `mode` or `date` with HTTP 200 and a walking-only
// plan, which is indistinguishable from "no transit exists" unless the other
// spellings are tried.
import { buildRouteUrl, hasTransit, parseDateInput, REQUEST_VARIANTS } from "../api/_lib/onemap.js";

const transitPlan = { plan: { itineraries: [{ duration: 1800, legs: [{ mode: "WALK" }, { mode: "SUBWAY", routeShortName: "NS" }] }] } };
const walkPlan = { plan: { itineraries: [{ duration: 6420, legs: [{ mode: "WALK", distance: 9000 }] }] } };

test("a walking-only plan is not treated as a transit answer", () => {
  assert.equal(hasTransit(transitPlan), true);
  assert.equal(hasTransit(walkPlan), false);
  assert.equal(hasTransit({}), false);
});

test("both date spellings are understood and re-emitted per variant", () => {
  assert.deepEqual(parseDateInput("09-15-2026"), { y: 2026, m: 9, d: 15 });
  assert.deepEqual(parseDateInput("2026-09-15"), { y: 2026, m: 9, d: 15 });
  assert.equal(parseDateInput("nonsense"), null);

  const args = { start: "1,103", end: "1.1,103.1", date: "09-15-2026", time: "08:00:00", mode: "transit" };
  const upper = buildRouteUrl({ ...args, variant: REQUEST_VARIANTS[0] });
  assert.equal(upper.searchParams.get("mode"), "TRANSIT");
  assert.equal(upper.searchParams.get("date"), "09-15-2026");

  const isoLower = buildRouteUrl({ ...args, variant: { modeCase: "lower", dateFormat: "YYYY-MM-DD" } });
  assert.equal(isoLower.searchParams.get("mode"), "transit");
  assert.equal(isoLower.searchParams.get("date"), "2026-09-15");
});

test("a walking-only reply makes it try the other spellings, and it keeps the one with transit", async () => {
  const tried = [];
  globalThis.fetch = async (url) => {
    const u = new URL(url);
    tried.push(`${u.searchParams.get("mode")}|${u.searchParams.get("date")}`);
    // Only uppercase TRANSIT yields transit here.
    const payload = u.searchParams.get("mode") === "TRANSIT" ? transitPlan : walkPlan;
    return new Response(JSON.stringify(payload), { status: 200, headers: { "content-type": "application/json" } });
  };
  const data = await oneMapRoute({ start: "1,103", end: "1.1,103.1", date: "09-15-2026", time: "08:00:00" });
  assert.equal(hasTransit(data), true, "should return the transit-bearing plan");
  assert.equal(tried[0], "TRANSIT|09-15-2026", "tries the documented spelling first");
});

test("when every spelling returns walking only, the walk plan is still returned", async () => {
  globalThis.fetch = async () => new Response(JSON.stringify(walkPlan), { status: 200, headers: { "content-type": "application/json" } });
  const data = await oneMapRoute({ start: "1,103", end: "1.0001,103.0001", date: "09-15-2026", time: "08:00:00" });
  assert.equal(hasTransit(data), false);
  assert.equal(data.plan.itineraries.length, 1, "a genuinely short trip still gets its walking option");
});
