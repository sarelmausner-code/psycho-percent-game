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
 * Two successive discounts. Prefer integer final prices that aren't
 * uniquely round vs the additive trap (also integer).
 */
export const successivePercent: Generator = {
  id: 'successive_percent_v1',
  topic: 'percentages',
  subtopic: 'successive_percent',

  generate(rng: RNG, difficulty = 2) {
    const d = Math.max(1, Math.min(5, difficulty)) as Difficulty

    // [start, a, b] → final integer, additive trap integer and nearby
    const easyTriples: [number, number, number][] = [
      [200, 10, 10], // 162 vs additive 160
      [200, 20, 10], // 144 vs 140
      [250, 20, 10], // 180 vs 175
      [400, 10, 20], // 288 vs 280
      [500, 10, 10], // 405 vs 400
    ]
    const midTriples: [number, number, number][] = [
      [250, 20, 20], // 160 vs 150
      [300, 10, 20], // 216 vs 210
      [400, 25, 10], // 270 vs 260
      [480, 20, 10], // 345.6 — may skip
      [360, 10, 20], // 259.2
      [280, 10, 20], // 201.6
      [500, 20, 10], // 360 vs 350
      [200, 15, 20], // 136 vs 130
    ]
    const hardTriples: [number, number, number][] = [
      [400, 15, 20], // 272 vs 260
      [500, 20, 20], // 320 vs 300
      [360, 20, 25], // 216 vs 198 → check
      [280, 20, 10], // 201.6
      [450, 20, 10], // 324 vs 315
      [600, 10, 25], // 405 vs 390
      [320, 25, 20], // 192 vs 176
      [240, 20, 15], // 163.2
    ]

    let start: number
    let a: number
    let b: number
    let answer: number
    let tries = 0
    do {
      ;[start, a, b] = pickByDifficulty(rng, easyTriples, midTriples, hardTriples, d)
      answer = cleanNum(start * (1 - a / 100) * (1 - b / 100))
      tries++
    } while (
      tries < 16 &&
      (!Number.isInteger(answer) || (d >= 3 && isOverlyRoundAnswer(answer)))
    )

    const additiveTrap = cleanNum(start * (1 - (a + b) / 100))
    const onlyFirst = cleanNum(start * (1 - a / 100))
    const onlySecond = cleanNum(start * (1 - b / 100))
    const thenIncrease = cleanNum(start * (1 - a / 100) * (1 + b / 100))

    const candidates = [
      { value: additiveTrap, errorMode: 'additive_percent' },
      { value: start - (start * a) / 100 - (start * b) / 100, errorMode: 'additive_percent' },
      { value: onlyFirst, errorMode: 'forgot_final_step' },
      { value: onlySecond, errorMode: 'forgot_final_step' },
      { value: thenIncrease, errorMode: 'sign_flip' },
      { value: answer + 10, errorMode: 'guessed_round_up' },
      { value: answer - 10, errorMode: 'guessed_round_up' },
      { value: answer + 20, errorMode: 'guessed_round_up' },
      { value: answer - 20, errorMode: 'guessed_round_up' },
      { value: start * (1 - Math.max(a, b) / 100), errorMode: 'answered_wrong_quantity' },
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
