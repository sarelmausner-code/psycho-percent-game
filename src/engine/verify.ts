import type { GeneratorResult } from './types'

/** Independent second path for answer verification. */
export function verifyIndependently(
  generatorId: string,
  q: Pick<GeneratorResult, 'params' | 'answer' | 'narrativeKey'>,
): number {
  switch (generatorId) {
    case 'percent_of_v1':
      return (q.params.pct! / 100) * q.params.base!
    case 'percent_reversal_v1': {
      const remaining = 1 - q.params.disc! / 100
      return q.params.paid! / remaining
    }
    case 'percent_change_v1': {
      const oldVal = q.params.oldVal!
      const newVal = q.params.newVal!
      return Math.round((Math.abs(newVal - oldVal) / oldVal) * 100)
    }
    case 'percent_is_v1':
      return Math.round((q.params.part! / q.params.whole!) * 100)
    case 'successive_percent_v1': {
      const { start, a, b } = q.params
      return start! * (1 - a! / 100) * (1 - b! / 100)
    }
    default:
      return q.answer
  }
}
