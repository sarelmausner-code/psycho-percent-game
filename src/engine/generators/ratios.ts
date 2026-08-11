import type { Generator } from '../types'
import type { RNG } from '../rng'
import {
  cleanNum,
  pickByDifficulty,
  type Difficulty,
  uniquePlausible,
} from '../difficulty'

/** Ratio a:b, total T → how many in group a? */
export const ratioPart: Generator = {
  id: 'ratio_part_v1',
  topic: 'ratios',
  subtopic: 'part_from_ratio',

  generate(rng: RNG, difficulty = 1) {
    const d = Math.max(1, Math.min(5, difficulty)) as Difficulty
    const a = pickByDifficulty(rng, [1, 2, 3], [2, 3, 4, 5], [3, 4, 5, 7], d)
    const b = pickByDifficulty(rng, [1, 2, 3, 4], [2, 3, 5, 7], [3, 5, 8, 9], d)
    const parts = a + b
    const unit = pickByDifficulty(rng, [10, 12, 15, 20], [8, 12, 16, 20], [6, 9, 14, 18], d)
    const total = parts * unit
    const answer = a * unit

    const candidates = [
      { value: b * unit, errorMode: 'answered_wrong_quantity' },
      { value: total - answer, errorMode: 'answered_wrong_quantity' },
      { value: (b / parts) * total, errorMode: 'inverted_ratio' },
      { value: a * b * unit, errorMode: 'forgot_final_step' },
      { value: unit, errorMode: 'forgot_final_step' },
      { value: total / a, errorMode: 'inverted_ratio' },
      { value: answer + unit, errorMode: 'guessed_round_up' },
      { value: answer - unit, errorMode: 'guessed_round_up' },
    ]

    return {
      narrativeKey: rng.pick(['q.ratio_part_a', 'q.ratio_part_b', 'q.ratio_part_c']),
      params: { a, b, total },
      answer: cleanNum(answer),
      distractors: uniquePlausible(answer, candidates),
      solutionKey: 'sol.ratio_part',
      timeTargetSec: d <= 2 ? 32 : 40,
    }
  },
}

/** Scale: recipe for n → for m */
export const ratioScale: Generator = {
  id: 'ratio_scale_v1',
  topic: 'ratios',
  subtopic: 'scale_ratio',

  generate(rng: RNG, difficulty = 1) {
    const d = Math.max(1, Math.min(5, difficulty)) as Difficulty
    const per = pickByDifficulty(rng, [2, 3, 4, 5], [3, 4, 6, 8], [5, 6, 7, 9], d)
    const amount = pickByDifficulty(rng, [6, 8, 10, 12], [9, 12, 15, 18], [14, 16, 21, 24], d)
    const fromN = pickByDifficulty(rng, [2, 4], [3, 4, 5], [3, 5, 6], d)
    const toN = pickByDifficulty(rng, [6, 8, 10], [6, 9, 12], [8, 10, 15], d)
    // amount is for fromN people
    const answer = cleanNum((amount / fromN) * toN)

    const candidates = [
      { value: (amount / toN) * fromN, errorMode: 'inverted_ratio' },
      { value: amount + toN, errorMode: 'shekels_not_percent' },
      { value: amount * toN, errorMode: 'forgot_final_step' },
      { value: amount * (toN - fromN), errorMode: 'forgot_final_step' },
      { value: per * toN, errorMode: 'answered_wrong_quantity' },
      { value: answer + amount / fromN, errorMode: 'guessed_round_up' },
      { value: answer - amount / fromN, errorMode: 'guessed_round_up' },
    ]

    return {
      narrativeKey: rng.pick(['q.ratio_scale_a', 'q.ratio_scale_b', 'q.ratio_scale_c']),
      params: { amount, fromN, toN },
      answer,
      distractors: uniquePlausible(answer, candidates),
      solutionKey: 'sol.ratio_scale',
      timeTargetSec: d <= 2 ? 34 : 42,
    }
  },
}

/** Given one part and ratio a:b → total */
export const ratioWhole: Generator = {
  id: 'ratio_whole_v1',
  topic: 'ratios',
  subtopic: 'whole_from_part',

  generate(rng: RNG, difficulty = 1) {
    const d = Math.max(1, Math.min(5, difficulty)) as Difficulty
    const a = pickByDifficulty(rng, [2, 3, 4], [2, 3, 5, 4], [3, 5, 7, 8], d)
    const b = pickByDifficulty(rng, [3, 5, 2], [4, 5, 7, 3], [5, 8, 9, 6], d)
    const unit = pickByDifficulty(rng, [8, 10, 12, 15], [6, 9, 12, 14], [7, 11, 13, 16], d)
    const partA = a * unit
    const answer = (a + b) * unit

    const candidates = [
      { value: b * unit, errorMode: 'answered_wrong_quantity' },
      { value: partA * b, errorMode: 'forgot_final_step' },
      { value: partA + b, errorMode: 'shekels_not_percent' },
      { value: (partA / b) * a, errorMode: 'inverted_ratio' },
      { value: partA * (a + b), errorMode: 'applied_to_wrong_base' },
      { value: answer + unit, errorMode: 'guessed_round_up' },
      { value: answer - unit, errorMode: 'guessed_round_up' },
      { value: unit * a * b, errorMode: 'forgot_final_step' },
    ]

    return {
      narrativeKey: rng.pick(['q.ratio_whole_a', 'q.ratio_whole_b', 'q.ratio_whole_c']),
      params: { a, b, partA },
      answer: cleanNum(answer),
      distractors: uniquePlausible(answer, candidates),
      solutionKey: 'sol.ratio_whole',
      timeTargetSec: d <= 2 ? 36 : 44,
    }
  },
}

/** Two groups: boys a:b girls, total class → boys */
export const ratioMix: Generator = {
  id: 'ratio_mix_v1',
  topic: 'ratios',
  subtopic: 'mixture_ratio',

  generate(rng: RNG, difficulty = 2) {
    const d = Math.max(1, Math.min(5, difficulty)) as Difficulty
    const a = pickByDifficulty(rng, [2, 3], [2, 3, 4], [3, 4, 5], d)
    const b = pickByDifficulty(rng, [3, 5], [3, 4, 5, 7], [5, 6, 8], d)
    const unit = pickByDifficulty(rng, [5, 6, 8, 10], [4, 6, 8, 9], [5, 7, 8, 11], d)
    const total = (a + b) * unit
    const answer = a * unit

    const candidates = [
      { value: b * unit, errorMode: 'answered_wrong_quantity' },
      { value: total / 2, errorMode: 'guessed_round_up' },
      { value: (b / (a + b)) * total, errorMode: 'inverted_ratio' },
      { value: a * b * unit, errorMode: 'forgot_final_step' },
      { value: total - a, errorMode: 'shekels_not_percent' },
      { value: answer + unit, errorMode: 'off_by_one' },
      { value: answer - unit, errorMode: 'off_by_one' },
    ]

    return {
      narrativeKey: rng.pick(['q.ratio_mix_a', 'q.ratio_mix_b', 'q.ratio_mix_c']),
      params: { a, b, total },
      answer: cleanNum(answer),
      distractors: uniquePlausible(answer, candidates),
      solutionKey: 'sol.ratio_mix',
      timeTargetSec: d <= 3 ? 38 : 46,
    }
  },
}

/** a:b:c three-way, ask middle group */
export const ratioTriple: Generator = {
  id: 'ratio_triple_v1',
  topic: 'ratios',
  subtopic: 'triple_ratio',

  generate(rng: RNG, difficulty = 3) {
    const d = Math.max(1, Math.min(5, difficulty)) as Difficulty
    const a = pickByDifficulty(rng, [1, 2], [1, 2, 3], [2, 3, 4], d)
    const b = pickByDifficulty(rng, [2, 3], [2, 3, 4], [3, 4, 5], d)
    const c = pickByDifficulty(rng, [1, 2, 3], [2, 3, 4], [2, 4, 5], d)
    const unit = pickByDifficulty(rng, [4, 5, 6, 8], [3, 5, 6, 7], [4, 5, 8, 9], d)
    const total = (a + b + c) * unit
    const answer = b * unit

    const candidates = [
      { value: a * unit, errorMode: 'answered_wrong_quantity' },
      { value: c * unit, errorMode: 'answered_wrong_quantity' },
      { value: (a + c) * unit, errorMode: 'forgot_final_step' },
      { value: total / 3, errorMode: 'guessed_round_up' },
      { value: (a + b) * unit, errorMode: 'forgot_final_step' },
      { value: answer + unit, errorMode: 'off_by_one' },
      { value: answer - unit, errorMode: 'off_by_one' },
      { value: b * total, errorMode: 'inverted_ratio' },
    ]

    return {
      narrativeKey: rng.pick(['q.ratio_triple_a', 'q.ratio_triple_b', 'q.ratio_triple_c']),
      params: { a, b, c, total },
      answer: cleanNum(answer),
      distractors: uniquePlausible(answer, candidates),
      solutionKey: 'sol.ratio_triple',
      timeTargetSec: d <= 3 ? 40 : 48,
    }
  },
}
