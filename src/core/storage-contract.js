export function storagePlan(env = {}) {
  return {
    ok:true,
    configured:Boolean(env.DB),
    status:env.DB ? "binding-present" : "adapter-required",
    entities:["profile","consent","goal","task","life-map"],
    requirements:["tenant-scope","least-privilege","deletion-support","export-support","retention-policy"]
  };
}
