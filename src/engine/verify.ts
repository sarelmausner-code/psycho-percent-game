import type { GeneratorResult } from './types'

/** Independent second path for answer verification. */
export function verifyIndependently(
  generatorId: string,
  q: Pick<GeneratorResult, 'params' | 'answer' | 'narrativeKey'>,
): number {
  const p = q.params
  switch (generatorId) {
    case 'percent_of_v1':
      return (p.pct! / 100) * p.base!
    case 'percent_reversal_v1':
      return p.paid! / (1 - p.disc! / 100)
    case 'percent_change_v1':
      return Math.round((Math.abs(p.newVal! - p.oldVal!) / p.oldVal!) * 100)
    case 'percent_is_v1':
      return Math.round((p.part! / p.whole!) * 100)
    case 'successive_percent_v1':
      return p.start! * (1 - p.a! / 100) * (1 - p.b! / 100)

    case 'ratio_part_v1':
      return (p.a! / (p.a! + p.b!)) * p.total!
    case 'ratio_scale_v1':
      return (p.amount! / p.fromN!) * p.toN!
    case 'ratio_whole_v1':
      return (p.partA! / p.a!) * (p.a! + p.b!)
    case 'ratio_mix_v1':
      return (p.a! / (p.a! + p.b!)) * p.total!
    case 'ratio_triple_v1':
      return (p.b! / (p.a! + p.b! + p.c!)) * p.total!

    case 'mean_simple_v1':
      return p.total! / p.n!
    case 'mean_missing_v1':
      return p.mean! * p.n! - p.knownSum!
    case 'mean_weighted_v1':
      return (p.n1! * p.m1! + p.n2! * p.m2!) / (p.n1! + p.n2!)
    case 'mean_needed_v1':
      return p.target! * (p.n! + 1) - p.currentMean! * p.n!
    case 'mean_remove_v1':
      return (p.mean! * p.n! - p.removed!) / (p.n! - 1)

    default:
      return q.answer
  }
}
