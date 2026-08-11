import { RNG } from '../rng'
import { cleanNum, matchAnswerStyle, questionDifficulty } from '../difficulty'
import type { GeneratedQuestion, Generator, Option } from '../types'
import { percentOf } from './percentOf'
import { percentReversal } from './percentReversal'
import { percentChange } from './percentChange'
import { percentIs } from './percentIs'
import { successivePercent } from './successivePercent'
import {
  ratioPart,
  ratioScale,
  ratioWhole,
  ratioMix,
  ratioTriple,
} from './ratios'
import {
  meanSimple,
  meanMissing,
  meanWeighted,
  meanNeeded,
  meanRemove,
} from './averages'
import {
  rateSpeed,
  rateTime,
  rateDistance,
  rateAvgSpeed,
  rateWorkAlone,
  rateWorkTogether,
  rateMeeting,
} from './rate'

export const ALL_GENERATORS: Generator[] = [
  percentOf,
  percentReversal,
  percentChange,
  percentIs,
  successivePercent,
  ratioPart,
  ratioScale,
  ratioWhole,
  ratioMix,
  ratioTriple,
  meanSimple,
  meanMissing,
  meanWeighted,
  meanNeeded,
  meanRemove,
  rateSpeed,
  rateTime,
  rateDistance,
  rateAvgSpeed,
  rateWorkAlone,
  rateWorkTogether,
  rateMeeting,
]

export const LABELS = ['א', 'ב', 'ג', 'ד'] as const

export function materialize(
  gen: Generator,
  seed: number,
  difficulty = 1,
): GeneratedQuestion {
  const rng = new RNG(seed)
  let raw = gen.generate(rng, difficulty)
  let attempt = 0
  while (raw.distractors.length < 3 && attempt < 8) {
    attempt++
    raw = gen.generate(new RNG(seed + attempt * 7919), difficulty)
  }

  const answer = cleanNum(raw.answer)
  const distractors = raw.distractors.map((d) => ({
    ...d,
    value: matchAnswerStyle(d.value, answer),
  }))

  const seen = new Set<number>([answer])
  const uniqueDistractors = distractors.filter((d) => {
    if (seen.has(d.value)) return false
    seen.add(d.value)
    return true
  })

  while (uniqueDistractors.length < 3) {
    const n = uniqueDistractors.length + 1
    const fallback = matchAnswerStyle(
      answer + (Number.isInteger(answer) ? 10 * n : answer * 0.1 * n),
      answer,
    )
    if (!seen.has(fallback) && fallback !== answer) {
      uniqueDistractors.push({ value: fallback, errorMode: 'guessed_round_up' })
      seen.add(fallback)
    } else {
      uniqueDistractors.push({
        value: matchAnswerStyle(answer - 5 * n, answer),
        errorMode: 'guessed_round_up',
      })
      break
    }
  }

  const optionsRaw = [
    { value: answer, correct: true as const },
    ...uniqueDistractors.slice(0, 3).map((d) => ({
      value: d.value,
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
    answer,
    options,
    solutionKey: raw.solutionKey,
    timeTargetSec: raw.timeTargetSec,
    seed,
    difficulty,
  }
}

export function buildStageQuestions(count: number, baseSeed: number): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = []
  for (let i = 0; i < count; i++) {
    const gen = ALL_GENERATORS[i % ALL_GENERATORS.length]!
    const diff = questionDifficulty(1, i, count)
    questions.push(materialize(gen, baseSeed + i * 9973, diff))
  }
  return questions
}

const BY_ID: Record<string, Generator> = Object.fromEntries(
  ALL_GENERATORS.map((g) => [g.id, g]),
)

export function buildStageQuestionsFromPlan(
  generatorIds: string[],
  count: number,
  baseSeed: number,
  timeScale = 1,
  stageBaseDifficulty = 1,
): GeneratedQuestion[] {
  const pool = generatorIds.length ? generatorIds : ALL_GENERATORS.map((g) => g.id)
  const orderRng = new RNG(baseSeed ^ 0x9e3779b9)
  const shuffledPool = orderRng.shuffle(pool)

  const questions: GeneratedQuestion[] = []
  const usedFingerprints = new Set<string>()

  for (let i = 0; i < count; i++) {
    const id = shuffledPool[i % shuffledPool.length]!
    const gen = BY_ID[id] ?? ALL_GENERATORS[i % ALL_GENERATORS.length]!
    const diff = questionDifficulty(stageBaseDifficulty, i, count)

    let q: GeneratedQuestion | null = null
    for (let tryN = 0; tryN < 12; tryN++) {
      const seed = baseSeed + i * 9973 + gen.id.length * 17 + tryN * 1301
      const candidate = materialize(gen, seed, diff)
      const fp = `${candidate.generatorId}:${candidate.narrativeKey}:${JSON.stringify(candidate.params)}`
      if (usedFingerprints.has(fp)) continue
      usedFingerprints.add(fp)
      q = candidate
      break
    }
    if (!q) {
      q = materialize(gen, baseSeed + i * 9973, diff)
    }

    if (timeScale !== 1) {
      q.timeTargetSec = Math.max(16, Math.round(q.timeTargetSec * timeScale))
    }
    if (i >= Math.floor(count * 0.6)) {
      q.timeTargetSec = Math.max(16, Math.round(q.timeTargetSec * 0.92))
    }
    questions.push(q)
  }
  return questions
}

export {
  percentOf,
  percentReversal,
  percentChange,
  percentIs,
  successivePercent,
  ratioPart,
  ratioScale,
  ratioWhole,
  ratioMix,
  ratioTriple,
  meanSimple,
  meanMissing,
  meanWeighted,
  meanNeeded,
  meanRemove,
  rateSpeed,
  rateTime,
  rateDistance,
  rateAvgSpeed,
  rateWorkAlone,
  rateWorkTogether,
  rateMeeting,
}
