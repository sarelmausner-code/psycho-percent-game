import type { Generator } from '../types'
import type { RNG } from '../rng'
import {
  cleanNum,
  pickByDifficulty,
  type Difficulty,
  uniquePlausible,
} from '../difficulty'

/** What is X% of Y? */
export const percentOf: Generator = {
  id: 'percent_of_v1',
  topic: 'percentages',
  subtopic: 'percent_of',

  generate(rng: RNG, difficulty = 1) {
    const d = Math.max(1, Math.min(5, difficulty)) as Difficulty

    const pct = pickByDifficulty(
      rng,
      [10, 20, 25, 50],
      [12, 15, 30, 40, 35],
      [8, 16, 18, 24, 28, 32, 45],
      d,
    )

    // Prefer bases that keep answers clean enough for MCQ
    const base = pickByDifficulty(
      rng,
      [100, 200, 400, 500, 80, 120],
      [160, 180, 240, 250, 300, 360],
      [175, 225, 280, 320, 375, 420, 480],
      d,
    )

    const answer = cleanNum((base * pct) / 100)

    // Authentic student traps (not random nearby numbers)
    const candidates = [
      { value: cleanNum(base * ((100 - pct) / 100)), errorMode: 'answered_wrong_quantity' }, // remainder
      { value: cleanNum(base + pct), errorMode: 'shekels_not_percent' },
      { value: cleanNum(base - pct), errorMode: 'shekels_not_percent' },
      { value: cleanNum((base * (pct + 10)) / 100), errorMode: 'forgot_final_step' },
      { value: cleanNum((base * (pct - 5)) / 100), errorMode: 'forgot_final_step' },
      { value: cleanNum((pct * 100) / base), errorMode: 'inverted_ratio' }, // inverted
      { value: cleanNum(base * (pct / 10) / 10 * (d >= 3 ? 1 : 1)), errorMode: 'guessed_round_up' },
      { value: cleanNum(answer * (1 + pct / 100)), errorMode: 'applied_to_wrong_base' },
      { value: cleanNum((base / pct) * 10), errorMode: 'inverted_ratio' },
    ]

    const narratives =
      d <= 2
        ? ['q.percent_of_a', 'q.percent_of_b', 'q.percent_of_c']
        : ['q.percent_of_c', 'q.percent_of_d', 'q.percent_of_e', 'q.percent_of_f']

    return {
      narrativeKey: rng.pick(narratives),
      params: { pct, base },
      answer,
      distractors: uniquePlausible(answer, candidates),
      solutionKey: 'sol.percent_of',
      timeTargetSec: d <= 2 ? 32 : d <= 4 ? 38 : 42,
    }
  },
}
