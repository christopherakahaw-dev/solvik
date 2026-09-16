import { test } from "node:test";
import assert from "node:assert/strict";
import { alertId } from "../src/lib/storage.js";

test("alert ids remain stable when the feed timestamp changes", () => {
  const base = {
    line: "NSL",
    tag: "Delay",
    title: "NSL service affected",
    detail: "Between Yishun and Bishan.",
    time: "09:00",
  };
  assert.equal(alertId(base), alertId({ ...base, time: "09:30" }));
});
