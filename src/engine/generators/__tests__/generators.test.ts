import { describe, expect, it } from 'vitest'
import { RNG } from '../../rng'
import { heDict } from '../../../i18n/t'
import { roundness } from '../../difficulty'
import { verifyIndependently } from '../../verify'
import { ALL_GENERATORS, materialize } from '../index'

describe('generators harness', () => {
  for (const gen of ALL_GENERATORS) {
    for (const difficulty of [1, 3, 5] as const) {
      it(`${gen.id} d${difficulty} valid across 200 draws`, () => {
        for (let seed = 0; seed < 200; seed++) {
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

          if (Number.isInteger(q.answer)) {
            q.options.forEach((o) => {
              expect(Number.isInteger(o.value)).toBe(true)
            })
          }

          q.options
            .filter((o) => !o.correct)
            .forEach((o) => {
              if (q.answer === 0) return
              expect(Math.abs(o.value)).toBeGreaterThan(Math.abs(q.answer) * 0.45)
              expect(Math.abs(o.value)).toBeLessThan(Math.abs(q.answer) * 2.2)
              expect(o.errorMode).toBeTruthy()
            })

          const ansR = roundness(q.answer)
          const distractorRounds = q.options
            .filter((o) => !o.correct)
            .map((o) => roundness(o.value))
          const maxWrong = Math.max(...distractorRounds)
          expect(maxWrong >= ansR - 0.5 || ansR <= 1 || distractorRounds.some((r) => r >= 0)).toBe(
            true,
          )

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
