export function researchPlan(input = {}) {
  const jurisdiction = String(input.jurisdiction || "").trim();
  const question = String(input.question || "").trim();
  if (!jurisdiction) return { ok:false, reason:"jurisdiction-required" };
  if (!question) return { ok:false, reason:"question-required" };
  return {
    ok:true,
    jurisdiction,
    question,
    requirements:["authoritative-sources","effective-date","citations","source-analysis-separation"]
  };
}

export function validateEvidence(items = []) {
  if (!Array.isArray(items) || items.length === 0) return { ok:false, reason:"sources-required" };
  const invalid = items.filter(x=>!x?.url || !x?.title || !x?.jurisdiction || !x?.checkedAt);
  return invalid.length ? { ok:false, reason:"incomplete-source-metadata", invalidCount:invalid.length } : { ok:true, count:items.length };
}
