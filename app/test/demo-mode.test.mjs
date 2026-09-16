// Demo mode exists so a dead venue network can't kill a five-minute slot. The
// property that keeps it honest is tested here: it is off unless switched on,
// and anything it serves is marked as recorded.
import { test } from "node:test";
import assert from "node:assert/strict";
import { demoMode, serveRecorded } from "../api/_lib/demo.js";
import { recordedForecast, recordedRoute, recordedStations } from "../api/_lib/recorded/index.js";
import { normalizeItinerary } from "../api/_lib/itinerary.js";

function fakeRes() {
  const res = { statusCode: null, body: null, headers: {} };
  res.setHeader = (k, v) => { res.headers[k] = v; };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res.body = body; return res; };
  return res;
}

test("it is off unless explicitly switched on", () => {
  delete process.env.DEMO_MODE;
  assert.equal(demoMode(), false);
  const res = fakeRes();
  assert.equal(serveRecorded(res, { options: [] }), false, "and refuses to answer");
  assert.equal(res.body, null);

  process.env.DEMO_MODE = "0";
  assert.equal(demoMode(), false);
  process.env.DEMO_MODE = "1";
  assert.equal(demoMode(), true);
  delete process.env.DEMO_MODE;
});

test("anything it serves is marked recorded, so the UI can say so", () => {
  process.env.DEMO_MODE = "1";
  const res = fakeRes();
  assert.equal(serveRecorded(res, { options: [1, 2] }), true);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.recorded, true);
  assert.deepEqual(res.body.options, [1, 2]);
  assert.equal(res.headers["Cache-Control"], "no-store");
  delete process.env.DEMO_MODE;
});

test("the recorded route is a real recording, and maps like a live one", () => {
  const options = (recordedRoute.plan.itineraries || []).map((i) => normalizeItinerary(i, "Bishan Park")).filter(Boolean);
  assert.ok(options.length >= 1);
  assert.ok(options[0].steps.length >= 2, "it has a real step sequence");
  assert.ok(options[0].legs.length >= 1);
});

test("the recorded forecast is anchored to the day it is asked for", () => {
  const morning = recordedForecast(new Date("2026-09-16T09:00:00+08:00"));
  assert.equal(morning.slots.length, 8);
  const first = new Date(morning.slots[0]);
  assert.equal(first.getHours(), 6);
  assert.equal(first.getMinutes(), 30);
  // Busy somewhere in the peak, so the demo has something to show.
  assert.ok(Object.values(morning.series.NS26).includes("busy"));
  assert.ok(recordedStations.every((st) => st.code && Number.isFinite(st.lat)));
});
