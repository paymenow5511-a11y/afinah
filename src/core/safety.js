const HIGH_STAKES = new Set(["heal","mind","money","legal"]);

const REQUIREMENTS = Object.freeze({
  heal: ["consent","trauma-informed-language","no-diagnosis","human-escalation-when-needed"],
  mind: ["consent","no-diagnosis","functional-strategy-framing","human-escalation-when-needed"],
  money: ["consent","source-grounding","uncertainty-disclosure","no-guaranteed-outcomes"],
  legal: ["consent","authoritative-sources","jurisdiction-awareness","effective-date-awareness","uncertainty-disclosure"]
});

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
    requirements: REQUIREMENTS[domain] || ["preserve-user-agency"]
  };
}
