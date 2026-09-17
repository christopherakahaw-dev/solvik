// The same disruption, three different answers.
//
// The brief: "The same disruption means different things to Rachel, Arjun and
// Mdm Lim. Generic output serves nobody." These tests pin the differences, so
// that a change which quietly makes all three behave alike fails here.
import { test } from "node:test";
import assert from "node:assert/strict";
import { personaOf, personaList, modeFor, shouldInterrupt, reasonFor, PERSONAS, DEFAULT_PERSONA } from "../src/lib/persona.js";

test("all three commuters in the brief are represented", () => {
  assert.deepEqual(personaList().map((p) => p.id), ["fixed", "flexible", "stepFree"]);
  for (const p of personaList()) {
    assert.ok(p.name && p.blurb && p.example, `${p.id} needs to say who it is for`);
  }
});

test("an unknown or missing persona falls back rather than throwing", () => {
  assert.equal(personaOf(undefined).id, DEFAULT_PERSONA);
  assert.equal(personaOf("nonsense").id, DEFAULT_PERSONA);
});

test("rain changes the route for some people and not others", () => {
  // Rachel keeps her fast route in the rain; the other two do not.
  assert.equal(modeFor("fixed", { wet: true }), "fast");
  assert.equal(modeFor("flexible", { wet: true }), "walk");
  assert.equal(modeFor("stepFree", { wet: true }), "walk");
});

test("crowding moves everyone, but not to the same place", () => {
  assert.equal(modeFor("fixed", { busy: true }), "quiet");
  assert.equal(modeFor("flexible", { busy: true }), "quiet");
  assert.equal(modeFor("stepFree", { busy: true }), "step", "step-free access outranks a quieter carriage");
});

test("with nothing wrong, each persona gets its own default", () => {
  assert.equal(modeFor("fixed", {}), "fast");
  assert.equal(modeFor("flexible", {}), "quiet");
  assert.equal(modeFor("stepFree", {}), "step");
});

test("a six-minute delay is noise to one commuter and news to another", () => {
  // "A five-minute delay is noise; a fifteen-minute delay costs her a meeting."
  assert.equal(shouldInterrupt("fixed", { delayMins: 6 }), false);
  assert.equal(shouldInterrupt("fixed", { delayMins: 20 }), true);
  assert.equal(shouldInterrupt("flexible", { delayMins: 6 }), true);
});

test("a lift outage interrupts only the person it blocks", () => {
  assert.equal(shouldInterrupt("stepFree", { liftOutage: true }), true);
  assert.equal(shouldInterrupt("fixed", { liftOutage: true }), false);
  assert.equal(shouldInterrupt("flexible", { liftOutage: true }), false);
});

test("nothing happening interrupts nobody", () => {
  for (const p of personaList()) {
    assert.equal(shouldInterrupt(p.id, { delayMins: 0 }), false, `${p.id} must not fire on a quiet day`);
  }
});

test("the reason is written in the reader's own terms", () => {
  assert.match(reasonFor("stepFree", "lift"), /you travel step-free/i);
  assert.match(reasonFor("fixed", "lift"), /trains still run/i);
  assert.notEqual(reasonFor("stepFree", "lift"), reasonFor("fixed", "lift"));
  assert.notEqual(reasonFor("flexible", "rain"), reasonFor("fixed", "rain"));
});

test("only the step-free persona asks for large text", () => {
  assert.equal(PERSONAS.stepFree.largeText, true);
  assert.equal(PERSONAS.fixed.largeText, false);
});

test("a step-free commute blocks even when the person is not a step-free persona", () => {
  // The setting on the trip counts alongside the setting on the person. Reading
  // only the persona told a step-free commuter that the trains still run.
  assert.match(reasonFor("fixed", "lift", { blocking: true }), /you travel step-free/i);
  assert.match(reasonFor("stepFree", "lift", { blocking: false }), /trains still run/i);
  assert.match(reasonFor("fixed", "lift"), /trains still run/i, "no override keeps the persona's own answer");
});
