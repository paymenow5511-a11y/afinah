export function learningPlan(input = {}) {
  const subject=String(input.subject||"").trim();
  if (!subject) return { ok:false, reason:"subject-required" };
  const minutes=Math.max(5,Math.min(120,Number(input.minutes)||20));
  const level=["beginner","intermediate","advanced"].includes(input.level)?input.level:"beginner";
  return {
    ok:true,subject,level,minutes,
    cycle:["diagnostic-question","teach-one-concept","guided-practice","retrieval-check","vocabulary-reinforcement","adapt-next-lesson"],
    mastery:{threshold:0.8,method:"demonstrated-recall-and-application"}
  };
}

export function vocabularyExercise(words = []) {
  const clean=[...new Set((Array.isArray(words)?words:[]).map(w=>String(w).trim()).filter(Boolean))].slice(0,12);
  return { ok:clean.length>0, words:clean, activities:["plain-language-definition","use-in-context","contrast-with-near-synonym","recall-later"] };
}
