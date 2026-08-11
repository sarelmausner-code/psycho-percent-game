/** Percentage world — 8 stages with rising difficulty. */

export type GeneratorId =
  | 'percent_of_v1'
  | 'percent_reversal_v1'
  | 'percent_change_v1'
  | 'percent_is_v1'
  | 'successive_percent_v1'

export interface StageDef {
  id: number
  titleKey: string
  blurbKey: string
  emoji: string
  questionCount: number
  generators: GeneratorId[]
  /** 1–5 base difficulty (ramps up within stage too) */
  baseDifficulty: number
  timeScale?: number
}

export const PERCENT_STAGES: StageDef[] = [
  {
    id: 1,
    titleKey: 'stage.1.title',
    blurbKey: 'stage.1.blurb',
    emoji: '🌱',
    questionCount: 5,
    generators: ['percent_of_v1'],
    baseDifficulty: 1,
  },
  {
    id: 2,
    titleKey: 'stage.2.title',
    blurbKey: 'stage.2.blurb',
    emoji: '↩️',
    questionCount: 5,
    generators: ['percent_reversal_v1'],
    baseDifficulty: 1,
  },
  {
    id: 3,
    titleKey: 'stage.3.title',
    blurbKey: 'stage.3.blurb',
    emoji: '📈',
    questionCount: 5,
    generators: ['percent_change_v1', 'percent_is_v1'],
    baseDifficulty: 2,
  },
  {
    id: 4,
    titleKey: 'stage.4.title',
    blurbKey: 'stage.4.blurb',
    emoji: '🔀',
    questionCount: 6,
    generators: ['percent_of_v1', 'percent_reversal_v1', 'percent_is_v1'],
    baseDifficulty: 2,
  },
  {
    id: 5,
    titleKey: 'stage.5.title',
    blurbKey: 'stage.5.blurb',
    emoji: '🎯',
    questionCount: 6,
    generators: [
      'percent_of_v1',
      'percent_reversal_v1',
      'percent_change_v1',
      'percent_is_v1',
    ],
    baseDifficulty: 3,
  },
  {
    id: 6,
    titleKey: 'stage.6.title',
    blurbKey: 'stage.6.blurb',
    emoji: '🧠',
    questionCount: 6,
    generators: [
      'percent_reversal_v1',
      'successive_percent_v1',
      'percent_change_v1',
      'percent_is_v1',
    ],
    baseDifficulty: 3,
  },
  {
    id: 7,
    titleKey: 'stage.7.title',
    blurbKey: 'stage.7.blurb',
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
    timeScale: 0.88,
  },
  {
    id: 8,
    titleKey: 'stage.8.title',
    blurbKey: 'stage.8.blurb',
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
    timeScale: 0.85,
  },
]

export function getStageDef(id: number): StageDef | undefined {
  return PERCENT_STAGES.find((s) => s.id === id)
}

export function isStageUnlocked(
  stageId: number,
  starsByStage: Record<number, number>,
): boolean {
  if (stageId <= 1) return true
  const prev = starsByStage[stageId - 1] ?? 0
  return prev >= 1
}

export function recommendStageId(starsByStage: Record<number, number>): number {
  for (const stage of PERCENT_STAGES) {
    if (!isStageUnlocked(stage.id, starsByStage)) break
    const stars = starsByStage[stage.id] ?? 0
    if (stars < 3) return stage.id
  }
  for (let i = PERCENT_STAGES.length; i >= 1; i--) {
    if (isStageUnlocked(i, starsByStage)) return i
  }
  return 1
}
