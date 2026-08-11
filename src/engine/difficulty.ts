import type { RNG } from './rng'

/** 1 = easy · 5 = hard (PET-style pressure) */
export type Difficulty = 1 | 2 | 3 | 4 | 5

export function clampDifficulty(n: number): Difficulty {
  return Math.max(1, Math.min(5, Math.round(n))) as Difficulty
}

export function questionDifficulty(
  stageBase: number,
  index: number,
  total: number,
): Difficulty {
  const progress = total <= 1 ? 0 : index / (total - 1)
  const ramp = progress < 0.4 ? progress * 0.8 : 0.32 + (progress - 0.4) * 2.2
  return clampDifficulty(stageBase + ramp)
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function cleanNum(n: number): number {
  const r = round2(n)
  return Object.is(r, -0) ? 0 : r
}

/** How "pretty" a number looks (higher = rounder / more tempting as MCQ). */
export function roundness(n: number): number {
  const x = Math.abs(cleanNum(n))
  if (!Number.isFinite(x)) return -99
  if (!Number.isInteger(x)) return -1 // decimals look messier than ints
  if (x % 100 === 0) return 4
  if (x % 50 === 0) return 3
  if (x % 25 === 0) return 2
  if (x % 10 === 0) return 1
  if (x % 5 === 0) return 0
  return -0.5
}

/**
 * Force distractor to the same visual family as the answer:
 * - integer answer → integer distractor
 * - 1-decimal answer → 1-decimal distractor
 * - else → 2 decimals
 */
export function matchAnswerStyle(value: number, answer: number): number {
  const a = cleanNum(answer)
  const v = cleanNum(value)
  if (Number.isInteger(a)) return Math.round(v)
  // one decimal?
  if (Number.isInteger(a * 10)) return Math.round(v * 10) / 10
  return round2(v)
}

export function isPlausibleDistractor(value: number, answer: number): boolean {
  if (!Number.isFinite(value) || value === answer) return false
  if (answer === 0) return Math.abs(value) > 0
  const r = Math.abs(value / answer)
  return r >= 0.55 && r <= 1.85
}

/**
 * Build 3 distractors that:
 * 1) sit near the answer (tempting)
 * 2) match the answer's integer/decimal style (no "only correct is clean")
 * 3) prefer similar roundness so the eye can't pick the pretty number
 */
export function uniquePlausible(
  answer: number,
  candidates: { value: number; errorMode: string }[],
): { value: number; errorMode: string }[] {
  const ans = cleanNum(answer)
  const ansRound = roundness(ans)
  const out: { value: number; errorMode: string }[] = []
  const seen = new Set<number>([ans])

  const styled = candidates.map((c) => ({
    value: matchAnswerStyle(c.value, ans),
    errorMode: c.errorMode,
  }))

  // Prefer close + similar roundness (not much uglier than the answer)
  const ranked = [...styled].sort((a, b) => {
    const ra = roundness(a.value)
    const rb = roundness(b.value)
    // Prefer not much less round than answer
    const roundPenaltyA = Math.max(0, ansRound - ra)
    const roundPenaltyB = Math.max(0, ansRound - rb)
    if (roundPenaltyA !== roundPenaltyB) return roundPenaltyA - roundPenaltyB
    return Math.abs(a.value - ans) - Math.abs(b.value - ans)
  })

  for (const c of ranked) {
    const v = c.value
    if (seen.has(v)) continue
    if (!isPlausibleDistractor(v, ans)) continue
    // Reject distractors that are far uglier than the answer (decimals vs round int)
    if (Number.isInteger(ans) && !Number.isInteger(v)) continue
    if (roundness(v) < ansRound - 2) continue
    seen.add(v)
    out.push({ value: v, errorMode: c.errorMode })
    if (out.length >= 3) break
  }

  // Integer near-miss ladder when answer is int — keeps all options clean
  if (Number.isInteger(ans)) {
    const deltas = buildIntegerDeltas(ans)
    const modes = [
      'applied_to_wrong_base',
      'forgot_final_step',
      'shekels_not_percent',
      'guessed_round_up',
      'sign_flip',
      'additive_percent',
    ]
    let mi = 0
    for (const delta of deltas) {
      if (out.length >= 3) break
      for (const sign of [1, -1] as const) {
        const v = ans + sign * delta
        if (v <= 0 && ans > 0) continue
        if (seen.has(v) || !isPlausibleDistractor(v, ans)) continue
        // Prefer distractors at least as "round-looking" as possible
        if (roundness(v) < ansRound - 2) continue
        seen.add(v)
        out.push({ value: v, errorMode: modes[mi % modes.length]! })
        mi++
        if (out.length >= 3) break
      }
    }
  }

  // Factor near-misses, then style-match
  const factors = [0.8, 1.2, 0.9, 1.1, 0.75, 1.25, 0.85, 1.15]
  let fi = 0
  while (out.length < 3 && fi < factors.length) {
    const v = matchAnswerStyle(ans * factors[fi++]!, ans)
    if (seen.has(v) || !isPlausibleDistractor(v, ans)) continue
    if (Number.isInteger(ans) && !Number.isInteger(v)) continue
    seen.add(v)
    out.push({ value: v, errorMode: 'guessed_round_up' })
  }

  // Absolute last resort
  let step = 1
  while (out.length < 3 && step < 40) {
    const delta = Number.isInteger(ans)
      ? Math.max(1, Math.round(Math.abs(ans) * 0.05 * step) || step)
      : cleanNum(Math.abs(ans) * 0.05 * step)
    for (const sign of [1, -1] as const) {
      const v = matchAnswerStyle(ans + sign * delta, ans)
      if (seen.has(v) || !isPlausibleDistractor(v, ans)) continue
      if (Number.isInteger(ans) && !Number.isInteger(v)) continue
      seen.add(v)
      out.push({ value: v, errorMode: 'guessed_round_up' })
      if (out.length >= 3) break
    }
    step++
  }

  return out.slice(0, 3)
}

/** Deltas that often produce similarly-round integers near `ans`. */
function buildIntegerDeltas(ans: number): number[] {
  const a = Math.abs(ans)
  const out: number[] = []
  const candidates = [
    Math.round(a * 0.1),
    Math.round(a * 0.2),
    Math.round(a * 0.15),
    Math.round(a * 0.05),
    Math.round(a * 0.25),
    5,
    10,
    20,
    25,
    50,
    40,
    30,
    15,
    8,
    12,
    16,
    24,
  ]
  for (const c of candidates) {
    if (c > 0 && !out.includes(c)) out.push(c)
  }
  return out.sort((x, y) => x - y)
}

/**
 * Prefer answers that aren't "too pretty" alone (multiples of 100).
 * Still integers for clean MCQ.
 */
export function isOverlyRoundAnswer(n: number): boolean {
  const x = Math.abs(cleanNum(n))
  return Number.isInteger(x) && x >= 50 && x % 100 === 0
}

export function pickByDifficulty<T>(
  rng: RNG,
  easy: T[],
  mid: T[],
  hard: T[],
  d: Difficulty,
): T {
  if (d <= 1) return rng.pick(easy.length ? easy : mid)
  if (d === 2) return rng.pick([...easy, ...mid])
  if (d === 3) return rng.pick([...mid, ...(hard.length ? hard : mid)])
  if (d === 4) return rng.pick([...mid, ...hard])
  return rng.pick(hard.length ? [...hard, ...hard, ...mid] : mid)
}
