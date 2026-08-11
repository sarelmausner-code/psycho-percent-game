import type { Generator } from '../types'
import type { RNG } from '../rng'
import {
  cleanNum,
  pickByDifficulty,
  type Difficulty,
  uniquePlausible,
} from '../difficulty'

/** After disc% off, price is paid. What was original? */
export const percentReversal: Generator = {
  id: 'percent_reversal_v1',
  topic: 'percentages',
  subtopic: 'reverse_percentage',

  generate(rng: RNG, difficulty = 1) {
    const d = Math.max(1, Math.min(5, difficulty)) as Difficulty

    const disc = pickByDifficulty(
      rng,
      [10, 15, 20, 25],
      [12, 15, 20, 25, 30, 40],
      [8, 12, 18, 24, 28, 35, 45],
      d,
    )

    // Choose original so paid is not always a "pretty" round number at higher d
    const orig = pickByDifficulty(
      rng,
      [200, 250, 300, 400, 500],
      [240, 280, 360, 450, 600],
      [220, 280, 320, 375, 440, 560, 720],
      d,
    )

    const paid = cleanNum(orig * (1 - disc / 100))
    const answer = orig

    // Classic trap: add % onto discounted price — very close to truth
    const wrongBase = cleanNum(paid * (1 + disc / 100))
    const signFlip = cleanNum(paid / (1 + disc / 100))
    const addDiscountAbs = cleanNum(paid + (orig * disc) / 100)
    const addPoints = cleanNum(paid + disc * 2)
    const overDisc = cleanNum(paid / (1 - (disc + 5) / 100))
    const underDisc = cleanNum(paid / (1 - Math.max(5, disc - 5) / 100))
    const guess = cleanNum(paid * 1.2)

    const candidates = [
      { value: wrongBase, errorMode: 'applied_to_wrong_base' },
      { value: signFlip, errorMode: 'sign_flip' },
      { value: addDiscountAbs, errorMode: 'shekels_not_percent' },
      { value: addPoints, errorMode: 'shekels_not_percent' },
      { value: overDisc, errorMode: 'forgot_final_step' },
      { value: underDisc, errorMode: 'forgot_final_step' },
      { value: guess, errorMode: 'guessed_round_up' },
      { value: cleanNum(paid / (disc / 100) / 10), errorMode: 'inverted_ratio' },
    ]

    const narratives =
      d <= 2
        ? ['q.percent_reversal_a', 'q.percent_reversal_b', 'q.percent_reversal_c']
        : [
            'q.percent_reversal_b',
            'q.percent_reversal_c',
            'q.percent_reversal_d',
            'q.percent_reversal_e',
          ]

    return {
      narrativeKey: rng.pick(narratives),
      params: { disc, paid },
      answer,
      distractors: uniquePlausible(answer, candidates),
      solutionKey: 'sol.percent_reversal',
      timeTargetSec: d <= 2 ? 34 : d <= 4 ? 40 : 48,
    }
  },
}
