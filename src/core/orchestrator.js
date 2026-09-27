import { MODULES } from "./config.js";
import { safetyEnvelope } from "./safety.js";

const INTENTS = [
  ["legal", /law|statute|regulation|court|legal|bankruptcy/i],
  ["money", /credit|debt|budget|money|finance|income/i],
  ["learn", /teach|learn|study|vocabulary|quiz|course/i],
  ["execute", /task|focus|adhd|productive|schedule|finish/i],
  ["heal", /trauma|childhood|grief|trigger|heal|overwhelm/i],
  ["goals", /goal|dream|plan|milestone/i]
];

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
    next: domain === "legal" ? "retrieve-authoritative-sources" : "generate-user-directed-plan"
  };
}
