export const AFINAH = Object.freeze({
  name: "afinah",
  version: "0.3.1",
  principles: ["agency","consent","privacy","non-encroachment","source-grounding"],
  domains: ["heal","mind","execute","money","learn","legal","goals"]
});

export const MODULES = Object.freeze({
  heal: {
    label: "Heal",
    activation: "voluntary",
    highStakes: true,
    objective: "trauma-informed reflection, grounding, resilience and user-directed recovery support"
  },
  mind: {
    label: "Mind",
    activation: "voluntary",
    highStakes: true,
    objective: "attention, executive-function and cognitive strategy support without diagnosis"
  },
  execute: {
    label: "Execute",
    activation: "user-directed",
    highStakes: false,
    objective: "turn priorities into small executable actions with accountability loops"
  },
  money: {
    label: "Money",
    activation: "voluntary",
    highStakes: true,
    objective: "financial education, credit/debt organization and recovery planning"
  },
  learn: {
    label: "Learn",
    activation: "user-directed",
    highStakes: false,
    objective: "adaptive teaching, vocabulary growth, practice and mastery tracking"
  },
  legal: {
    label: "Legal Research",
    activation: "explicit",
    highStakes: true,
    objective: "source-grounded federal and state legal research with jurisdiction and date awareness"
  },
  goals: {
    label: "Dreams & Goals",
    activation: "user-directed",
    highStakes: false,
    objective: "convert ambitions into milestones, next actions and progress reviews"
  }
});
