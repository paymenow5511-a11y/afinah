import { MODULES } from "./config.js";
import { safetyEnvelope } from "./safety.js";

const INTENTS = [
  ["legal", /law|statute|regulation|court|legal|bankruptcy/i],
  ["money", /credit|debt|budget|money|finance|income/i],
  ["learn", /teach|learn|study|vocabulary|quiz|course|train me/i],
  ["execute", /task|focus|adhd|productive|productivity|schedule|finish|accountab/i],
  ["heal", /trauma|childhood|grief|trigger|heal|overwhelm|grounding/i],
  ["mind", /attention|executive function|impulsiv|working memory/i],
  ["goals", /goal|dream|plan|milestone|vision/i]
];

const ACTIONS = Object.freeze({
  heal: ["reflect-without-judgment","identify-present-need","offer-grounding-or-next-support-step"],
  mind: ["identify-functional-challenge","select-compensating-strategy","test-and-review"],
  execute: ["name-outcome","shrink-to-next-action","set-accountability-checkpoint"],
  money: ["clarify-current-position","organize-options","build-user-approved-recovery-plan"],
  learn: ["assess-current-level","teach-one-concept","practice","check-mastery","adapt"],
  legal: ["identify-jurisdiction","retrieve-authoritative-sources","separate-source-facts-from-analysis","cite-sources"],
  goals: ["define-outcome","create-milestones","select-next-action","review-progress"]
});

export function detectDomain(message = "") {
  return INTENTS.find(([, re]) => re.test(message))?.[0] || "goals";
}

export function orchestrate({ message = "", consent = false, requestedDomain }) {
  const domain = requestedDomain && MODULES[requestedDomain] ? requestedDomain : detectDomain(message);
  const safety = safetyEnvelope({ domain, consent, message });
  if (!safety.allowed) return { ok: false, route: domain, safety };

  return {
    ok: true,
    route: domain,
    module: MODULES[domain],
    safety,
    actionPlan: ACTIONS[domain],
    responseContract: {
      preserveAgency: true,
      makeUncertaintyVisible: MODULES[domain].highStakes,
      sourceGroundingRequired: domain === "legal" || domain === "money" || domain === "heal" || domain === "mind",
      diagnosticClaimAllowed: false
    }
  };
}
