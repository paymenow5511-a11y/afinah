const clip=(value,max=200)=>String(value??"").trim().slice(0,max);

export function profileRecord(input={}) {
  const id=clip(input.id,120);
  if(!id) return {ok:false,reason:"id-required"};
  return {ok:true,record:{id,displayName:clip(input.displayName,120),locale:clip(input.locale||"en-US",20)}};
}

export function consentRecord(input={}) {
  const id=clip(input.id,120), profileId=clip(input.profileId,120), domain=clip(input.domain,40);
  if(!id||!profileId||!domain) return {ok:false,reason:"required-fields-missing"};
  return {ok:true,record:{id,profileId,domain,granted:input.granted===true}};
}

export function goalRecord(input={}) {
  const id=clip(input.id,120), profileId=clip(input.profileId,120), title=clip(input.title,240);
  if(!id||!profileId||!title) return {ok:false,reason:"required-fields-missing"};
  return {ok:true,record:{id,profileId,title,status:clip(input.status||"active",40),targetDate:input.targetDate||null}};
}

export function taskRecord(input={}) {
  const id=clip(input.id,120), profileId=clip(input.profileId,120), title=clip(input.title,240);
  if(!id||!profileId||!title) return {ok:false,reason:"required-fields-missing"};
  return {ok:true,record:{id,profileId,goalId:clip(input.goalId,120)||null,title,status:clip(input.status||"planned",40),dueAt:input.dueAt||null}};
}
