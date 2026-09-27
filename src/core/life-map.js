const AREAS = Object.freeze(["heal","mind","execute","money","learn","legal","goals"]);

export function createLifeMap(input = {}) {
  const userId = String(input.userId || "").trim();
  if (!userId) return { ok:false, reason:"user-id-required" };
  const priorities = Array.isArray(input.priorities) ? input.priorities.filter(x=>AREAS.includes(x)).slice(0,7) : [];
  return {
    ok:true,
    userId,
    priorities,
    areas:Object.fromEntries(AREAS.map(area=>[area,{status:"not-assessed",nextAction:null}])),
    updatedAt:new Date(0).toISOString()
  };
}

export function setAreaNextAction(lifeMap, area, nextAction) {
  if (!lifeMap?.areas?.[area]) return { ok:false, reason:"unknown-area" };
  const action=String(nextAction||"").trim();
  if (!action) return { ok:false, reason:"next-action-required" };
  return {
    ok:true,
    lifeMap:{...lifeMap,areas:{...lifeMap.areas,[area]:{...lifeMap.areas[area],status:"active",nextAction:action}}}
  };
}
