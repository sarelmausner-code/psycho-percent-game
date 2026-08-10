export const TIMING = {
  SOUND_LATENCY_MAX: 16,
  BUTTON_JUMP: 600,
  PARTICLE_LIFE: 800,
  PRAISE_LIFE: 950,
  AUTO_ADVANCE_CORRECT: 1200,
  STAGE_CELEBRATION: 2500,
  STAR_STAGGER: 170,
} as const

export type SpeedTier = 'lightning' | 'fast' | 'ok' | 'slow'

export function comboMultiplier(combo: number): number {
  if (combo >= 9) return 4
  if (combo >= 6) return 3
  if (combo >= 3) return 2
  return 1
}

/** Lightning < 35% of target · Fast < 55% · Ok under target · else slow */
export function speedTier(ms: number, targetSec: number): SpeedTier {
  const ratio = ms / (targetSec * 1000)
  if (ratio < 0.35) return 'lightning'
  if (ratio < 0.55) return 'fast'
  if (ratio <= 1) return 'ok'
  return 'slow'
}

export function speedBonusPoints(tier: SpeedTier): number {
  switch (tier) {
    case 'lightning':
      return 80
    case 'fast':
      return 45
    case 'ok':
      return 15
    default:
      return 0
  }
}

export function pointsForAnswer(
  correct: boolean,
  comboBefore: number,
  ms: number,
  targetSec: number,
): { total: number; base: number; speed: number; mult: number; tier: SpeedTier } {
  const tier = speedTier(ms, targetSec)
  if (!correct) return { total: 0, base: 0, speed: 0, mult: 1, tier }
  const mult = comboMultiplier(comboBefore + 1)
  const base = 100
  const speed = speedBonusPoints(tier)
  return { total: (base + speed) * mult, base, speed, mult, tier }
}

/** Demo training score skin — not an official PET score. */
export function toTrainingScore(totalPoints: number, accuracy: number): number {
  const raw = 200 + Math.round(totalPoints * 0.3 + accuracy * 250)
  return Math.max(200, Math.min(800, raw))
}

export function starsForStage(accuracy: number, avgMs: number, avgTargetSec: number): 1 | 2 | 3 {
  if (accuracy >= 0.8 && avgMs <= avgTargetSec * 1000 * 0.7) return 3
  if (accuracy >= 0.8) return 2
  return 1
}

export function pickPraise(combo: number, tier: SpeedTier): string {
  if (tier === 'lightning') {
    return ['ברק! ⚡', 'טייס!', 'מטורף! 🚀', 'הבזק!'][combo % 4]!
  }
  if (tier === 'fast') {
    return ['מהיר! 💨', 'זריז!', 'קצב גבוה!', 'ספיד!'][combo % 4]!
  }
  if (combo >= 6) {
    return ['בוער! 🔥', 'מכונה!', 'אין עליך!', 'רצף מטורף!'][combo % 4]!
  }
  return ['בול!', 'יפה!', 'קטן עליך!', 'מצוין!', 'חד!', 'אלוף!'][combo % 6]!
}

export const PRAISE_WORDS = ['בול!', 'יפה!', 'קטן עליך!', 'מצוין!', 'חד!'] as const
export const HOT_PRAISE = ['בוער! 🔥', 'מכונה!', 'אין עליך!'] as const
