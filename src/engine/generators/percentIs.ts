import type { Generator } from '../types'
import type { RNG } from '../rng'
import {
  cleanNum,
  isOverlyRoundAnswer,
  pickByDifficulty,
  type Difficulty,
  uniquePlausible,
} from '../difficulty'

/** What % is part of whole? Answer integer %; wrong options integer %. */
export const percentIs: Generator = {
  id: 'percent_is_v1',
  topic: 'percentages',
  subtopic: 'percent_is',

  generate(rng: RNG, difficulty = 1) {
    const d = Math.max(1, Math.min(5, difficulty)) as Difficulty

    const easyPairs: [number, number][] = [
      [15, 80],
      [20, 80],
      [25, 80],
      [30, 90],
      [40, 75],
      [12, 150],
      [20, 125],
      [25, 160],
    ]
    const midPairs: [number, number][] = [
      [18, 200],
      [24, 125],
      [16, 225],
      [35, 120],
      [28, 150],
      [32, 125],
      [15, 240],
      [45, 160],
    ]
    const hardPairs: [number, number][] = [
      [12, 275],
      [16, 325],
      [22, 200],
      [28, 225],
      [36, 150],
      [15, 280],
      [24, 275],
      [8, 375],
    ]

    let pct: number
    let whole: number
    let part: number
    let tries = 0
    do {
      ;[pct, whole] = pickByDifficulty(rng, easyPairs, midPairs, hardPairs, d)
      part = cleanNum((whole * pct) / 100)
      tries++
    } while (
      tries < 12 &&
      (!Number.isInteger(part) || (d >= 2 && isOverlyRoundAnswer(pct)))
    )

    const answer = pct
    const candidates = [
      { value: 100 - pct, errorMode: 'answered_wrong_quantity' },
      { value: pct + 5, errorMode: 'guessed_round_up' },
      { value: pct + 10, errorMode: 'guessed_round_up' },
      { value: Math.max(5, pct - 5), errorMode: 'forgot_final_step' },
      { value: Math.max(5, pct - 10), errorMode: 'forgot_final_step' },
      { value: pct * 2, errorMode: 'guessed_round_up' },
      { value: Math.round(pct / 2), errorMode: 'forgot_final_step' },
      { value: Math.round((part / (whole - part)) * 100), errorMode: 'applied_to_wrong_base' },
      { value: Math.round((whole - part) / whole * 100), errorMode: 'answered_wrong_quantity' },
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
