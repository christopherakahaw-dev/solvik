import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { snapshotForCloud } from "../src/lib/cloudData.js";

test("cloud snapshots contain only explicit saved data", () => {
  const snapshot = snapshotForCloud({
    savedPlaces: {
      home: {
        id: "home",
        name: "Home",
        address: "1 Example Road",
        postal: "123456",
        ll: [1.3, 103.8],
        source: "onemap",
        verified: true,
        rawSearchText: "private query",
      },
    },
    routingPreferences: { stepFree: true, showSavedPlaces: true },
    savedList: [
      { from: "home", to: "work", days: ["Mon"], mins: 480, mode: "Comfort", source: "manual" },
      { from: "home", to: "school", days: ["Tue"], mins: 500, mode: "Fastest", source: "auto" },
    ],
    userLoc: [1.31, 103.81],
    recents: [{ name: "Secret search" }],
    journeys: [{ started: true, points: [[1.3, 103.8]] }],
  });

  assert.equal(snapshot.places.home.rawSearchText, undefined);
  assert.equal(snapshot.commutes.length, 1);
  assert.equal(snapshot.commutes[0].source, "manual");
  assert.equal(snapshot.userLoc, undefined);
  assert.equal(snapshot.recents, undefined);
  assert.equal(snapshot.journeys, undefined);
});

test("invalid coordinates are not uploaded", () => {
  const snapshot = snapshotForCloud({
    savedPlaces: { home: { name: "Home", ll: [200, 500], source: "onemap", verified: true } },
    routingPreferences: {},
    savedList: [],
  });
  assert.equal(snapshot.places.home.ll, null);
  assert.equal(snapshot.places.home.verified, false);
});

test("the Supabase migration protects every private table with RLS", async () => {
  const sql = await readFile(new URL("../supabase/migrations/20260917000000_user_data.sql", import.meta.url), "utf8");
  for (const table of ["profiles", "user_preferences", "saved_places", "saved_commutes"]) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
  }
  assert.match(sql, /auth\.uid\(\)/i);
  assert.match(sql, /revoke all[\s\S]+from anon, authenticated/i);
  assert.doesNotMatch(sql, /service_role/i);
});

