// Weather, parsed from the shapes data.gov.sg publishes — the OpenAPI specs the
// hackathon shipped in PS2/references are what these fixtures are built from.
//
// The rule being defended: the 24-hour feed publishes multi-hour periods, so a
// warning may never be phrased more precisely than that.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  conditionOf, isWet, parseNowcast, parseOutlook, regionFor,
  forecastAt, nowcastAt, walkAdjustment, weatherLine, WET, SHOWERS, DRY,
} from "../src/lib/weather.js";
import { recordedNowcast, recordedOutlook } from "../api/_lib/recorded/index.js";

test("the forecast vocabulary sorts into what a commuter would do differently", () => {
  assert.equal(conditionOf("Heavy Thundery Showers"), WET);
  assert.equal(conditionOf("Moderate Rain"), SHOWERS);
  assert.equal(conditionOf("Light Rain"), SHOWERS);
  assert.equal(conditionOf("Fair (Day)"), DRY);
  assert.equal(conditionOf("Partly Cloudy"), DRY);
  assert.equal(conditionOf("Windy"), DRY, "wind is not rain");
  assert.equal(conditionOf(""), null, "nothing said is not the same as dry");
});

test("wet covers both rain grades, dry does not", () => {
  assert.ok(isWet(WET) && isWet(SHOWERS));
  assert.equal(isWet(DRY), false);
  assert.equal(isWet(null), false);
});

test("the nowcast keeps only areas it can place on a map", () => {
  const out = parseNowcast(recordedNowcast);
  assert.equal(out.areas.length, 3);
  assert.deepEqual(out.areas.map((a) => a.name), ["Yishun", "Bishan", "City"]);
  assert.equal(out.areas[0].condition, SHOWERS);
});

test("an unreadable weather payload is empty, not an exception", () => {
  assert.deepEqual(parseNowcast(null).areas, []);
  assert.deepEqual(parseOutlook(null).periods, []);
  assert.deepEqual(parseNowcast({ data: {} }).areas, []);
});

test("the nearest nowcast area to a point wins", () => {
  const out = parseNowcast(recordedNowcast);
  assert.equal(nowcastAt(out, [1.4294, 103.835]).name, "Yishun");
  assert.equal(nowcastAt(out, [1.2925, 103.8547]).name, "City");
  assert.equal(nowcastAt(out, null), null);
});

test("regions are picked by where you are", () => {
  assert.equal(regionFor([1.4294, 103.835]), "north");
  assert.equal(regionFor([1.2841, 103.8515]), "south");
  assert.equal(regionFor([1.35, 103.95]), "east");
  assert.equal(regionFor([1.35, 103.70]), "west");
  assert.equal(regionFor([1.35, 103.82]), "central");
});

test("the outlook is read at the time you would actually arrive", () => {
  const outlook = parseOutlook(recordedOutlook());
  assert.equal(outlook.periods.length, 4);
  const north = forecastAt({ outlook, ll: [1.4294, 103.835], at: Date.now() });
  assert.equal(north.condition, WET, "the recorded fixture puts heavy rain over the north");
  assert.equal(north.region, "north");
  const later = forecastAt({ outlook, ll: [1.4294, 103.835], at: Date.now() + 8 * 3600_000 });
  assert.equal(later.condition, DRY, "a later period is a different answer");
});

test("a time outside every published period returns nothing rather than guessing", () => {
  const outlook = parseOutlook(recordedOutlook());
  assert.equal(forecastAt({ outlook, ll: [1.43, 103.83], at: Date.now() + 40 * 3600_000 }), null);
  assert.equal(forecastAt({ outlook: null, ll: [1.43, 103.83], at: Date.now() }), null);
});

test("rain lengthens the walk, and by how much is a stated number", () => {
  const wet = walkAdjustment({ walkSecs: 720, condition: WET });
  assert.equal(wet.extraMins, 4);
  assert.ok(wet.wet);
  const dry = walkAdjustment({ walkSecs: 720, condition: DRY });
  assert.equal(dry.extraMins, 0);
  assert.equal(dry.factor, 1);
});

test("the warning is never phrased more precisely than the feed", () => {
  const line = weatherLine({
    forecast: { condition: SHOWERS, text: "Moderate Rain", label: "7.00 am to 9.00 am" },
    walkSecs: 720,
  });
  assert.match(line, /7\.00 am to 9\.00 am/, "the feed's own period, not a minute");
  assert.doesNotMatch(line, /\d{2}:\d{2}/, "no clock time we cannot support");
  assert.match(line, /2 min longer/);
});

test("fair weather says nothing at all", () => {
  // A card that fires on every dry day is noise, and trains people to ignore it.
  assert.equal(weatherLine({ forecast: { condition: DRY, text: "Fair" }, walkSecs: 720 }), "");
  assert.equal(weatherLine({ forecast: null, walkSecs: 720 }), "");
});
