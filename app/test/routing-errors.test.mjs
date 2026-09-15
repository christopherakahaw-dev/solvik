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
