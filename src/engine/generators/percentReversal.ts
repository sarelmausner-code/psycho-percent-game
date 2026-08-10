import type { Generator } from '../types'
import type { RNG } from '../rng'

/** After disc% off, price is paid. What was original? */
export const percentReversal: Generator = {
  id: 'percent_reversal_v1',
  topic: 'percentages',
  subtopic: 'reverse_percentage',

  generate(rng: RNG) {
    const disc = rng.pick([10, 15, 20, 25, 40])
    const orig = rng.pick([200, 250, 300, 400, 500, 800])
    const paid = orig * (1 - disc / 100)

    return {
      narrativeKey: 'q.percent_reversal',
      params: { disc, paid },
      answer: orig,
      distractors: [
        {
          value: clampBand(round2(paid * (1 + disc / 100)), orig),
          errorMode: 'applied_to_wrong_base',
        },
        {
          value: clampBand(round2(paid + disc * 5), orig), // shekel confusion, scaled
          errorMode: 'shekels_not_percent',
        },
        {
          value: clampBand(round2(paid * 1.1), orig),
          errorMode: 'guessed_round_up',
        },
      ],
      solutionKey: 'sol.percent_reversal',
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
