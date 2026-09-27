export function voiceSessionPlan(input = {}) {
  if (input.consent !== true) return { ok:false, reason:"consent-required" };
  const locale=String(input.locale||"en-US");
  return {
    ok:true,
    locale,
    transport:"provider-adapter-required",
    retention:{rawAudio:"off-by-default",derivedSignals:"off-by-default"},
    controls:["user-mute","user-stop","transcript-review","delete-session"],
    inferencePolicy:"do-not-infer-sensitive-health-status-from-voice"
  };
}
