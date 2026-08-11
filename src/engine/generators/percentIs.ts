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
      [10, 15, 20, 25, 40, 50],
      [12, 15, 18, 30, 35, 45],
      [8, 16, 18, 24, 28, 32, 36],
      d,
    )
    const whole = pickByDifficulty(
      rng,
      [100, 200, 250, 400, 500],
      [160, 200, 240, 300, 450],
      [180, 250, 320, 360, 480],
      d,
    )
    const part = cleanNum((whole * pct) / 100)
    const answer = pct

    const candidates = [
      { value: cleanNum(100 - pct), errorMode: 'answered_wrong_quantity' },
      { value: cleanNum(pct + 10), errorMode: 'guessed_round_up' },
      { value: cleanNum(Math.max(5, pct - 10)), errorMode: 'forgot_final_step' },
      { value: cleanNum((part / whole) * 10), errorMode: 'forgot_final_step' },
      { value: cleanNum((whole - part) / whole * 100), errorMode: 'answered_wrong_quantity' },
      { value: cleanNum((part / (whole - part)) * 100), errorMode: 'applied_to_wrong_base' },
      { value: cleanNum((whole / part) * 10), errorMode: 'inverted_ratio' },
      { value: cleanNum(pct * 2), errorMode: 'guessed_round_up' },
      { value: cleanNum(Math.round(part / 10)), errorMode: 'shekels_not_percent' },
    ]

    return {
      narrativeKey: rng.pick([
        'q.percent_is_a',
        'q.percent_is_b',
        'q.percent_is_c',
        'q.percent_is_d',
      ]),
      params: { part, whole },
      answer,
      distractors: uniquePlausible(answer, candidates),
      solutionKey: 'sol.percent_is',
      timeTargetSec: d <= 2 ? 32 : 40,
    }
  },
}
