import { describe, expect, it } from 'vitest'
import { RNG } from '../../rng'
import { heDict } from '../../../i18n/t'
import { verifyIndependently } from '../../verify'
import { ALL_GENERATORS, materialize } from '../index'

describe('generators harness', () => {
  for (const gen of ALL_GENERATORS) {
    it(`${gen.id} produces valid questions across 1000 draws`, () => {
      for (let seed = 0; seed < 1000; seed++) {
        const raw = gen.generate(new RNG(seed))
        const q = materialize(gen, seed)

        // 1. unique correct among options
        const correctOpts = q.options.filter((o) => o.correct)
        expect(correctOpts).toHaveLength(1)
        expect(correctOpts[0]!.value).toBe(q.answer)

        // 2. no duplicate option values
        const vals = q.options.map((o) => o.value)
        expect(new Set(vals).size).toBe(vals.length)

        // 3. clean numbers (≤2 decimals)
        vals.forEach((v) => {
          expect(Number(v.toFixed(2))).toBe(v)
        })

        // 4. distractors in plausible band (skill: ~0.3×–3×)
        q.options
          .filter((o) => !o.correct)
          .forEach((o) => {
            if (q.answer === 0) return
            expect(Math.abs(o.value)).toBeGreaterThan(Math.abs(q.answer) * 0.25)
            expect(Math.abs(o.value)).toBeLessThan(Math.abs(q.answer) * 3.5)
          })

        // 5. error modes present
        q.options
          .filter((o) => !o.correct)
          .forEach((o) => expect(o.errorMode).toBeTruthy())

        // 6. i18n keys
        expect(heDict[q.narrativeKey]).toBeDefined()
        expect(heDict[q.solutionKey]).toBeDefined()
        q.options
          .filter((o) => !o.correct && o.errorMode)
          .forEach((o) => {
            expect(heDict[`err.${o.errorMode}`]).toBeDefined()
          })

        // 7. independent verification
        const verified = verifyIndependently(gen.id, raw)
        expect(Number(verified.toFixed(2))).toBe(Number(raw.answer.toFixed(2)))
      }
    })
  }
})
