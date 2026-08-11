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
      [10, 20, 25],
      [15, 20, 30, 40],
      [12, 18, 24, 35, 45],
      d,
    )

    const orig = pickByDifficulty(
      rng,
      [200, 400, 500, 250],
      [300, 360, 480, 600],
      [280, 320, 450, 560, 720],
      d,
    )

    const paid = cleanNum(orig * (1 - disc / 100))
    const answer = orig

    // Classic trap: add % back onto the discounted price
    const wrongBase = cleanNum(paid * (1 + disc / 100))
    // Treat discount points as shekels
    const shekelTrap = cleanNum(paid + disc)
    const shekelTrap2 = cleanNum(paid + (orig * disc) / 100) // add absolute discount again
    // Forget and use paid / (disc/100)
    const inverted = cleanNum(paid / (disc / 100))
    // Use 100+disc instead of 100-disc
    const signFlip = cleanNum(paid / (1 + disc / 100))
    // Round-ish guess
    const roundUp = cleanNum(paid * 1.25)

    const candidates = [
      { value: wrongBase, errorMode: 'applied_to_wrong_base' },
      { value: shekelTrap2, errorMode: 'shekels_not_percent' },
      { value: shekelTrap, errorMode: 'shekels_not_percent' },
      { value: signFlip, errorMode: 'sign_flip' },
      { value: inverted, errorMode: 'inverted_ratio' },
      { value: roundUp, errorMode: 'guessed_round_up' },
      { value: cleanNum(paid / (1 - (disc + 5) / 100)), errorMode: 'forgot_final_step' },
    ]

    const narratives =
      d <= 2
        ? ['q.percent_reversal_a', 'q.percent_reversal_b']
        : ['q.percent_reversal_b', 'q.percent_reversal_c', 'q.percent_reversal_d', 'q.percent_reversal_e']

    return {
      narrativeKey: rng.pick(narratives),
      params: { disc, paid },
      answer,
      distractors: uniquePlausible(answer, candidates),
      solutionKey: 'sol.percent_reversal',
      timeTargetSec: d <= 2 ? 36 : d <= 4 ? 42 : 48,
    }
  },
}
