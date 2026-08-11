import type { Generator } from '../types'
import type { RNG } from '../rng'
import {
  cleanNum,
  pickByDifficulty,
  type Difficulty,
  uniquePlausible,
} from '../difficulty'

/** From old to new — what % change? */
export const percentChange: Generator = {
  id: 'percent_change_v1',
  topic: 'percentages',
  subtopic: 'percent_change',

  generate(rng: RNG, difficulty = 1) {
    const d = Math.max(1, Math.min(5, difficulty)) as Difficulty

    const oldVal = pickByDifficulty(
      rng,
      [100, 200, 400, 500],
      [150, 250, 300, 450],
      [160, 240, 320, 375, 480],
      d,
    )

    const changePct = pickByDifficulty(
      rng,
      [10, 20, 25, 50],
      [15, 20, 30, 40],
      [12, 18, 24, 35, 45],
      d,
    )

    const up = rng.pick([true, false])
    const newVal = cleanNum(up ? oldVal * (1 + changePct / 100) : oldVal * (1 - changePct / 100))
    const answer = changePct

    // Divide by new instead of old
    const wrongBase = cleanNum((Math.abs(newVal - oldVal) / newVal) * 100)
    // Absolute difference as if it were percent
    const shekelAsPct = cleanNum(Math.abs(newVal - oldVal))
    // 100 - change or inverse direction magnitude
    const signish = cleanNum(100 - changePct)
    // Additive vs relative
    const additive = cleanNum(changePct + (up ? 10 : 5))
    // (new/old)*100 instead of change
    const ratioTrap = cleanNum((newVal / oldVal) * 100)

    const candidates = [
      { value: wrongBase, errorMode: 'applied_to_wrong_base' },
      { value: shekelAsPct, errorMode: 'shekels_not_percent' },
      { value: signish, errorMode: 'sign_flip' },
      { value: additive, errorMode: 'additive_percent' },
      { value: ratioTrap, errorMode: 'forgot_final_step' },
      { value: cleanNum(changePct / 2), errorMode: 'forgot_final_step' },
      { value: cleanNum(Math.abs(newVal - oldVal) / 10), errorMode: 'guessed_round_up' },
    ]

    const narratives = up
      ? d <= 2
        ? ['q.percent_change_up_a', 'q.percent_change_up_b']
        : ['q.percent_change_up_b', 'q.percent_change_up_c', 'q.percent_change_up_d']
      : d <= 2
        ? ['q.percent_change_down_a', 'q.percent_change_down_b']
        : ['q.percent_change_down_b', 'q.percent_change_down_c', 'q.percent_change_down_d']

    return {
      narrativeKey: rng.pick(narratives),
      params: { oldVal, newVal },
      answer,
      distractors: uniquePlausible(answer, candidates),
      solutionKey: 'sol.percent_change',
      timeTargetSec: d <= 2 ? 36 : d <= 4 ? 42 : 46,
    }
  },
}
