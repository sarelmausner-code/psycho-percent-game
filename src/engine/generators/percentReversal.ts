import type { Generator } from '../types'
import type { RNG } from '../rng'
import {
  cleanNum,
  isOverlyRoundAnswer,
  pickByDifficulty,
  type Difficulty,
  uniquePlausible,
} from '../difficulty'

/**
 * After disc% off → paid. Original price?
 * Original (answer) is integer; distractors snapped to integers too.
 * Avoid answer always being 200/300/400/500.
 */
export const percentReversal: Generator = {
  id: 'percent_reversal_v1',
  topic: 'percentages',
  subtopic: 'reverse_percentage',

  generate(rng: RNG, difficulty = 1) {
    const d = Math.max(1, Math.min(5, difficulty)) as Difficulty

    // [disc, orig] with integer paid = orig * (1 - disc/100)
    const easyPairs: [number, number][] = [
      [20, 250],
      [20, 150],
      [25, 160],
      [25, 240],
      [10, 180],
      [10, 240],
      [15, 200],
      [20, 175],
    ]
    const midPairs: [number, number][] = [
      [20, 280],
      [25, 280],
      [15, 240],
      [30, 200],
      [20, 360],
      [25, 320],
      [10, 360],
      [40, 250],
      [15, 280],
      [12, 250], // paid may be decimal — filter below
    ]
    const hardPairs: [number, number][] = [
      [20, 320],
      [25, 360],
      [30, 280],
      [15, 360],
      [40, 280],
      [20, 440],
      [25, 440],
      [10, 480],
      [35, 200],
      [15, 320],
      [30, 360],
    ]

    let disc: number
    let orig: number
    let paid: number
    let tries = 0
    do {
      ;[disc, orig] = pickByDifficulty(rng, easyPairs, midPairs, hardPairs, d)
      paid = cleanNum(orig * (1 - disc / 100))
      tries++
    } while (
      tries < 14 &&
      (!Number.isInteger(paid) ||
        !Number.isInteger(orig) ||
        (d >= 2 && isOverlyRoundAnswer(orig)))
    )

    const answer = orig

    // Traps that land on integers near orig
    const wrongBase = paid * (1 + disc / 100) // classic
    const candidates = [
      { value: wrongBase, errorMode: 'applied_to_wrong_base' },
      { value: paid / (1 + disc / 100), errorMode: 'sign_flip' },
      { value: paid + (orig * disc) / 100, errorMode: 'shekels_not_percent' },
      { value: paid + disc * 5, errorMode: 'shekels_not_percent' },
      { value: paid / (1 - (disc + 5) / 100), errorMode: 'forgot_final_step' },
      { value: paid / (1 - Math.max(5, disc - 5) / 100), errorMode: 'forgot_final_step' },
      { value: orig + 20, errorMode: 'guessed_round_up' },
      { value: orig - 20, errorMode: 'guessed_round_up' },
      { value: orig + 40, errorMode: 'guessed_round_up' },
      { value: orig - 40, errorMode: 'guessed_round_up' },
      { value: paid * 1.25, errorMode: 'guessed_round_up' },
      { value: paid * 1.1, errorMode: 'applied_to_wrong_base' },
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
