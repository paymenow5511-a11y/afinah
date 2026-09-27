export function focusPlan(input = {}) {
  const tasks=Array.isArray(input.tasks)?input.tasks.map(x=>String(x).trim()).filter(Boolean).slice(0,20):[];
  const energy=["low","medium","high"].includes(input.energy)?input.energy:"medium";
  if (!tasks.length) return { ok:false, reason:"tasks-required" };
  const focusMinutes=energy==="low"?10:energy==="high"?30:20;
  return {
    ok:true,
    energy,
    focusMinutes,
    sequence:tasks.map((task,index)=>({task,index,firstStep:"Prepare what is needed for: "+task,status:"planned"})),
    accountability:["start-check","completion-check","blocker-review","shrink-or-reschedule"]
  };
}
