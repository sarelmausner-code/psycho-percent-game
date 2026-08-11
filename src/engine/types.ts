export interface Distractor {
  value: number
  errorMode: string
}

export interface GeneratorResult {
  narrativeKey: string
  params: Record<string, number>
  answer: number
  distractors: Distractor[]
  solutionKey: string
  timeTargetSec: number
}

export interface Generator {
  id: string
  topic: string
  subtopic: string
  generate: (rng: import('./rng').RNG, difficulty?: number) => GeneratorResult
}

export interface Option {
  value: number
  correct: boolean
  errorMode?: string
  label: 'א' | 'ב' | 'ג' | 'ד'
}

export interface GeneratedQuestion {
  generatorId: string
  topic: string
  subtopic: string
  narrativeKey: string
  params: Record<string, number>
  answer: number
  options: Option[]
  solutionKey: string
  timeTargetSec: number
  seed: number
  difficulty: number
}

export interface AnswerRecord {
  correct: boolean
  errorMode?: string
  value: number
  ms: number
  pointsEarned: number
}
