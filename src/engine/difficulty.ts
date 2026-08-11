import type { RNG } from './rng'

/** 1 = easy · 5 = hard (PET-style pressure) */
export type Difficulty = 1 | 2 | 3 | 4 | 5

export function clampDifficulty(n: number): Difficulty {
  return Math.max(1, Math.min(5, Math.round(n))) as Difficulty
}

/** Stage base + ramp within the stage so later questions feel harder. */
export function questionDifficulty(
  stageBase: number,
  index: number,
  total: number,
): Difficulty {
  const ramp = total <= 1 ? 0 : (index / (total - 1)) * 1.6
  return clampDifficulty(stageBase + ramp)
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function cleanNum(n: number): number {
  const r = round2(n)
  return Object.is(r, -0) ? 0 : r
}

/** True if distractor is close enough to look plausible (not giveaway). */
export function isPlausibleDistractor(value: number, answer: number): boolean {
  if (!Number.isFinite(value) || value === answer) return false
  if (answer === 0) return Math.abs(value) > 0
  const r = Math.abs(value / answer)
  // Tighter than before: traps should sit near the correct answer
  return r >= 0.45 && r <= 2.4
}

export function uniquePlausible(
  answer: number,
  candidates: { value: number; errorMode: string }[],
): { value: number; errorMode: string }[] {
  const out: { value: number; errorMode: string }[] = []
  const seen = new Set<number>([cleanNum(answer)])
  for (const c of candidates) {
    const v = cleanNum(c.value)
    if (seen.has(v)) continue
    if (!isPlausibleDistractor(v, answer)) continue
    seen.add(v)
    out.push({ value: v, errorMode: c.errorMode })
    if (out.length >= 3) break
  }
  // Soft fallbacks only if we still need options — still near the answer
  let k = 0
  while (out.length < 3 && k < 12) {
    k++
    const factor = [0.85, 1.15, 0.7, 1.3, 0.9, 1.2][k % 6]!
    const v = cleanNum(answer * factor + (k % 2 === 0 ? 1 : -1) * (k + 1))
    if (seen.has(v) || !isPlausibleDistractor(v, answer)) continue
    seen.add(v)
    out.push({ value: v, errorMode: 'guessed_round_up' })
  }
  return out.slice(0, 3)
}

/** Pick among options with slight bias to later (harder) ones when difficulty high. */
export function pickByDifficulty<T>(rng: RNG, easy: T[], mid: T[], hard: T[], d: Difficulty): T {
  if (d <= 1) return rng.pick(easy.length ? easy : mid)
  if (d === 2) return rng.pick([...easy, ...mid])
  if (d === 3) return rng.pick(mid.length ? mid : [...easy, ...hard])
  if (d === 4) return rng.pick([...mid, ...hard])
  return rng.pick(hard.length ? hard : mid)
}
