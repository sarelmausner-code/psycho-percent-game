import type { Generator } from '../types'
import type { RNG } from '../rng'
import {
  cleanNum,
  pickByDifficulty,
  type Difficulty,
  uniquePlausible,
} from '../difficulty'

/** Two successive discounts — classic additive trap. */
export const successivePercent: Generator = {
  id: 'successive_percent_v1',
  topic: 'percentages',
  subtopic: 'successive_percent',

  generate(rng: RNG, difficulty = 2) {
    const d = Math.max(1, Math.min(5, difficulty)) as Difficulty

    const start = pickByDifficulty(
      rng,
      [200, 400, 500],
      [250, 300, 480, 600],
      [280, 360, 450, 560, 800],
      d,
    )
    const a = pickByDifficulty(rng, [10, 20], [10, 15, 20, 25], [12, 15, 20, 25, 30], d)
    const b = pickByDifficulty(rng, [10, 20], [10, 15, 20, 25], [5, 10, 15, 20, 30], d)

    const answer = cleanNum(start * (1 - a / 100) * (1 - b / 100))
    // THE trap: a% + b% off the original
    const additiveTrap = cleanNum(start * (1 - (a + b) / 100))
    const onlyFirst = cleanNum(start * (1 - a / 100))
    const onlySecond = cleanNum(start * (1 - b / 100))
    const thenIncrease = cleanNum(start * (1 - a / 100) * (1 + b / 100))
    const reverseOrderSame = cleanNum(start * (1 - b / 100) * (1 - a / 100)) // same as answer — filtered
    const applyBothOnStartAbs = cleanNum(start - (start * a) / 100 - (start * b) / 100)

    const candidates = [
      { value: additiveTrap, errorMode: 'additive_percent' },
      { value: applyBothOnStartAbs, errorMode: 'additive_percent' },
      { value: onlyFirst, errorMode: 'forgot_final_step' },
      { value: onlySecond, errorMode: 'forgot_final_step' },
      { value: thenIncrease, errorMode: 'sign_flip' },
      { value: reverseOrderSame, errorMode: 'guessed_round_up' },
      { value: cleanNum(start * (1 - Math.max(a, b) / 100)), errorMode: 'answered_wrong_quantity' },
      { value: cleanNum(answer * 1.1), errorMode: 'guessed_round_up' },
      { value: cleanNum(answer * 0.9), errorMode: 'guessed_round_up' },
    ]

    return {
      narrativeKey: rng.pick(['q.successive_a', 'q.successive_b', 'q.successive_c']),
      params: { start, a, b },
      answer,
      distractors: uniquePlausible(answer, candidates),
      solutionKey: 'sol.successive',
      timeTargetSec: d <= 3 ? 42 : 52,
    }
  },
}
