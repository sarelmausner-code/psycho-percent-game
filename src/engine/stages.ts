/** Percentage world — 8 stages curriculum. */

export type GeneratorId =
  | 'percent_of_v1'
  | 'percent_reversal_v1'
  | 'percent_change_v1'

export interface StageDef {
  id: number
  /** i18n key for title */
  titleKey: string
  /** i18n key for short blurb */
  blurbKey: string
  emoji: string
  questionCount: number
  /** Weighted pool of generator ids */
  generators: GeneratorId[]
  /** Optional time scale on targets (1 = normal) */
  timeScale?: number
}

export const PERCENT_STAGES: StageDef[] = [
  {
    id: 1,
    titleKey: 'stage.1.title',
    blurbKey: 'stage.1.blurb',
    emoji: '🌱',
    questionCount: 4,
    generators: ['percent_of_v1'],
  },
  {
    id: 2,
    titleKey: 'stage.2.title',
    blurbKey: 'stage.2.blurb',
    emoji: '↩️',
    questionCount: 4,
    generators: ['percent_reversal_v1'],
  },
  {
    id: 3,
    titleKey: 'stage.3.title',
    blurbKey: 'stage.3.blurb',
    emoji: '📈',
    questionCount: 4,
    generators: ['percent_change_v1'],
  },
  {
    id: 4,
    titleKey: 'stage.4.title',
    blurbKey: 'stage.4.blurb',
    emoji: '🔀',
    questionCount: 5,
    generators: ['percent_of_v1', 'percent_reversal_v1'],
  },
  {
    id: 5,
    titleKey: 'stage.5.title',
    blurbKey: 'stage.5.blurb',
    emoji: '🎯',
    questionCount: 5,
    generators: ['percent_of_v1', 'percent_reversal_v1', 'percent_change_v1'],
  },
  {
    id: 6,
    titleKey: 'stage.6.title',
    blurbKey: 'stage.6.blurb',
    emoji: '🧠',
    questionCount: 6,
    generators: [
      'percent_reversal_v1',
      'percent_reversal_v1',
      'percent_change_v1',
      'percent_of_v1',
    ],
  },
  {
    id: 7,
    titleKey: 'stage.7.title',
    blurbKey: 'stage.7.blurb',
    emoji: '⚡',
    questionCount: 6,
    generators: ['percent_of_v1', 'percent_change_v1', 'percent_reversal_v1'],
    timeScale: 0.85,
  },
  {
    id: 8,
    titleKey: 'stage.8.title',
    blurbKey: 'stage.8.blurb',
    emoji: '🏆',
    questionCount: 7,
    generators: [
      'percent_of_v1',
      'percent_reversal_v1',
      'percent_change_v1',
      'percent_reversal_v1',
      'percent_change_v1',
    ],
    timeScale: 0.9,
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

/** First unfinished or first with &lt;3 stars; else last unlocked. */
export function recommendStageId(starsByStage: Record<number, number>): number {
  for (const stage of PERCENT_STAGES) {
    if (!isStageUnlocked(stage.id, starsByStage)) break
    const stars = starsByStage[stage.id] ?? 0
    if (stars < 3) return stage.id
  }
  // all perfect or only early unlocked
  for (let i = PERCENT_STAGES.length; i >= 1; i--) {
    if (isStageUnlocked(i, starsByStage)) return i
  }
  return 1
}
