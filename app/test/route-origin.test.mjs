import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveRouteOrigin } from "../src/lib/routeOrigin.js";

test("an explicitly selected start takes priority over GPS and Home", () => {
  const origin = resolveRouteOrigin({
    selected: { name: "Bugis", address: "Bugis MRT", ll: [1.3009, 103.8559] },
    userLoc: [1.4, 103.8],
    home: { name: "Home", ll: [1.3, 103.7], verified: true },
  });
  assert.equal(origin.name, "Bugis");
  assert.deepEqual(origin.ll, [1.3009, 103.8559]);
  assert.equal(origin.kind, "selected");
});

test("GPS is used only when it has already been explicitly obtained", () => {
  assert.equal(resolveRouteOrigin({}), null);
  assert.equal(resolveRouteOrigin({ userLoc: [1.31, 103.82] }).kind, "location");
});

test("verified Home is a fallback when GPS is off", () => {
  const unverified = resolveRouteOrigin({ home: { name: "Yishun", ll: null, verified: false } });
  const verified = resolveRouteOrigin({ home: { name: "Home", ll: [1.42, 103.83], verified: true } });
  assert.equal(unverified, null);
  assert.equal(verified.kind, "home");
});
