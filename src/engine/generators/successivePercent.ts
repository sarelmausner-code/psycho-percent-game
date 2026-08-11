import type { Generator } from '../types'
import type { RNG } from '../rng'
import {
  cleanNum,
  pickByDifficulty,
  type Difficulty,
  uniquePlausible,
} from '../difficulty'

/**
 * Two successive changes: start → after a% then b%. Final value or net %?
 * We ask for the final price after two discounts/changes.
 */
export const successivePercent: Generator = {
  id: 'successive_percent_v1',
  topic: 'percentages',
  subtopic: 'successive_percent',

  generate(rng: RNG, difficulty = 2) {
    const d = Math.max(1, Math.min(5, difficulty)) as Difficulty

    const start = pickByDifficulty(
      rng,
      [200, 400, 500],
      [250, 300, 480],
      [280, 360, 450, 600],
      d,
    )
    const a = pickByDifficulty(rng, [10, 20], [10, 15, 20], [12, 15, 25], d)
    const b = pickByDifficulty(rng, [10, 20], [10, 15, 25], [5, 12, 20, 30], d)

    // Both discounts (most common PET trap: add percents)
    const answer = cleanNum(start * (1 - a / 100) * (1 - b / 100))
    const additiveTrap = cleanNum(start * (1 - (a + b) / 100))
    const onlyFirst = cleanNum(start * (1 - a / 100))
    const onlySecond = cleanNum(start * (1 - b / 100))
    const wrongOrderAdd = cleanNum(start - ((start * a) / 100 + (start * b) / 100))
    const applyOnWrong = cleanNum(start * (1 - a / 100) * (1 + b / 100))

    const candidates = [
      { value: additiveTrap, errorMode: 'additive_percent' },
      { value: onlyFirst, errorMode: 'forgot_final_step' },
      { value: onlySecond, errorMode: 'forgot_final_step' },
      { value: wrongOrderAdd, errorMode: 'additive_percent' },
      { value: applyOnWrong, errorMode: 'sign_flip' },
      { value: cleanNum(start * (1 - Math.max(a, b) / 100)), errorMode: 'answered_wrong_quantity' },
    ]

    return {
      narrativeKey: rng.pick(['q.successive_a', 'q.successive_b', 'q.successive_c']),
      params: { start, a, b },
      answer,
      distractors: uniquePlausible(answer, candidates),
      solutionKey: 'sol.successive',
      timeTargetSec: d <= 3 ? 42 : 50,
    }
  },
}
