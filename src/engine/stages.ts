/** Back-compat re-exports — source of truth is worlds.ts */
export {
  type WorldId,
  type GeneratorId,
  type StageDef,
  type WorldDef,
  WORLDS,
  getWorld,
  getStageDef,
  isStageUnlocked,
  isWorldUnlocked,
  stageKey,
  worldStars,
  worldCompletedStages,
  recommendInWorld,
  recommendTarget,
  PERCENT_STAGES_EXPORT as PERCENT_STAGES,
} from './worlds'
