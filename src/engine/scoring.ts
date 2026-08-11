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

export type PraiseKind =
  | 'speed_lightning'
  | 'speed_fast'
  | 'combo_hot'
  | 'combo_mid'
  | 'recovery'
  | 'milestone'
  | 'progress'
  | 'hard_clear'
  | 'standard'

export function comboMultiplier(combo: number): number {
  if (combo >= 9) return 4
  if (combo >= 6) return 3
  if (combo >= 3) return 2
  return 1
}

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
  difficulty = 1,
): { total: number; base: number; speed: number; mult: number; tier: SpeedTier } {
  const tier = speedTier(ms, targetSec)
  if (!correct) return { total: 0, base: 0, speed: 0, mult: 1, tier }
  const mult = comboMultiplier(comboBefore + 1)
  const base = 90 + difficulty * 14
  const speed = speedBonusPoints(tier)
  return { total: (base + speed) * mult, base, speed, mult, tier }
}

export function toTrainingScore(totalPoints: number, accuracy: number): number {
  const raw = 200 + Math.round(totalPoints * 0.28 + accuracy * 250)
  return Math.max(200, Math.min(800, raw))
}

export function starsForStage(accuracy: number, avgMs: number, avgTargetSec: number): 1 | 2 | 3 {
  if (accuracy >= 0.8 && avgMs <= avgTargetSec * 1000 * 0.7) return 3
  if (accuracy >= 0.8) return 2
  return 1
}

const BANK: Record<PraiseKind, string[]> = {
  speed_lightning: ['Lightning! ⚡', 'Pilot pilot!', 'Insane! 🚀', 'Flash!', 'Sonic!'],
  speed_fast: ['Fast! 💨', 'Snappy!', 'High tempo!', 'Speed!', 'Sharp!'],
  combo_hot: ['On fire! 🔥', 'Machine!', 'Unstoppable!', 'Crazy streak!', 'In the zone!'],
  combo_mid: ['Streak lives!', 'Keep it!', 'One more!', 'Tempo up!'],
  recovery: ['Comeback! 💪', 'Back strong!', 'Only forward!', 'Clean fix!'],
  milestone: ['Checkpoint! ⭐', 'Level up feel!', 'Progress!', 'Stepping up!'],
  progress: ['Step forward!', 'Learning!', 'Getting better!', 'Brick in the wall!'],
  hard_clear: ['Tough one! 🧠', 'Hard mode OK!', 'Brain win!', 'Clutch!'],
  standard: ['Nailed it!', 'Nice!', 'Easy for you!', 'Great!', 'Sharp!', 'Champ!', 'Correct!', 'Well done!'],
}

// Hebrew UI still uses Hebrew copy in he.json for questions; praise can stay mixed.
// Keep Hebrew variants for in-game feel matching the app language:
const BANK_HE: Record<PraiseKind, string[]> = {
  speed_lightning: ['ברק! ⚡', 'טייס!', 'מטורף! 🚀', 'הבזק!', 'סופר-סאוני!'],
  speed_fast: ['מהיר! 💨', 'זריז!', 'קצב גבוה!', 'ספיד!', 'חד כמו סכין!'],
  combo_hot: ['בוער! 🔥', 'מכונה!', 'אין עליך!', 'רצף מטורף!', 'על הגל!'],
  combo_mid: ['רצף חי!', 'נשמרים!', 'עוד אחד!', 'הקצב עולה!'],
  recovery: ['קאמבק! 💪', 'חזרת חזק!', 'מכאן רק קדימה!', 'תיקון מושלם!'],
  milestone: ['ציון דרך! ⭐', 'רמה למעלה!', 'התקדמות!', 'עולים מדרגה!'],
  progress: ['צעד קדימה!', 'לומדים!', 'השתפרת!', 'עוד לבנה בחומה!'],
  hard_clear: ['קשה — ועברת! 🧠', 'שאלה כבדה!', 'ראש טוב!', 'קלאץ׳!'],
  standard: ['בול!', 'יפה!', 'קטן עליך!', 'מצוין!', 'חד!', 'אלוף!', 'נכון!', 'כל הכבוד!'],
}

export function pickPraiseDetailed(input: {
  combo: number
  tier: SpeedTier
  recovered: boolean
  questionIndex: number
  totalQuestions: number
  difficulty?: number
  recent?: string[]
}): { text: string; kind: PraiseKind } {
  const {
    combo,
    tier,
    recovered,
    questionIndex,
    totalQuestions,
    difficulty = 1,
    recent = [],
  } = input

  let kind: PraiseKind = 'standard'
  if (recovered) kind = 'recovery'
  else if (difficulty >= 4 && tier !== 'slow') kind = 'hard_clear'
  else if (tier === 'lightning') kind = 'speed_lightning'
  else if (tier === 'fast') kind = 'speed_fast'
  else if (combo >= 6) kind = 'combo_hot'
  else if (combo >= 3) kind = 'combo_mid'
  else if (questionIndex > 0 && (questionIndex + 1) % 3 === 0) kind = 'milestone'
  else if (questionIndex >= Math.floor(totalQuestions * 0.5)) kind = 'progress'

  const pool = BANK_HE[kind]
  const fresh = pool.filter((p) => !recent.includes(p))
  const list = fresh.length ? fresh : pool
  const text = list[(combo + questionIndex + difficulty) % list.length]!
  return { text, kind }
}

export function pickPraise(combo: number, tier: SpeedTier): string {
  return pickPraiseDetailed({
    combo,
    tier,
    recovered: false,
    questionIndex: combo,
    totalQuestions: 8,
  }).text
}

export const PRAISE_WORDS = BANK_HE.standard
export const HOT_PRAISE = BANK_HE.combo_hot

// silence unused EN bank warning if tree-shaken poorly
void BANK
