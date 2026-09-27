const HIGH_STAKES = new Set(["heal","mind","money","legal"]);

export function safetyEnvelope({ domain, consent = false, message = "" }) {
  const highStakes = HIGH_STAKES.has(domain);
  if (highStakes && !consent) {
    return { allowed: false, reason: "explicit-consent-required", domain };
  }
  const crisis = /(?:suicid|kill myself|hurt myself|self[- ]harm)/i.test(message);
  if (crisis) return { allowed: false, reason: "crisis-escalation", domain };
  return {
    allowed: true,
    domain,
    highStakes,
    requirements: highStakes ? ["source-grounding","uncertainty-disclosure","human-escalation-when-needed"] : []
  };
}
