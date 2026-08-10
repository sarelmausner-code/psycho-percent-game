import { RNG } from '../rng'
import type { GeneratedQuestion, Generator, Option } from '../types'
import { percentOf } from './percentOf'
import { percentReversal } from './percentReversal'
import { percentChange } from './percentChange'

export const ALL_GENERATORS: Generator[] = [percentOf, percentReversal, percentChange]

export const LABELS = ['א', 'ב', 'ג', 'ד'] as const

export function materialize(gen: Generator, seed: number): GeneratedQuestion {
  const rng = new RNG(seed)
  const raw = gen.generate(rng)

  // Ensure distractors don't collide with answer; tweak if needed
  const distractors = raw.distractors.map((d) => {
    let v = cleanNum(d.value)
    if (v === raw.answer) v = cleanNum(v + (v === 0 ? 1 : Math.sign(v) || 1))
    return { ...d, value: v }
  })

  // Dedupe distractor values
  const seen = new Set<number>([raw.answer])
  const uniqueDistractors = distractors.filter((d) => {
    if (seen.has(d.value)) return false
    seen.add(d.value)
    return true
  })

  while (uniqueDistractors.length < 3) {
    const fallback = cleanNum(raw.answer * (0.5 + uniqueDistractors.length * 0.3))
    if (!seen.has(fallback) && fallback !== raw.answer) {
      uniqueDistractors.push({ value: fallback, errorMode: 'guessed_round_up' })
      seen.add(fallback)
    } else {
      uniqueDistractors.push({
        value: cleanNum(raw.answer + 10 + uniqueDistractors.length * 5),
        errorMode: 'guessed_round_up',
      })
    }
  }

  const optionsRaw = [
    { value: cleanNum(raw.answer), correct: true as const },
    ...uniqueDistractors.slice(0, 3).map((d) => ({
      value: cleanNum(d.value),
      correct: false as const,
      errorMode: d.errorMode,
    })),
  ]

  const shuffled = rng.shuffle(optionsRaw)
  const options: Option[] = shuffled.map((o, i) => ({
    ...o,
    label: LABELS[i]!,
  }))

  return {
    generatorId: gen.id,
    topic: gen.topic,
    subtopic: gen.subtopic,
    narrativeKey: raw.narrativeKey,
    params: raw.params,
    answer: cleanNum(raw.answer),
    options,
    solutionKey: raw.solutionKey,
    timeTargetSec: raw.timeTargetSec,
    seed,
  }
}

export function buildStageQuestions(count: number, baseSeed: number): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = []
  for (let i = 0; i < count; i++) {
    const gen = ALL_GENERATORS[i % ALL_GENERATORS.length]!
    questions.push(materialize(gen, baseSeed + i * 9973))
  }
  return questions
}

const BY_ID: Record<string, Generator> = Object.fromEntries(
  ALL_GENERATORS.map((g) => [g.id, g]),
)

/** Build questions from a stage plan (generator id list + count). */
export function buildStageQuestionsFromPlan(
  generatorIds: string[],
  count: number,
  baseSeed: number,
  timeScale = 1,
): GeneratedQuestion[] {
  const pool = generatorIds.length ? generatorIds : ALL_GENERATORS.map((g) => g.id)
  const questions: GeneratedQuestion[] = []
  for (let i = 0; i < count; i++) {
    const id = pool[i % pool.length]!
    const gen = BY_ID[id] ?? ALL_GENERATORS[i % ALL_GENERATORS.length]!
    const q = materialize(gen, baseSeed + i * 9973 + gen.id.length * 17)
    if (timeScale !== 1) {
      q.timeTargetSec = Math.max(18, Math.round(q.timeTargetSec * timeScale))
    }
    questions.push(q)
  }
  return questions
}

function cleanNum(n: number): number {
  const r = Math.round(n * 100) / 100
  return Object.is(r, -0) ? 0 : r
}

export { percentOf, percentReversal, percentChange }
