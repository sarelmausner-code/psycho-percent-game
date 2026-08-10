import type { Generator } from '../types'
import type { RNG } from '../rng'

/** From old to new — what % change? */
export const percentChange: Generator = {
  id: 'percent_change_v1',
  topic: 'percentages',
  subtopic: 'percent_change',

  generate(rng: RNG) {
    const oldVal = rng.pick([100, 150, 200, 250, 400, 500])
    const changePct = rng.pick([10, 20, 25, 40, 50])
    const up = rng.pick([true, false])
    const newVal = up
      ? oldVal * (1 + changePct / 100)
      : oldVal * (1 - changePct / 100)
    const absAnswer = changePct

    const wrongBase = Math.round((Math.abs(newVal - oldVal) / newVal) * 100)
    const shekelTrap = Math.round(Math.abs(newVal - oldVal) / (oldVal / 20)) // scaled into band
    const signish = absAnswer === 10 ? 20 : absAnswer - 5

    return {
      narrativeKey: up ? 'q.percent_change_up' : 'q.percent_change_down',
      params: { oldVal, newVal },
      answer: absAnswer,
      distractors: [
        { value: clampBand(shekelTrap || absAnswer + 5, absAnswer), errorMode: 'shekels_not_percent' },
        { value: clampBand(wrongBase || absAnswer + 8, absAnswer), errorMode: 'applied_to_wrong_base' },
        { value: clampBand(signish, absAnswer), errorMode: 'sign_flip' },
      ],
      solutionKey: 'sol.percent_change',
      timeTargetSec: 35,
    }
  },
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

function clampBand(v: number, answer: number): number {
  let x = round2(v)
  const lo = round2(Math.abs(answer) * 0.35)
  const hi = round2(Math.abs(answer) * 2.9)
  if (x === answer) x = round2(answer * 1.25)
  if (Math.abs(x) < lo) x = lo === answer ? round2(answer * 1.4) : lo
  if (Math.abs(x) > hi) x = hi === answer ? round2(answer * 0.6) : hi
  if (x === answer) x = round2(answer + Math.max(1, Math.abs(answer) * 0.2))
  return x
}
