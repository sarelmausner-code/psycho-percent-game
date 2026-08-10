import type { Generator } from '../types'
import type { RNG } from '../rng'

/** What is X% of Y? */
export const percentOf: Generator = {
  id: 'percent_of_v1',
  topic: 'percentages',
  subtopic: 'percent_of',

  generate(rng: RNG) {
    const pct = rng.pick([10, 15, 20, 25, 30, 40, 50])
    const base = rng.pick([80, 120, 150, 200, 240, 300, 400, 500])
    const answer = (base * pct) / 100

    // Distractors stay in ~0.3×–3× of answer while encoding real error modes
    const d1 = round2(answer * (1 + pct / 100)) // re-applied % on result
    const d2 = round2(answer + pct) // mixed shekels with percent points
    // "forgot final step": used pct/10 instead of pct/100 → 10× too big; scale into band
    let d3 = round2(base * (pct / 10) / 10) // same as answer actually...
    // Off-by factor: computed (pct+10)% instead
    d3 = round2((base * (pct + 10)) / 100)
    if (d3 === answer) d3 = round2(answer * 1.5)

    return {
      narrativeKey: 'q.percent_of',
      params: { pct, base },
      answer,
      distractors: [
        { value: clampBand(d1, answer), errorMode: 'applied_to_wrong_base' },
        { value: clampBand(d2, answer), errorMode: 'shekels_not_percent' },
        { value: clampBand(d3, answer), errorMode: 'forgot_final_step' },
      ],
      solutionKey: 'sol.percent_of',
      timeTargetSec: 30,
    }
  },
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

/** Keep distractor distinct and within 0.35×–2.9× of answer. */
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
