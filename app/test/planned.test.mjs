// Planned works. LTA's public feed here is narrower than its name: adhoc lift
// maintenance, one row per lift. These tests pin what we can honestly say from
// that — which station, which lift — and make sure a row we can't place on a
// route is dropped rather than shown floating.
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseFacilities, byStation, worksAtStations, worksLabel, worksDetail } from "../src/lib/planned.js";
import { usesStation, withoutStations, withoutAny } from "../api/_lib/avoid.js";
import { recordedFacilities } from "../api/_lib/recorded/index.js";

const feed = (rows) => ({ value: rows });

test("a lift row keeps its station, line and description", () => {
  const [item] = parseFacilities(feed([
    { Line: "NEL", StationCode: "NE12", StationName: "Serangoon", LiftID: "B1L01", LiftDesc: "Exit B Street level - Concourse" },
  ]));
  assert.equal(item.kind, "lift");
  assert.equal(item.stationCode, "NE12");
  assert.equal(item.stationName, "Serangoon");
  assert.equal(item.liftDesc, "Exit B Street level - Concourse");
});

test("a row with no station is dropped", () => {
  // A warning we cannot attach to a place on your route is not worth showing.
  assert.equal(parseFacilities(feed([{ Line: "NEL", LiftID: "X1" }])).length, 0);
});

test("an empty or malformed feed is empty, not an exception", () => {
  assert.deepEqual(parseFacilities(null), []);
  assert.deepEqual(parseFacilities({}), []);
  assert.deepEqual(parseFacilities({ value: "nonsense" }), []);
});

test("the same lift listed twice is one lift", () => {
  const rows = [
    { StationCode: "NS17", LiftID: "B1L01", LiftDesc: "Exit B" },
    { StationCode: "NS17", LiftID: "B1L01", LiftDesc: "Exit B" },
  ];
  assert.equal(parseFacilities(feed(rows)).length, 1);
});

test("several lifts out at one station is one problem, not three", () => {
  const groups = byStation(parseFacilities(recordedFacilities));
  const bishan = groups.find((g) => g.stationCode === "NS17");
  assert.equal(groups.length, 2, "Bishan and Paya Lebar");
  assert.equal(bishan.lifts.length, 2);
  assert.equal(worksLabel(bishan), "2 lifts out at Bishan");
  assert.match(worksDetail(bishan), /Exit B street level to concourse/);
});

test("a station with no description says so rather than inventing one", () => {
  const [group] = byStation(parseFacilities(feed([{ StationCode: "EW14", StationName: "Raffles Place", LiftID: "A1" }])));
  assert.equal(worksLabel(group), "Lift out at Raffles Place");
  assert.equal(worksDetail(group), "LTA hasn't said which lift.");
});

test("works are matched to the stations a journey passes through", () => {
  const items = parseFacilities(recordedFacilities);
  assert.deepEqual(worksAtStations(items, ["NS17", "NS13"]).map((g) => g.stationCode), ["NS17"]);
  assert.deepEqual(worksAtStations(items, ["ns17"]).map((g) => g.stationCode), ["NS17"], "case does not matter");
  assert.deepEqual(worksAtStations(items, []), [], "no stations, no works");
  assert.deepEqual(worksAtStations(items, ["EW24"]), [], "a station you don't pass is not your problem");
});

// --- Routing around a station rather than a whole line ---

const option = (codes) => ({
  transitLegs: [{ fromStopCode: codes[0], toStopCode: codes[codes.length - 1], label: "NSL" }],
  steps: [{ boardStopCode: codes[0], alightStopCode: codes[codes.length - 1], stopCodes: codes.slice(1, -1) }],
});

test("only the stations you board, alight or change at count", () => {
  const opt = option(["NS13", "NS15", "NS17", "NS19"]);
  assert.equal(usesStation(opt, "NS13"), true, "boarding");
  assert.equal(usesStation(opt, "NS19"), true, "alighting");
  // A lift out at a station the train runs through is not your problem, and
  // refusing that train would throw away a perfectly good route.
  assert.equal(usesStation(opt, "NS15"), false, "ridden through, never entered");
  assert.equal(usesStation(opt, "EW24"), false);
});

test("avoiding a station keeps the routes that go round it", () => {
  const through = option(["NS13", "NS17"]);
  const around = option(["NS13", "CC15"]);
  const out = withoutStations([through, around], "NS17");
  assert.equal(out.kept.length, 1);
  assert.deepEqual(out.kept, [around]);
  assert.deepEqual(out.stations, ["NS17"]);
});

test("a lift being out is no reason to write off the whole line", () => {
  // The distinction this feature rests on: avoid the station, keep the line.
  const viaBishan = option(["NS13", "NS17"]);
  const sameLineElsewhere = option(["NS1", "NS5"]);
  const out = withoutStations([viaBishan, sameLineElsewhere], "NS17");
  assert.equal(out.kept.length, 1);
  assert.equal(out.kept[0].transitLegs[0].label, "NSL", "still an NSL route");
});

test("lines and stations can be avoided in the same request", () => {
  const nsl = { ...option(["NS13", "NS19"]), transitLegs: [{ label: "NSL", fromStopCode: "NS13", toStopCode: "NS19" }] };
  const ccl = { ...option(["CC1", "CC9"]), transitLegs: [{ label: "CCL", fromStopCode: "CC1", toStopCode: "CC9" }] };
  const other = { ...option(["DT1", "DT5"]), transitLegs: [{ label: "DTL", fromStopCode: "DT1", toStopCode: "DT5" }] };
  const out = withoutAny([nsl, ccl, other], { lines: "NSL", stations: "CC9" });
  assert.deepEqual(out.kept, [other]);
  assert.deepEqual(out.lines, ["NSL"]);
  assert.deepEqual(out.stations, ["CC9"]);
  assert.deepEqual(out.all, ["NSL", "CC9"]);
  assert.equal(out.dropped, 2);
});

test("avoiding nothing filters nothing", () => {
  const opts = [option(["NS13", "NS17"])];
  assert.equal(withoutAny(opts, {}).kept.length, 1);
  assert.deepEqual(withoutAny(opts, {}).all, []);
});
