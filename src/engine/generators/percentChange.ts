import type { Generator } from '../types'
import type { RNG } from '../rng'
import {
  cleanNum,
  isOverlyRoundAnswer,
  pickByDifficulty,
  type Difficulty,
  uniquePlausible,
} from '../difficulty'

/** % change — answer is integer %; distractors integer % too. */
export const percentChange: Generator = {
  id: 'percent_change_v1',
  topic: 'percentages',
  subtopic: 'percent_change',

  generate(rng: RNG, difficulty = 1) {
    const d = Math.max(1, Math.min(5, difficulty)) as Difficulty

    // [old, changePct] → new is clean
    const easyPairs: [number, number][] = [
      [80, 25],
      [120, 25],
      [160, 25],
      [200, 15],
      [240, 20],
      [150, 20],
      [180, 10],
      [250, 20],
    ]
    const midPairs: [number, number][] = [
      [160, 15],
      [200, 12],
      [250, 16],
      [180, 20],
      [240, 15],
      [320, 25],
      [150, 30],
      [280, 20],
      [360, 15],
    ]
    const hardPairs: [number, number][] = [
      [160, 35],
      [200, 18],
      [250, 24],
      [280, 15],
      [320, 20],
      [180, 40],
      [360, 25],
      [240, 35],
      [400, 12],
    ]

    let oldVal: number
    let changePct: number
    let tries = 0
    do {
      ;[oldVal, changePct] = pickByDifficulty(rng, easyPairs, midPairs, hardPairs, d)
      tries++
    } while (tries < 10 && d >= 3 && isOverlyRoundAnswer(changePct))

    const up = rng.pick([true, false])
    const newVal = cleanNum(
      up ? oldVal * (1 + changePct / 100) : oldVal * (1 - changePct / 100),
    )
    const answer = changePct

    const wrongBase = (Math.abs(newVal - oldVal) / newVal) * 100
    const candidates = [
      { value: wrongBase, errorMode: 'applied_to_wrong_base' },
      { value: changePct + 5, errorMode: 'additive_percent' },
      { value: changePct + 10, errorMode: 'additive_percent' },
      { value: Math.max(5, changePct - 5), errorMode: 'forgot_final_step' },
      { value: Math.max(5, changePct - 10), errorMode: 'forgot_final_step' },
      { value: changePct * 2, errorMode: 'guessed_round_up' },
      { value: Math.round(changePct / 2), errorMode: 'forgot_final_step' },
      { value: 100 - changePct, errorMode: 'sign_flip' },
      { value: changePct + 15, errorMode: 'guessed_round_up' },
      { value: Math.round((newVal / oldVal) * 100) - 100, errorMode: 'sign_flip' }, // same as ±change sometimes
    ]

    const narratives = up
      ? d <= 2
        ? ['q.percent_change_up_a', 'q.percent_change_up_b', 'q.percent_change_up_c']
        : ['q.percent_change_up_b', 'q.percent_change_up_c', 'q.percent_change_up_d']
      : d <= 2
        ? ['q.percent_change_down_a', 'q.percent_change_down_b', 'q.percent_change_down_c']
        : ['q.percent_change_down_b', 'q.percent_change_down_c', 'q.percent_change_down_d']

    return {
      narrativeKey: rng.pick(narratives),
      params: { oldVal, newVal },
      answer,
      distractors: uniquePlausible(answer, candidates),
      solutionKey: 'sol.percent_change',
      timeTargetSec: d <= 2 ? 34 : d <= 4 ? 40 : 46,
    }
  },
}
