const POLICY = Object.freeze({
  planner: new Set(["goals.read","goals.plan","tasks.plan"]),
  coach: new Set(["goals.read","goals.plan","tasks.plan","learning.plan"]),
  legalResearch: new Set(["legal.research"]),
  financialCoach: new Set(["finance.plan"]),
  ingestion: new Set(["content.inspect"])
});

const SENSITIVE = new Set(["legal.research","finance.plan"]);

export function authorizeCapability({ agent, capability, consent = false }) {
  const allow = POLICY[agent];
  if (!allow || !allow.has(capability)) return { allowed: false, reason: "capability-not-allowed" };
  if (SENSITIVE.has(capability) && !consent) return { allowed: false, reason: "explicit-consent-required" };
  return { allowed: true };
}

export function toolGatewayRequest(input) {
  const decision = authorizeCapability(input);
  return { ...decision, agent: input.agent, capability: input.capability, execution: decision.allowed ? "adapter-required" : "blocked" };
}
