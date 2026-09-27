import test from "node:test";
import assert from "node:assert/strict";
import { coreRuntime } from "../src/core/runtime.js";

test("life map requires a user id", () => {
  assert.equal(coreRuntime("lifeMap",{}).ok,false);
  assert.equal(coreRuntime("lifeMap",{userId:"u1",priorities:["execute","learn"]}).ok,true);
});

test("research requires jurisdiction and question", () => {
  assert.equal(coreRuntime("research",{question:"What applies?"}).ok,false);
  const plan=coreRuntime("research",{jurisdiction:"Florida",question:"What applies?"});
  assert.equal(plan.ok,true);
  assert.ok(plan.requirements.includes("citations"));
});

test("learning creates an adaptive mastery cycle", () => {
  const plan=coreRuntime("learning",{subject:"business vocabulary",minutes:15});
  assert.equal(plan.ok,true);
  assert.ok(plan.cycle.includes("vocabulary-reinforcement"));
});

test("focus planning adapts session size to energy", () => {
  const plan=coreRuntime("focus",{tasks:["Draft outline"],energy:"low"});
  assert.equal(plan.ok,true);
  assert.equal(plan.focusMinutes,10);
});

test("voice planning is consent gated", () => {
  assert.equal(coreRuntime("voice",{consent:false}).ok,false);
  const plan=coreRuntime("voice",{consent:true,locale:"en-US"});
  assert.equal(plan.ok,true);
  assert.equal(plan.retention.rawAudio,"off-by-default");
});

test("storage contract reports missing binding honestly", () => {
  const plan=coreRuntime("storage",{}, {});
  assert.equal(plan.configured,false);
  assert.equal(plan.status,"adapter-required");
});

test("stability planning is consent gated", () => {
  assert.equal(coreRuntime("stability",{consent:false}).ok,false);
  assert.equal(coreRuntime("stability",{consent:true}).ok,true);
});
