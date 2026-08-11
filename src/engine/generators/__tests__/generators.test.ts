import { describe, expect, it } from 'vitest'
import { RNG } from '../../rng'
import { heDict } from '../../../i18n/t'
import { verifyIndependently } from '../../verify'
import { ALL_GENERATORS, materialize } from '../index'

describe('generators harness', () => {
  for (const gen of ALL_GENERATORS) {
    for (const difficulty of [1, 3, 5] as const) {
      it(`${gen.id} d${difficulty} valid across 400 draws`, () => {
        for (let seed = 0; seed < 400; seed++) {
          const raw = gen.generate(new RNG(seed), difficulty)
          const q = materialize(gen, seed, difficulty)

          const correctOpts = q.options.filter((o) => o.correct)
          expect(correctOpts).toHaveLength(1)
          expect(correctOpts[0]!.value).toBe(q.answer)

          const vals = q.options.map((o) => o.value)
          expect(new Set(vals).size).toBe(vals.length)

          vals.forEach((v) => {
            expect(Number(v.toFixed(2))).toBe(v)
          })

          q.options
            .filter((o) => !o.correct)
            .forEach((o) => {
              if (q.answer === 0) return
              // Near-miss band: wrong options must look tempting
              expect(Math.abs(o.value)).toBeGreaterThan(Math.abs(q.answer) * 0.5)
              expect(Math.abs(o.value)).toBeLessThan(Math.abs(q.answer) * 2.0)
              expect(o.errorMode).toBeTruthy()
            })

          expect(heDict[q.narrativeKey]).toBeDefined()
          expect(heDict[q.solutionKey]).toBeDefined()
          q.options
            .filter((o) => !o.correct && o.errorMode)
            .forEach((o) => {
              expect(heDict[`err.${o.errorMode}`]).toBeDefined()
            })

          const verified = verifyIndependently(gen.id, raw)
          expect(Number(verified.toFixed(2))).toBe(Number(raw.answer.toFixed(2)))
        }
      })
    }
  }
})
