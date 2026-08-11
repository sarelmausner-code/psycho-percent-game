import type { Generator } from '../types'
import type { RNG } from '../rng'
import {
  cleanNum,
  pickByDifficulty,
  type Difficulty,
  uniquePlausible,
} from '../difficulty'

/** What percent is part of whole? */
export const percentIs: Generator = {
  id: 'percent_is_v1',
  topic: 'percentages',
  subtopic: 'percent_is',

  generate(rng: RNG, difficulty = 1) {
    const d = Math.max(1, Math.min(5, difficulty)) as Difficulty

    const pct = pickByDifficulty(
      rng,
      [10, 20, 25, 50],
      [15, 30, 40, 12],
      [18, 24, 35, 45, 16],
      d,
    )
    const whole = pickByDifficulty(
      rng,
      [100, 200, 400, 500],
      [160, 250, 300, 450],
      [180, 240, 360, 480],
      d,
    )
    const part = cleanNum((whole * pct) / 100)
    const answer = pct

    const candidates = [
      { value: cleanNum((whole / part) * 10), errorMode: 'inverted_ratio' },
      { value: cleanNum((part / whole) * 10), errorMode: 'forgot_final_step' }, // forgot *100 / off scale
      { value: cleanNum(100 - pct), errorMode: 'answered_wrong_quantity' },
      { value: cleanNum((whole / part) * 100), errorMode: 'inverted_ratio' },
      { value: cleanNum(part), errorMode: 'shekels_not_percent' },
      { value: cleanNum(pct + 10), errorMode: 'guessed_round_up' },
      { value: cleanNum((part / (whole - part)) * 100), errorMode: 'applied_to_wrong_base' },
    ]

    const narratives = ['q.percent_is_a', 'q.percent_is_b', 'q.percent_is_c', 'q.percent_is_d']

    return {
      narrativeKey: rng.pick(narratives),
      params: { part, whole },
      answer,
      distractors: uniquePlausible(answer, candidates),
      solutionKey: 'sol.percent_is',
      timeTargetSec: d <= 2 ? 34 : 40,
    }
  },
}
