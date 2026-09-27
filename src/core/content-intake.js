const TYPES = new Set(["text","pdf","structured"]);

export function contentIntakePlan(input = {}) {
  const type = input.type;
  if (!TYPES.has(type)) return { ok: false, reason: "unsupported-type" };
  if (input.consent !== true) return { ok: false, reason: "consent-required" };
  const steps = type === "pdf" ? ["extract-text","segment","prepare-for-retrieval"] : type === "structured" ? ["validate-shape","prepare-fields","prepare-for-retrieval"] : ["normalize-text","segment","prepare-for-retrieval"];
  return { ok: true, type, name: String(input.name || "untitled").slice(0,160), steps, storage: "not-connected" };
}
