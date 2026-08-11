import type { RNG } from './rng'

/** 1 = easy · 5 = hard (PET-style pressure) */
export type Difficulty = 1 | 2 | 3 | 4 | 5

export function clampDifficulty(n: number): Difficulty {
  return Math.max(1, Math.min(5, Math.round(n))) as Difficulty
}

/**
 * Stage base + ramp within the stage.
 * Second half of a stage always feels a notch harder.
 */
export function questionDifficulty(
  stageBase: number,
  index: number,
  total: number,
): Difficulty {
  const progress = total <= 1 ? 0 : index / (total - 1)
  // Steeper mid-stage climb so players feel progression every run
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

/**
 * Distractors must look tempting — close to the correct answer.
 * Too far = giveaway. Equal = invalid.
 */
export function isPlausibleDistractor(value: number, answer: number): boolean {
  if (!Number.isFinite(value) || value === answer) return false
  if (answer === 0) return Math.abs(value) > 0
  const r = Math.abs(value / answer)
  return r >= 0.55 && r <= 1.85
}

/**
 * Prefer authentic error-mode candidates that sit near the answer.
 * Fallbacks still look like near-misses (not wild numbers).
 */
export function uniquePlausible(
  answer: number,
  candidates: { value: number; errorMode: string }[],
): { value: number; errorMode: string }[] {
  const out: { value: number; errorMode: string }[] = []
  const seen = new Set<number>([cleanNum(answer)])

  // Prefer closer traps first
  const ranked = [...candidates].sort((a, b) => {
    const da = Math.abs(cleanNum(a.value) - answer)
    const db = Math.abs(cleanNum(b.value) - answer)
    return da - db
  })

  for (const c of ranked) {
    const v = cleanNum(c.value)
    if (seen.has(v)) continue
    if (!isPlausibleDistractor(v, answer)) continue
    seen.add(v)
    out.push({ value: v, errorMode: c.errorMode })
    if (out.length >= 3) break
  }

  // Near-miss fallbacks (still multiple-choice hard)
  const nearMisses = [
    { f: 0.8, mode: 'forgot_final_step' },
    { f: 1.2, mode: 'applied_to_wrong_base' },
    { f: 0.9, mode: 'guessed_round_up' },
    { f: 1.1, mode: 'guessed_round_up' },
    { f: 0.75, mode: 'forgot_final_step' },
    { f: 1.25, mode: 'applied_to_wrong_base' },
    { f: 2 / 3, mode: 'inverted_ratio' },
    { f: 1.5, mode: 'shekels_not_percent' },
  ]
  let k = 0
  while (out.length < 3 && k < nearMisses.length) {
    const m = nearMisses[k++]!
    let v = cleanNum(answer * m.f)
    if (Number.isInteger(answer) && !Number.isInteger(v)) {
      v = Math.round(v)
    }
    if (seen.has(v) || !isPlausibleDistractor(v, answer)) continue
    seen.add(v)
    out.push({ value: v, errorMode: m.mode })
  }

  // Last resort: offset by ~10–20% of magnitude
  let step = 1
  while (out.length < 3 && step < 20) {
    const delta = Math.max(1, Math.round(Math.abs(answer) * 0.1 * step))
    for (const sign of [1, -1]) {
      const v = cleanNum(answer + sign * delta)
      if (seen.has(v) || !isPlausibleDistractor(v, answer)) continue
      seen.add(v)
      out.push({ value: v, errorMode: 'guessed_round_up' })
      if (out.length >= 3) break
    }
    step++
  }

  return out.slice(0, 3)
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
  // d5: mostly hard, occasional mid
  return rng.pick(hard.length ? [...hard, ...hard, ...mid] : mid)
}
