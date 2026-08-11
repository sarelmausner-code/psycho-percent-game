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
      [100, 150, 200, 250, 400],
      [160, 240, 300, 360, 450],
      [180, 220, 280, 320, 375, 480],
      d,
    )

    const changePct = pickByDifficulty(
      rng,
      [10, 15, 20, 25, 40],
      [12, 15, 20, 25, 30, 35],
      [8, 12, 18, 24, 28, 36, 45],
      d,
    )

    const up = rng.pick([true, false])
    const newVal = cleanNum(
      up ? oldVal * (1 + changePct / 100) : oldVal * (1 - changePct / 100),
    )
    const answer = changePct

    const wrongBase = cleanNum((Math.abs(newVal - oldVal) / newVal) * 100)
    const absDiff = cleanNum(Math.abs(newVal - oldVal))
    // If abs diff is huge vs answer, uniquePlausible will drop it
    const ratioAsPct = cleanNum((newVal / oldVal) * 100) // e.g. 120 instead of 20
    const half = cleanNum(changePct / 2)
    const plus10 = cleanNum(changePct + 10)
    const minus5 = cleanNum(Math.max(5, changePct - 5))
    const complement = cleanNum(100 - changePct)

    const candidates = [
      { value: wrongBase, errorMode: 'applied_to_wrong_base' },
      { value: plus10, errorMode: 'additive_percent' },
      { value: minus5, errorMode: 'forgot_final_step' },
      { value: half, errorMode: 'forgot_final_step' },
      { value: complement, errorMode: 'sign_flip' },
      { value: cleanNum(changePct * 2), errorMode: 'guessed_round_up' },
      // only if absDiff happens to be near answer magnitude
      { value: absDiff, errorMode: 'shekels_not_percent' },
      { value: ratioAsPct, errorMode: 'forgot_final_step' },
      {
        value: cleanNum(Math.round((Math.abs(newVal - oldVal) / oldVal) * 100) + 5),
        errorMode: 'guessed_round_up',
      },
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
