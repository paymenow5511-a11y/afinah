export const AFINAH = Object.freeze({
  name: "afinah",
  version: "0.3.0",
  principles: ["agency","consent","privacy","non-encroachment","source-grounding"],
  domains: ["heal","mind","execute","money","learn","legal","goals"]
});

export const MODULES = Object.freeze({
  heal: { label: "Heal", activation: "voluntary", highStakes: true },
  mind: { label: "Mind", activation: "voluntary", highStakes: true },
  execute: { label: "Execute", activation: "user-directed", highStakes: false },
  money: { label: "Money", activation: "voluntary", highStakes: true },
  learn: { label: "Learn", activation: "user-directed", highStakes: false },
  legal: { label: "Legal Research", activation: "explicit", highStakes: true },
  goals: { label: "Dreams & Goals", activation: "user-directed", highStakes: false }
});
