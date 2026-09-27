import test from "node:test";
import assert from "node:assert/strict";
import { detectDomain, orchestrate } from "../src/core/orchestrator.js";
import { contentIntakePlan } from "../src/core/content-intake.js";

test("routes learning requests", () => {
  assert.equal(detectDomain("Teach me business vocabulary"), "learn");
});

test("routes legal questions", () => {
  assert.equal(detectDomain("What state law applies here?"), "legal");
});

test("requires consent for high-stakes domains", () => {
  const result = orchestrate({ message: "Help me organize my credit debt", consent: false });
  assert.equal(result.ok, false);
  assert.equal(result.safety.reason, "explicit-consent-required");
});

test("creates an execution action plan", () => {
  const result = orchestrate({ message: "Help me finish my tasks today", consent: true });
  assert.equal(result.ok, true);
  assert.equal(result.route, "execute");
  assert.ok(result.actionPlan.includes("shrink-to-next-action"));
});

test("content intake is consent gated", () => {
  assert.equal(contentIntakePlan({ type: "pdf", consent: false }).ok, false);
  assert.equal(contentIntakePlan({ type: "pdf", consent: true }).ok, true);
});
