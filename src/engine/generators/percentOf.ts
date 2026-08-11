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

    // Avoid always-10/20/25/50 — even easy mixes in less round %
    const pct = pickByDifficulty(
      rng,
      [10, 15, 20, 25, 30, 40],
      [12, 15, 18, 24, 35, 40, 45],
      [8, 12, 16, 18, 22, 28, 32, 36, 45],
      d,
    )

    const base = pickByDifficulty(
      rng,
      [80, 120, 150, 200, 250, 300],
      [160, 180, 240, 280, 320, 360, 450],
      [175, 225, 275, 325, 375, 420, 480, 560],
      d,
    )

    const answer = cleanNum((base * pct) / 100)

    // Only traps that stay near the true answer (not "base - pct" giveaways)
    const candidates = [
      { value: cleanNum((base * (pct + 5)) / 100), errorMode: 'forgot_final_step' },
      { value: cleanNum((base * (pct - 5)) / 100), errorMode: 'forgot_final_step' },
      { value: cleanNum((base * (pct + 10)) / 100), errorMode: 'forgot_final_step' },
      { value: cleanNum(answer * (1 + pct / 100)), errorMode: 'applied_to_wrong_base' },
      { value: cleanNum(answer * (1 - pct / 100)), errorMode: 'applied_to_wrong_base' },
      { value: cleanNum((base * pct) / 10 / 10), errorMode: 'guessed_round_up' }, // same as answer if clean — filtered
      { value: cleanNum(base * (pct / 1000) * 10), errorMode: 'guessed_round_up' },
      // Off-by using 100 as base fragment
      { value: cleanNum(pct * (base / 100 + 1)), errorMode: 'shekels_not_percent' },
      { value: cleanNum((pct / 100) * (base + 100)), errorMode: 'applied_to_wrong_base' },
      { value: cleanNum(answer + pct), errorMode: 'shekels_not_percent' },
      { value: cleanNum(answer - pct), errorMode: 'shekels_not_percent' },
      { value: cleanNum((base / 100) * (pct + 10)), errorMode: 'forgot_final_step' },
    ]

    const narratives =
      d <= 2
        ? ['q.percent_of_a', 'q.percent_of_b', 'q.percent_of_c', 'q.percent_of_f']
        : ['q.percent_of_c', 'q.percent_of_d', 'q.percent_of_e', 'q.percent_of_f', 'q.percent_of_b']

    return {
      narrativeKey: rng.pick(narratives),
      params: { pct, base },
      answer,
      distractors: uniquePlausible(answer, candidates),
      solutionKey: 'sol.percent_of',
      timeTargetSec: d <= 2 ? 30 : d <= 4 ? 36 : 42,
    }
  },
}
