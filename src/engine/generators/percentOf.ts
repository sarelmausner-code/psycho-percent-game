import type { Generator } from '../types'
import type { RNG } from '../rng'
import {
  cleanNum,
  isOverlyRoundAnswer,
  pickByDifficulty,
  type Difficulty,
  uniquePlausible,
} from '../difficulty'

/** What is X% of Y? — answer always integer; not uniquely "pretty". */
export const percentOf: Generator = {
  id: 'percent_of_v1',
  topic: 'percentages',
  subtopic: 'percent_of',

  generate(rng: RNG, difficulty = 1) {
    const d = Math.max(1, Math.min(5, difficulty)) as Difficulty

    // Pairs that yield integer answers without defaulting to 50/100/200
    const easyPairs: [number, number][] = [
      [15, 80],
      [15, 120],
      [20, 85],
      [25, 84],
      [30, 90],
      [40, 75],
      [12, 150],
      [20, 125],
      [25, 160],
      [10, 160],
    ]
    const midPairs: [number, number][] = [
      [12, 175],
      [15, 180],
      [18, 200],
      [24, 125],
      [16, 225],
      [35, 120],
      [28, 150],
      [32, 125],
      [45, 160],
      [15, 240],
      [20, 175],
      [25, 180],
    ]
    const hardPairs: [number, number][] = [
      [12, 275],
      [16, 325],
      [18, 250],
      [22, 200],
      [28, 225],
      [32, 175],
      [36, 150],
      [15, 280],
      [24, 275],
      [35, 180],
      [8, 375],
      [45, 180],
    ]

    let pct: number
    let base: number
    let answer: number
    let tries = 0
    do {
      ;[pct, base] = pickByDifficulty(rng, easyPairs, midPairs, hardPairs, d)
      // slight jitter on base at high difficulty while keeping integer answer
      if (d >= 4 && rng.next() > 0.5) {
        const alt = pickByDifficulty(rng, midPairs, hardPairs, hardPairs, d)
        ;[pct, base] = alt
      }
      answer = cleanNum((base * pct) / 100)
      tries++
    } while (
      tries < 12 &&
      (!Number.isInteger(answer) || (d >= 2 && isOverlyRoundAnswer(answer)))
    )

    // Integer traps with same cleanliness
    const candidates = [
      { value: (base * (pct + 5)) / 100, errorMode: 'forgot_final_step' },
      { value: (base * (pct - 5)) / 100, errorMode: 'forgot_final_step' },
      { value: (base * (pct + 10)) / 100, errorMode: 'forgot_final_step' },
      { value: (base * (pct - 10)) / 100, errorMode: 'forgot_final_step' },
      { value: answer + pct, errorMode: 'shekels_not_percent' },
      { value: answer - pct, errorMode: 'shekels_not_percent' },
      { value: answer + 10, errorMode: 'guessed_round_up' },
      { value: answer - 10, errorMode: 'guessed_round_up' },
      { value: (pct / 100) * (base + 50), errorMode: 'applied_to_wrong_base' },
      { value: (pct / 100) * (base - 50), errorMode: 'applied_to_wrong_base' },
      { value: answer * 1.2, errorMode: 'applied_to_wrong_base' },
      { value: answer * 0.8, errorMode: 'applied_to_wrong_base' },
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
