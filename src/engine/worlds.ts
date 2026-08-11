/** Multi-world curriculum for Israeli PET quantitative demo. */

export type WorldId = 'percentages' | 'ratios' | 'averages' | 'fractions' | 'rate'

export type GeneratorId =
  // percentages
  | 'percent_of_v1'
  | 'percent_reversal_v1'
  | 'percent_change_v1'
  | 'percent_is_v1'
  | 'successive_percent_v1'
  // ratios
  | 'ratio_part_v1'
  | 'ratio_scale_v1'
  | 'ratio_whole_v1'
  | 'ratio_mix_v1'
  | 'ratio_triple_v1'
  // averages
  | 'mean_simple_v1'
  | 'mean_missing_v1'
  | 'mean_weighted_v1'
  | 'mean_needed_v1'
  | 'mean_remove_v1'
  // rate / work
  | 'rate_speed_v1'
  | 'rate_time_v1'
  | 'rate_distance_v1'
  | 'rate_avg_speed_v1'
  | 'rate_work_alone_v1'
  | 'rate_work_together_v1'
  | 'rate_meeting_v1'

export interface StageDef {
  id: number
  worldId: WorldId
  titleKey: string
  blurbKey: string
  emoji: string
  questionCount: number
  generators: GeneratorId[]
  baseDifficulty: number
  timeScale?: number
}

export interface WorldDef {
  id: WorldId
  titleKey: string
  blurbKey: string
  emoji: string
  /** live = playable · coming = locked stub */
  status: 'live' | 'coming'
  stages: StageDef[]
}

// ——— Percentages (existing) ———
const PERCENT_STAGES: StageDef[] = [
  {
    id: 1,
    worldId: 'percentages',
    titleKey: 'pct.stage.1.title',
    blurbKey: 'pct.stage.1.blurb',
    emoji: '🌱',
    questionCount: 5,
    generators: ['percent_of_v1'],
    baseDifficulty: 1,
  },
  {
    id: 2,
    worldId: 'percentages',
    titleKey: 'pct.stage.2.title',
    blurbKey: 'pct.stage.2.blurb',
    emoji: '↩️',
    questionCount: 5,
    generators: ['percent_reversal_v1'],
    baseDifficulty: 2,
  },
  {
    id: 3,
    worldId: 'percentages',
    titleKey: 'pct.stage.3.title',
    blurbKey: 'pct.stage.3.blurb',
    emoji: '📈',
    questionCount: 5,
    generators: ['percent_change_v1', 'percent_is_v1'],
    baseDifficulty: 2,
  },
  {
    id: 4,
    worldId: 'percentages',
    titleKey: 'pct.stage.4.title',
    blurbKey: 'pct.stage.4.blurb',
    emoji: '🔀',
    questionCount: 6,
    generators: ['percent_of_v1', 'percent_reversal_v1', 'percent_is_v1', 'percent_change_v1'],
    baseDifficulty: 3,
  },
  {
    id: 5,
    worldId: 'percentages',
    titleKey: 'pct.stage.5.title',
    blurbKey: 'pct.stage.5.blurb',
    emoji: '🎯',
    questionCount: 6,
    generators: [
      'percent_of_v1',
      'percent_reversal_v1',
      'percent_change_v1',
      'percent_is_v1',
      'successive_percent_v1',
    ],
    baseDifficulty: 3,
  },
  {
    id: 6,
    worldId: 'percentages',
    titleKey: 'pct.stage.6.title',
    blurbKey: 'pct.stage.6.blurb',
    emoji: '🧠',
    questionCount: 6,
    generators: [
      'successive_percent_v1',
      'percent_reversal_v1',
      'percent_change_v1',
      'percent_is_v1',
    ],
    baseDifficulty: 4,
  },
  {
    id: 7,
    worldId: 'percentages',
    titleKey: 'pct.stage.7.title',
    blurbKey: 'pct.stage.7.blurb',
    emoji: '⚡',
    questionCount: 7,
    generators: [
      'percent_of_v1',
      'percent_change_v1',
      'percent_reversal_v1',
      'successive_percent_v1',
      'percent_is_v1',
    ],
    baseDifficulty: 4,
    timeScale: 0.85,
  },
  {
    id: 8,
    worldId: 'percentages',
    titleKey: 'pct.stage.8.title',
    blurbKey: 'pct.stage.8.blurb',
    emoji: '🏆',
    questionCount: 8,
    generators: [
      'successive_percent_v1',
      'percent_reversal_v1',
      'percent_change_v1',
      'percent_is_v1',
      'percent_of_v1',
    ],
    baseDifficulty: 5,
    timeScale: 0.8,
  },
]

// ——— Ratios ———
const RATIO_STAGES: StageDef[] = [
  {
    id: 1,
    worldId: 'ratios',
    titleKey: 'ratio.stage.1.title',
    blurbKey: 'ratio.stage.1.blurb',
    emoji: '🌱',
    questionCount: 5,
    generators: ['ratio_part_v1'],
    baseDifficulty: 1,
  },
  {
    id: 2,
    worldId: 'ratios',
    titleKey: 'ratio.stage.2.title',
    blurbKey: 'ratio.stage.2.blurb',
    emoji: '📐',
    questionCount: 5,
    generators: ['ratio_scale_v1'],
    baseDifficulty: 2,
  },
  {
    id: 3,
    worldId: 'ratios',
    titleKey: 'ratio.stage.3.title',
    blurbKey: 'ratio.stage.3.blurb',
    emoji: '🔄',
    questionCount: 5,
    generators: ['ratio_whole_v1'],
    baseDifficulty: 2,
  },
  {
    id: 4,
    worldId: 'ratios',
    titleKey: 'ratio.stage.4.title',
    blurbKey: 'ratio.stage.4.blurb',
    emoji: '🔀',
    questionCount: 6,
    generators: ['ratio_part_v1', 'ratio_scale_v1', 'ratio_whole_v1'],
    baseDifficulty: 3,
  },
  {
    id: 5,
    worldId: 'ratios',
    titleKey: 'ratio.stage.5.title',
    blurbKey: 'ratio.stage.5.blurb',
    emoji: '🧪',
    questionCount: 6,
    generators: ['ratio_mix_v1'],
    baseDifficulty: 3,
  },
  {
    id: 6,
    worldId: 'ratios',
    titleKey: 'ratio.stage.6.title',
    blurbKey: 'ratio.stage.6.blurb',
    emoji: '🧠',
    questionCount: 6,
    generators: ['ratio_triple_v1', 'ratio_mix_v1'],
    baseDifficulty: 4,
  },
  {
    id: 7,
    worldId: 'ratios',
    titleKey: 'ratio.stage.7.title',
    blurbKey: 'ratio.stage.7.blurb',
    emoji: '⚡',
    questionCount: 7,
    generators: ['ratio_part_v1', 'ratio_whole_v1', 'ratio_mix_v1', 'ratio_scale_v1', 'ratio_triple_v1'],
    baseDifficulty: 4,
    timeScale: 0.88,
  },
  {
    id: 8,
    worldId: 'ratios',
    titleKey: 'ratio.stage.8.title',
    blurbKey: 'ratio.stage.8.blurb',
    emoji: '🏆',
    questionCount: 8,
    generators: [
      'ratio_triple_v1',
      'ratio_mix_v1',
      'ratio_whole_v1',
      'ratio_scale_v1',
      'ratio_part_v1',
    ],
    baseDifficulty: 5,
    timeScale: 0.82,
  },
]

// ——— Averages ———
const AVERAGE_STAGES: StageDef[] = [
  {
    id: 1,
    worldId: 'averages',
    titleKey: 'avg.stage.1.title',
    blurbKey: 'avg.stage.1.blurb',
    emoji: '🌱',
    questionCount: 5,
    generators: ['mean_simple_v1'],
    baseDifficulty: 1,
  },
  {
    id: 2,
    worldId: 'averages',
    titleKey: 'avg.stage.2.title',
    blurbKey: 'avg.stage.2.blurb',
    emoji: '❓',
    questionCount: 5,
    generators: ['mean_missing_v1'],
    baseDifficulty: 2,
  },
  {
    id: 3,
    worldId: 'averages',
    titleKey: 'avg.stage.3.title',
    blurbKey: 'avg.stage.3.blurb',
    emoji: '⚖️',
    questionCount: 5,
    generators: ['mean_weighted_v1'],
    baseDifficulty: 2,
  },
  {
    id: 4,
    worldId: 'averages',
    titleKey: 'avg.stage.4.title',
    blurbKey: 'avg.stage.4.blurb',
    emoji: '🎯',
    questionCount: 6,
    generators: ['mean_needed_v1'],
    baseDifficulty: 3,
  },
  {
    id: 5,
    worldId: 'averages',
    titleKey: 'avg.stage.5.title',
    blurbKey: 'avg.stage.5.blurb',
    emoji: '📉',
    questionCount: 6,
    generators: ['mean_remove_v1', 'mean_missing_v1'],
    baseDifficulty: 3,
  },
  {
    id: 6,
    worldId: 'averages',
    titleKey: 'avg.stage.6.title',
    blurbKey: 'avg.stage.6.blurb',
    emoji: '🧠',
    questionCount: 6,
    generators: ['mean_weighted_v1', 'mean_needed_v1', 'mean_simple_v1'],
    baseDifficulty: 4,
  },
  {
    id: 7,
    worldId: 'averages',
    titleKey: 'avg.stage.7.title',
    blurbKey: 'avg.stage.7.blurb',
    emoji: '⚡',
    questionCount: 7,
    generators: [
      'mean_weighted_v1',
      'mean_remove_v1',
      'mean_needed_v1',
      'mean_missing_v1',
      'mean_simple_v1',
    ],
    baseDifficulty: 4,
    timeScale: 0.88,
  },
  {
    id: 8,
    worldId: 'averages',
    titleKey: 'avg.stage.8.title',
    blurbKey: 'avg.stage.8.blurb',
    emoji: '🏆',
    questionCount: 8,
    generators: [
      'mean_weighted_v1',
      'mean_needed_v1',
      'mean_remove_v1',
      'mean_missing_v1',
      'mean_simple_v1',
    ],
    baseDifficulty: 5,
    timeScale: 0.82,
  },
]

// ——— Rate & work ———
const RATE_STAGES: StageDef[] = [
  {
    id: 1,
    worldId: 'rate',
    titleKey: 'rate.stage.1.title',
    blurbKey: 'rate.stage.1.blurb',
    emoji: '🌱',
    questionCount: 5,
    generators: ['rate_speed_v1'],
    baseDifficulty: 1,
  },
  {
    id: 2,
    worldId: 'rate',
    titleKey: 'rate.stage.2.title',
    blurbKey: 'rate.stage.2.blurb',
    emoji: '⏳',
    questionCount: 5,
    generators: ['rate_time_v1'],
    baseDifficulty: 2,
  },
  {
    id: 3,
    worldId: 'rate',
    titleKey: 'rate.stage.3.title',
    blurbKey: 'rate.stage.3.blurb',
    emoji: '🛣️',
    questionCount: 5,
    generators: ['rate_distance_v1'],
    baseDifficulty: 2,
  },
  {
    id: 4,
    worldId: 'rate',
    titleKey: 'rate.stage.4.title',
    blurbKey: 'rate.stage.4.blurb',
    emoji: '🔀',
    questionCount: 6,
    generators: ['rate_speed_v1', 'rate_time_v1', 'rate_distance_v1'],
    baseDifficulty: 3,
  },
  {
    id: 5,
    worldId: 'rate',
    titleKey: 'rate.stage.5.title',
    blurbKey: 'rate.stage.5.blurb',
    emoji: '📊',
    questionCount: 6,
    generators: ['rate_avg_speed_v1'],
    baseDifficulty: 3,
  },
  {
    id: 6,
    worldId: 'rate',
    titleKey: 'rate.stage.6.title',
    blurbKey: 'rate.stage.6.blurb',
    emoji: '🛠️',
    questionCount: 6,
    generators: ['rate_work_alone_v1', 'rate_work_together_v1'],
    baseDifficulty: 4,
  },
  {
    id: 7,
    worldId: 'rate',
    titleKey: 'rate.stage.7.title',
    blurbKey: 'rate.stage.7.blurb',
    emoji: '🚗',
    questionCount: 7,
    generators: [
      'rate_meeting_v1',
      'rate_avg_speed_v1',
      'rate_work_together_v1',
      'rate_speed_v1',
      'rate_time_v1',
    ],
    baseDifficulty: 4,
    timeScale: 0.88,
  },
  {
    id: 8,
    worldId: 'rate',
    titleKey: 'rate.stage.8.title',
    blurbKey: 'rate.stage.8.blurb',
    emoji: '🏆',
    questionCount: 8,
    generators: [
      'rate_meeting_v1',
      'rate_work_together_v1',
      'rate_avg_speed_v1',
      'rate_work_alone_v1',
      'rate_distance_v1',
      'rate_speed_v1',
      'rate_time_v1',
    ],
    baseDifficulty: 5,
    timeScale: 0.82,
  },
]

export const WORLDS: WorldDef[] = [
  {
    id: 'percentages',
    titleKey: 'world.percentages.title',
    blurbKey: 'world.percentages.blurb',
    emoji: '📒',
    status: 'live',
    stages: PERCENT_STAGES,
  },
  {
    id: 'ratios',
    titleKey: 'world.ratios.title',
    blurbKey: 'world.ratios.blurb',
    emoji: '⚖️',
    status: 'live',
    stages: RATIO_STAGES,
  },
  {
    id: 'averages',
    titleKey: 'world.averages.title',
    blurbKey: 'world.averages.blurb',
    emoji: '📊',
    status: 'live',
    stages: AVERAGE_STAGES,
  },
  {
    id: 'rate',
    titleKey: 'world.rate.title',
    blurbKey: 'world.rate.blurb',
    emoji: '⏱️',
    status: 'live',
    stages: RATE_STAGES,
  },
  {
    id: 'fractions',
    titleKey: 'world.fractions.title',
    blurbKey: 'world.fractions.blurb',
    emoji: '➗',
    status: 'coming',
    stages: [],
  },
]

export function getWorld(id: WorldId): WorldDef | undefined {
  return WORLDS.find((w) => w.id === id)
}

export function getStageDef(worldId: WorldId, stageId: number): StageDef | undefined {
  return getWorld(worldId)?.stages.find((s) => s.id === stageId)
}

export function isStageUnlocked(
  worldId: WorldId,
  stageId: number,
  starsByKey: Record<string, number>,
): boolean {
  if (stageId <= 1) return true
  return (starsByKey[stageKey(worldId, stageId - 1)] ?? 0) >= 1
}

export function stageKey(worldId: WorldId, stageId: number): string {
  return `${worldId}:${stageId}`
}

export function parseStageKey(key: string): { worldId: WorldId; stageId: number } | null {
  const [w, s] = key.split(':')
  if (!w || !s) return null
  return { worldId: w as WorldId, stageId: Number(s) }
}

/** Stars earned in a world (sum 0–24). */
export function worldStars(worldId: WorldId, starsByKey: Record<string, number>): number {
  const world = getWorld(worldId)
  if (!world) return 0
  return world.stages.reduce((sum, st) => sum + (starsByKey[stageKey(worldId, st.id)] ?? 0), 0)
}

export function worldCompletedStages(worldId: WorldId, starsByKey: Record<string, number>): number {
  const world = getWorld(worldId)
  if (!world) return 0
  return world.stages.filter((st) => (starsByKey[stageKey(worldId, st.id)] ?? 0) >= 1).length
}

/**
 * Soft unlock:
 * - percentages: always
 * - ratios: % stage 4 done OR 8★ in %
 * - averages: ratios stage 3 OR 6★ ratios OR % stage 6
 * - rate: averages stage 3 OR 6★ averages OR ratios stage 6
 * - coming worlds: never
 */
export function isWorldUnlocked(worldId: WorldId, starsByKey: Record<string, number>): boolean {
  const world = getWorld(worldId)
  if (!world || world.status !== 'live') return worldId === 'percentages'
  if (worldId === 'percentages') return true
  if (worldId === 'ratios') {
    return (
      (starsByKey[stageKey('percentages', 4)] ?? 0) >= 1 ||
      worldStars('percentages', starsByKey) >= 8
    )
  }
  if (worldId === 'averages') {
    return (
      (starsByKey[stageKey('ratios', 3)] ?? 0) >= 1 ||
      worldStars('ratios', starsByKey) >= 6 ||
      (starsByKey[stageKey('percentages', 6)] ?? 0) >= 1
    )
  }
  if (worldId === 'rate') {
    return (
      (starsByKey[stageKey('averages', 3)] ?? 0) >= 1 ||
      worldStars('averages', starsByKey) >= 6 ||
      (starsByKey[stageKey('ratios', 6)] ?? 0) >= 1
    )
  }
  return false
}

export function recommendInWorld(
  worldId: WorldId,
  starsByKey: Record<string, number>,
): number {
  const world = getWorld(worldId)
  if (!world || world.stages.length === 0) return 1
  for (const stage of world.stages) {
    if (!isStageUnlocked(worldId, stage.id, starsByKey)) break
    if ((starsByKey[stageKey(worldId, stage.id)] ?? 0) < 3) return stage.id
  }
  for (let i = world.stages.length; i >= 1; i--) {
    if (isStageUnlocked(worldId, i, starsByKey)) return i
  }
  return 1
}

/** Best next play target across unlocked worlds. */
export function recommendTarget(starsByKey: Record<string, number>): {
  worldId: WorldId
  stageId: number
} {
  const order: WorldId[] = ['percentages', 'ratios', 'averages', 'rate']
  for (const wid of order) {
    if (!isWorldUnlocked(wid, starsByKey)) continue
    const sid = recommendInWorld(wid, starsByKey)
    const stars = starsByKey[stageKey(wid, sid)] ?? 0
    if (stars < 3) return { worldId: wid, stageId: sid }
  }
  // all perfect — stay on last unlocked world's last stage
  for (let i = order.length - 1; i >= 0; i--) {
    const wid = order[i]!
    if (isWorldUnlocked(wid, starsByKey)) {
      return { worldId: wid, stageId: recommendInWorld(wid, starsByKey) }
    }
  }
  return { worldId: 'percentages', stageId: 1 }
}

// Back-compat alias used by older imports
export const PERCENT_STAGES_EXPORT = PERCENT_STAGES
