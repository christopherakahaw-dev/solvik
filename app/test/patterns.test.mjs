// The memory system's judgement. These tests exist because the cost of being
// wrong is asymmetric: a missed pattern is invisible, but a wrongly promoted
// one creates a commute the user never made and sends leave-time alerts for it.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  groupJourneys, inferCommutes, isConfident, commuteFromPattern, evidenceLine, signatureOf, spread, median,
} from "../src/lib/patterns.js";

const day = (d, h, mi) => new Date(2026, 8, d, h, mi).getTime(); // Sep 2026
const YISHUN = [1.4294, 103.835];
const RAFFLES = [1.3009, 103.8559];
const NOW = day(11, 9, 0); // Friday

const trip = (d, h, mi, extra = {}) => ({
  at: day(d, h, mi), fromLL: YISHUN, toLL: RAFFLES, fromName: "Yishun", toName: "Raffles Place",
  mode: "Comfort", legs: ["NSL"], started: true, completed: true, ...extra,
});

// Mon–Thu mornings, one of them abandoned.
const weekMornings = [trip(7, 8, 5), trip(8, 8, 12), trip(9, 8, 2), trip(10, 8, 20, { completed: false })];

test("four consistent mornings become a commute", () => {
  const [pattern] = inferCommutes({ journeys: weekMornings, now: NOW });
  assert.ok(pattern, "should be confident enough to act on");
  assert.equal(pattern.count, 4);
  assert.equal(pattern.completed, 3);

  const commute = commuteFromPattern(pattern, NOW);
  assert.equal(commute.source, "auto");
  assert.deepEqual(commute.days, ["Mon", "Tue", "Wed", "Thu", "Fri"], "three weekdays or more is a daily routine");
  assert.equal(commute.mins, 490, "08:10 — the median, rounded to five minutes");
  // Endpoints travel with the commute, so it can be planned without depending
  // on a saved place that may never be created.
  assert.deepEqual(commute.fromPlace.ll, YISHUN);
  assert.deepEqual(commute.toPlace.ll, RAFFLES);
  assert.match(evidenceLine(commute, NOW), /Seen 4 times/);
});

test("the same trips scattered across the day do not", () => {
  const scattered = [trip(7, 6, 0), trip(8, 9, 0), trip(9, 12, 0), trip(10, 15, 0)];
  assert.equal(inferCommutes({ journeys: scattered, now: NOW }).length, 0);
  assert.ok(groupJourneys(scattered)[0].spreadMins > 45);
});

test("too few, or too few finished, do not", () => {
  assert.equal(inferCommutes({ journeys: weekMornings.slice(0, 3), now: NOW }).length, 0, "three is not a habit");
  const mostlyAbandoned = weekMornings.map((j, i) => ({ ...j, completed: i === 0 }));
  assert.equal(inferCommutes({ journeys: mostlyAbandoned, now: NOW }).length, 0, "tapping Go is not travelling");
});

test("a pattern nobody has repeated in three weeks goes quiet", () => {
  assert.equal(inferCommutes({ journeys: weekMornings, now: NOW + 40 * 24 * 60 * 60 * 1000 }).length, 0);
});

test("endpoints a few hundred metres apart are the same trip; a suburb away is not", () => {
  const nearby = [...weekMornings, trip(11, 8, 8, { fromLL: [1.4297, 103.8353] })];
  assert.equal(groupJourneys(nearby).length, 1, "300 m of GPS wander is the same doorway");

  const elsewhere = [...weekMornings, trip(11, 8, 8, { toLL: [1.35, 103.94] })];
  assert.equal(groupJourneys(elsewhere).length, 2);
});

test("weekday and weekend versions of the same route stay separate", () => {
  const mixed = [...weekMornings, trip(12, 10, 0), trip(13, 10, 5)]; // Sat, Sun
  const groups = groupJourneys(mixed);
  assert.equal(groups.length, 2);
  assert.deepEqual(groups.map((g) => g.dayClass).sort(), ["weekday", "weekend"]);
});

test("a pattern you undid never comes back", () => {
  const [pattern] = inferCommutes({ journeys: weekMornings, now: NOW });
  assert.equal(inferCommutes({ journeys: weekMornings, rejected: [pattern.signature], now: NOW }).length, 0);
  // And one already watched isn't offered twice.
  const existing = [commuteFromPattern(pattern, NOW)];
  assert.equal(inferCommutes({ journeys: weekMornings, existing, now: NOW }).length, 0);
});

test("the signature holds as new journeys join the group", () => {
  // This is what makes "never again" stick: tomorrow's trip, landing a couple
  // of hundred metres off, must not mint a new identity for the same pattern.
  const before = groupJourneys(weekMornings)[0];
  const after = groupJourneys([...weekMornings, trip(11, 8, 9, { fromLL: [1.4297, 103.8353] })])[0];
  assert.equal(signatureOf(after), signatureOf(before));
  assert.equal(after.count, 5);
});

test("timing uses the middle, not the extremes", () => {
  assert.equal(median([1, 2, 3, 100]), 3);
  // One late night out shouldn't disqualify a commute the way a range would.
  assert.ok(spread([480, 485, 490, 1300]) < 20);
});

test("a group short of the bar is reported as not confident, not as absent", () => {
  const group = groupJourneys(weekMornings.slice(0, 2))[0];
  assert.ok(group, "the group still exists");
  assert.equal(isConfident(group, NOW), false);
});
