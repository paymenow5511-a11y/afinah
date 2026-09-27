export function stabilityPlan(input = {}) {
  if (input.consent !== true) return { ok:false, reason:"consent-required" };
  const objective=String(input.objective||"stabilize").trim();
  return {
    ok:true,
    objective,
    boundaries:["education-only","verify-source-data","make-uncertainty-visible","escalate-specialized-professional-issues"],
    phases:["inventory","prioritize","choose-next-action","review-progress"]
  };
}
