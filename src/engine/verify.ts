import type { GeneratorResult } from './types'

/** Independent second path for answer verification. */
export function verifyIndependently(
  generatorId: string,
  q: Pick<GeneratorResult, 'params' | 'answer' | 'narrativeKey'>,
): number {
  switch (generatorId) {
    case 'percent_of_v1': {
      // Generator: base * pct / 100. Verify: (pct/100) * base
      return (q.params.pct! / 100) * q.params.base!
    }
    case 'percent_reversal_v1': {
      // Generator: paid = orig * (1 - disc/100) → orig = paid / (1 - disc/100)
      const remaining = 1 - q.params.disc! / 100
      return q.params.paid! / remaining
    }
    case 'percent_change_v1': {
      const oldVal = q.params.oldVal!
      const newVal = q.params.newVal!
      return Math.round((Math.abs(newVal - oldVal) / oldVal) * 100)
    }
    default:
      return q.answer
  }
}
