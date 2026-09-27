const POLICY = Object.freeze({
  planner: new Set(["goals.read","goals.plan","tasks.plan"]),
  coach: new Set(["goals.read","goals.plan","tasks.plan","learning.plan","focus.plan"]),
  research: new Set(["research.plan"]),
  stabilityCoach: new Set(["stability.plan"]),
  voiceCoach: new Set(["voice.plan"]),
  ingestion: new Set(["content.inspect"]),
  storage: new Set(["storage.status"])
});

const CONSENT_GATED = new Set(["research.plan","stability.plan","voice.plan"]);

export function authorizeCapability({ agent, capability, consent = false }) {
  const allow = POLICY[agent];
  if (!allow || !allow.has(capability)) return { allowed: false, reason: "capability-not-allowed" };
  if (CONSENT_GATED.has(capability) && !consent) return { allowed: false, reason: "explicit-consent-required" };
  return { allowed: true };
}

export function toolGatewayRequest(input) {
  const decision = authorizeCapability(input);
  return {
    ...decision,
    agent: input.agent,
    capability: input.capability,
    execution: decision.allowed ? "adapter-required" : "blocked"
  };
}

export function capabilityManifest() {
  return Object.fromEntries(Object.entries(POLICY).map(([agent,set])=>[agent,[...set]]));
}
