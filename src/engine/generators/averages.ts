import type { Generator } from '../types'
import type { RNG } from '../rng'
import {
  cleanNum,
  pickByDifficulty,
  type Difficulty,
  uniquePlausible,
} from '../difficulty'

/** Mean of 3–5 known scores */
export const meanSimple: Generator = {
  id: 'mean_simple_v1',
  topic: 'averages',
  subtopic: 'simple_mean',

  generate(rng: RNG, difficulty = 1) {
    const d = Math.max(1, Math.min(5, difficulty)) as Difficulty
    const n = pickByDifficulty(rng, [3, 4], [3, 4, 5], [4, 5], d)
    const mean = pickByDifficulty(rng, [70, 80, 75, 85], [68, 72, 78, 82], [64, 71, 77, 83], d)
    // Build n integers averaging to mean
    const values: number[] = []
    let sum = 0
    for (let i = 0; i < n - 1; i++) {
      const v = mean + rng.int(-8, 8)
      values.push(v)
      sum += v
    }
    const last = mean * n - sum
    values.push(last)
    const answer = mean

    const candidates = [
      { value: sum / (n - 1), errorMode: 'forgot_final_step' },
      { value: values.reduce((a, b) => a + b, 0) / (n + 1), errorMode: 'off_by_one' },
      { value: Math.max(...values), errorMode: 'answered_wrong_quantity' },
      { value: Math.min(...values), errorMode: 'answered_wrong_quantity' },
      { value: answer + 5, errorMode: 'guessed_round_up' },
      { value: answer - 5, errorMode: 'guessed_round_up' },
      { value: Math.round(values.reduce((a, b) => a + b, 0) / 2), errorMode: 'forgot_final_step' },
    ]

    const total = values.reduce((a, b) => a + b, 0)
    // Prefer clean integer mean
    const answerInt = Math.round(total / n)
    return {
      narrativeKey: rng.pick(['q.mean_simple_a', 'q.mean_simple_b', 'q.mean_simple_c']),
      params: { n, total },
      answer: cleanNum(answerInt),
      distractors: uniquePlausible(answerInt, candidates.map((c) => ({
        ...c,
        value: c.value === answer ? answerInt : c.value,
      }))),
      solutionKey: 'sol.mean_simple',
      timeTargetSec: d <= 2 ? 36 : 44,
    }
  },
}

/** n scores, mean M, one missing → missing value */
export const meanMissing: Generator = {
  id: 'mean_missing_v1',
  topic: 'averages',
  subtopic: 'missing_for_mean',

  generate(rng: RNG, difficulty = 2) {
    const d = Math.max(1, Math.min(5, difficulty)) as Difficulty
    const n = pickByDifficulty(rng, [4, 5], [4, 5, 6], [5, 6, 7], d)
    const mean = pickByDifficulty(rng, [70, 80, 75], [72, 78, 84], [68, 76, 82, 88], d)
    const missing = pickByDifficulty(rng, [60, 70, 90, 50], [55, 65, 85, 95], [48, 62, 88, 92], d)
    const knownSum = mean * n - missing
    // narrative shows mean, n, and sum of known OR list - use knownSum and n-1
    const answer = missing

    const candidates = [
      { value: mean, errorMode: 'forgot_final_step' },
      { value: knownSum / n, errorMode: 'applied_to_wrong_base' },
      { value: mean * n - knownSum / (n - 1), errorMode: 'forgot_final_step' },
      { value: answer + mean, errorMode: 'shekels_not_percent' },
      { value: knownSum - mean * (n - 1), errorMode: 'sign_flip' },
      { value: answer + 10, errorMode: 'guessed_round_up' },
      { value: answer - 10, errorMode: 'guessed_round_up' },
      { value: Math.round(knownSum / (n - 1)), errorMode: 'arithmetic_mean_trap' },
    ]

    return {
      narrativeKey: rng.pick(['q.mean_missing_a', 'q.mean_missing_b', 'q.mean_missing_c']),
      params: { n, mean, knownSum },
      answer: cleanNum(answer),
      distractors: uniquePlausible(answer, candidates),
      solutionKey: 'sol.mean_missing',
      timeTargetSec: d <= 2 ? 38 : 46,
    }
  },
}

/** Two groups different sizes → combined mean (weighted) */
export const meanWeighted: Generator = {
  id: 'mean_weighted_v1',
  topic: 'averages',
  subtopic: 'weighted_mean',

  generate(rng: RNG, difficulty = 2) {
    const d = Math.max(1, Math.min(5, difficulty)) as Difficulty
    // Force integer weighted mean [n1,m1,n2,m2]
    const pairs: [number, number, number, number][] = [
      [10, 70, 20, 85], // (700+1700)/30 = 80
      [20, 60, 10, 90], // (1200+900)/30 = 70
      [15, 80, 15, 70], // 75
      [12, 75, 18, 85], // (900+1530)/30 = 81
      [20, 70, 30, 80], // (1400+2400)/50 = 76
      [10, 90, 30, 70], // (900+2100)/40 = 75
      [25, 64, 15, 80], // (1600+1200)/40 = 70
      [16, 80, 24, 70], // (1280+1680)/40 = 74
    ]
    const pick = pickByDifficulty(
      rng,
      pairs.slice(0, 4),
      pairs.slice(2, 6),
      pairs.slice(4),
      d,
    )
    const [N1, M1, N2, M2] = pick
    const totalN = N1 + N2
    const finalAnswer = (N1 * M1 + N2 * M2) / totalN

    const simpleAvg = cleanNum((M1 + M2) / 2)
    const candidates = [
      { value: simpleAvg, errorMode: 'arithmetic_mean_trap' },
      { value: M1, errorMode: 'answered_wrong_quantity' },
      { value: M2, errorMode: 'answered_wrong_quantity' },
      { value: (N1 * M1 + N2 * M2) / N1, errorMode: 'applied_to_wrong_base' },
      { value: finalAnswer + 4, errorMode: 'guessed_round_up' },
      { value: finalAnswer - 4, errorMode: 'guessed_round_up' },
      { value: Math.round((N1 * M2 + N2 * M1) / totalN), errorMode: 'inverted_ratio' },
    ]

    return {
      narrativeKey: rng.pick(['q.mean_weighted_a', 'q.mean_weighted_b', 'q.mean_weighted_c']),
      params: { n1: N1, m1: M1, n2: N2, m2: M2 },
      answer: cleanNum(finalAnswer),
      distractors: uniquePlausible(finalAnswer, candidates),
      solutionKey: 'sol.mean_weighted',
      timeTargetSec: d <= 2 ? 40 : 48,
    }
  },
}

/** n scores so far mean M; what score needed for target T with one more test */
export const meanNeeded: Generator = {
  id: 'mean_needed_v1',
  topic: 'averages',
  subtopic: 'needed_score',

  generate(rng: RNG, difficulty = 3) {
    const d = Math.max(1, Math.min(5, difficulty)) as Difficulty
    const n = pickByDifficulty(rng, [3, 4], [4, 5], [5, 6], d)
    const currentMean = pickByDifficulty(rng, [70, 75, 80], [72, 78, 82], [68, 74, 80], d)
    const target = pickByDifficulty(rng, [75, 80, 85], [78, 82, 85], [80, 84, 88], d)
    // needed: (target*(n+1) - currentMean*n)
    const answer = cleanNum(target * (n + 1) - currentMean * n)

    const candidates = [
      { value: target, errorMode: 'forgot_final_step' },
      { value: target * 2 - currentMean, errorMode: 'forgot_final_step' },
      { value: target * n - currentMean * (n - 1), errorMode: 'off_by_one' },
      { value: currentMean, errorMode: 'answered_wrong_quantity' },
      { value: answer + 10, errorMode: 'guessed_round_up' },
      { value: answer - 10, errorMode: 'guessed_round_up' },
      { value: target * (n + 1) - currentMean * (n + 1), errorMode: 'applied_to_wrong_base' },
    ]

    return {
      narrativeKey: rng.pick(['q.mean_needed_a', 'q.mean_needed_b', 'q.mean_needed_c']),
      params: { n, currentMean, target },
      answer,
      distractors: uniquePlausible(answer, candidates),
      solutionKey: 'sol.mean_needed',
      timeTargetSec: d <= 3 ? 42 : 50,
    }
  },
}

/** n scores mean M; remove value X → new mean */
export const meanRemove: Generator = {
  id: 'mean_remove_v1',
  topic: 'averages',
  subtopic: 'mean_after_remove',

  generate(rng: RNG, difficulty = 3) {
    const d = Math.max(1, Math.min(5, difficulty)) as Difficulty
    // [n, mean, removed] → new mean integer
    const triples: [number, number, number][] = [
      [5, 80, 100], // (400-100)/4 = 75
      [5, 70, 50], // (350-50)/4 = 75
      [6, 80, 50], // (480-50)/5 = 86
      [6, 75, 45], // (450-45)/5 = 81
      [5, 82, 90], // (410-90)/4 = 80
      [7, 70, 40], // (490-40)/6 = 75
      [5, 90, 70], // (450-70)/4 = 95
      [6, 84, 54], // (504-54)/5 = 90
      [8, 80, 80], // (640-80)/7 = 80
      [5, 76, 60], // (380-60)/4 = 80
    ]
    const [n, mean, removed] = pickByDifficulty(
      rng,
      triples.slice(0, 4),
      triples.slice(2, 7),
      triples.slice(5),
      d,
    )
    const finalAnswer = (mean * n - removed) / (n - 1)

    const candidates = [
      { value: mean, errorMode: 'forgot_final_step' },
      { value: (mean * n - removed) / n, errorMode: 'off_by_one' },
      { value: mean - removed / n, errorMode: 'applied_to_wrong_base' },
      { value: finalAnswer + 5, errorMode: 'guessed_round_up' },
      { value: finalAnswer - 5, errorMode: 'guessed_round_up' },
      { value: removed, errorMode: 'answered_wrong_quantity' },
      { value: finalAnswer + 10, errorMode: 'guessed_round_up' },
    ]

    return {
      narrativeKey: rng.pick(['q.mean_remove_a', 'q.mean_remove_b', 'q.mean_remove_c']),
      params: { n, mean, removed },
      answer: cleanNum(finalAnswer),
      distractors: uniquePlausible(finalAnswer, candidates),
      solutionKey: 'sol.mean_remove',
      timeTargetSec: d <= 3 ? 42 : 50,
    }
  },
}
