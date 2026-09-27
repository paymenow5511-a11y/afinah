import { orchestrate } from "./orchestrator.js";
import { contentIntakePlan } from "./content-intake.js";
import { createLifeMap } from "./life-map.js";
import { researchPlan } from "./research-contract.js";
import { learningPlan } from "./learning.js";
import { focusPlan } from "./focus.js";
import { voiceSessionPlan } from "./voice.js";
import { storagePlan } from "./storage-contract.js";
import { stabilityPlan } from "./stability-plan.js";

export function coreRuntime(action,input={},env={}) {
  const handlers={
    orchestrate:()=>orchestrate(input),
    intake:()=>contentIntakePlan(input),
    lifeMap:()=>createLifeMap(input),
    research:()=>researchPlan(input),
    learning:()=>learningPlan(input),
    focus:()=>focusPlan(input),
    voice:()=>voiceSessionPlan(input),
    storage:()=>storagePlan(env),
    stability:()=>stabilityPlan(input)
  };
  const handler=handlers[action];
  return handler ? handler() : {ok:false,reason:"unknown-action"};
}
