import { create } from 'zustand'
import { setMusicCombo, startMusic, stopMusic } from '../audio/music'
import { loadProgress, saveStageResult } from '../db/progress'
import { buildStageQuestionsFromPlan } from '../engine/generators'
import {
  getStageDef,
  isStageUnlocked,
  recommendStageId,
  type StageDef,
} from '../engine/stages'
import {
  comboMultiplier,
  pickPraiseDetailed,
  pointsForAnswer,
  starsForStage,
  toTrainingScore,
  type PraiseKind,
  type SpeedTier,
} from '../engine/scoring'
import type { AnswerRecord, GeneratedQuestion } from '../engine/types'

export type Screen = 'home' | 'map' | 'play' | 'end'

export interface QuestionRecap {
  index: number
  correct: boolean
  ms: number
  points: number
  errorMode?: string
  answer: number
  chosen: number
  speedTier: SpeedTier
}

export interface StageSummary {
  stageId: number
  stageTitleKey: string
  accuracy: number
  correctCount: number
  wrongCount: number
  total: number
  points: number
  score: number
  stars: 1 | 2 | 3
  maxCombo: number
  mult: number
  wasNewRecord: boolean
  unlockedNext: boolean
  nextStageId: number | null
  lightningCount: number
  fastCount: number
  avgSec: number
  totalSec: number
  bestScore: number
  recap: QuestionRecap[]
}

interface GameState {
  ready: boolean
  screen: Screen
  questions: GeneratedQuestion[]
  index: number
  combo: number
  maxCombo: number
  totalPoints: number
  answers: AnswerRecord[]
  bestScore: number
  locked: boolean
  lastFeedback: null | {
    correct: boolean
    errorMode?: string
    value: number
    points: number
    praise?: string
    praiseKind?: PraiseKind
    speedTier?: SpeedTier
    speedBonus?: number
    ms?: number
  }
  questionStartedAt: number
  burst: { x: number; y: number; id: number } | null
  lightningCount: number
  stageSummary: StageSummary | null
  /** stars 0–3 per stage id */
  starsByStage: Record<number, number>
  currentStageId: number | null
  currentStage: StageDef | null
  recommendId: number
  lastWasWrong: boolean
  recentPraises: string[]

  hydrate: () => Promise<void>
  openMap: () => void
  goHome: () => void
  startStage: (stageId?: number) => void
  submitAnswer: (value: number, errorMode: string | undefined, clientX: number, clientY: number) => void
  advanceAfterWrong: () => void
  clearBurst: () => void
}

function buildSummary(input: {
  answers: AnswerRecord[]
  questions: GeneratedQuestion[]
  totalPoints: number
  maxCombo: number
  bestScore: number
  prevBest: number
  stageId: number
  stageTitleKey: string
  unlockedNext: boolean
  nextStageId: number | null
}): StageSummary {
  const correctCount = input.answers.filter((a) => a.correct).length
  const wrongCount = input.answers.length - correctCount
  const accuracy = input.answers.length ? correctCount / input.answers.length : 0
  const totalMs = input.answers.reduce((a, b) => a + b.ms, 0)
  const avgMs = input.answers.length > 0 ? totalMs / input.answers.length : 0
  const avgTarget =
    input.questions.length > 0
      ? input.questions.reduce((a, q) => a + q.timeTargetSec, 0) / input.questions.length
      : 35
  const score = toTrainingScore(input.totalPoints, accuracy)

  const recap: QuestionRecap[] = input.answers.map((a, i) => {
    const q = input.questions[i]
    const target = (q?.timeTargetSec ?? 35) * 1000
    const ratio = target > 0 ? a.ms / target : 1
    let speedTier: SpeedTier = 'slow'
    if (a.correct) {
      if (ratio < 0.35) speedTier = 'lightning'
      else if (ratio < 0.55) speedTier = 'fast'
      else if (ratio <= 1) speedTier = 'ok'
      else speedTier = 'slow'
    }
    return {
      index: i + 1,
      correct: a.correct,
      ms: a.ms,
      points: a.pointsEarned,
      errorMode: a.errorMode,
      answer: q?.answer ?? 0,
      chosen: a.value,
      speedTier,
    }
  })

  const lightningCount = recap.filter((r) => r.speedTier === 'lightning').length
  const fastCount = recap.filter(
    (r) => r.speedTier === 'fast' || r.speedTier === 'lightning',
  ).length

  return {
    stageId: input.stageId,
    stageTitleKey: input.stageTitleKey,
    accuracy,
    correctCount,
    wrongCount,
    total: input.answers.length || input.questions.length,
    points: input.totalPoints,
    score,
    stars: starsForStage(accuracy, avgMs, avgTarget),
    maxCombo: input.maxCombo,
    mult: comboMultiplier(input.maxCombo),
    wasNewRecord: score > input.prevBest,
    unlockedNext: input.unlockedNext,
    nextStageId: input.nextStageId,
    lightningCount,
    fastCount,
    avgSec: avgMs / 1000,
    totalSec: totalMs / 1000,
    bestScore: input.bestScore,
    recap,
  }
}

export const useGameStore = create<GameState>((set, get) => ({
  ready: false,
  screen: 'home',
  questions: [],
  index: 0,
  combo: 0,
  maxCombo: 0,
  totalPoints: 0,
  answers: [],
  bestScore: 0,
  locked: false,
  lastFeedback: null,
  questionStartedAt: 0,
  burst: null,
  lightningCount: 0,
  stageSummary: null,
  starsByStage: {},
  currentStageId: null,
  currentStage: null,
  recommendId: 1,
  lastWasWrong: false,
  recentPraises: [],

  hydrate: async () => {
    try {
      const { bestScore, starsByStage } = await loadProgress()
      set({
        ready: true,
        bestScore,
        starsByStage,
        recommendId: recommendStageId(starsByStage),
      })
    } catch (e) {
      console.error('hydrate failed', e)
      set({ ready: true, recommendId: 1 })
    }
  },

  openMap: () => {
    stopMusic()
    const starsByStage = get().starsByStage
    set({
      screen: 'map',
      locked: false,
      lastFeedback: null,
      burst: null,
      recommendId: recommendStageId(starsByStage),
    })
  },

  goHome: () => {
    stopMusic()
    set({
      screen: 'home',
      locked: false,
      lastFeedback: null,
      burst: null,
      recommendId: recommendStageId(get().starsByStage),
    })
  },

  startStage: (stageId?: number) => {
    const starsByStage = get().starsByStage
    const id = stageId ?? recommendStageId(starsByStage)
    if (!isStageUnlocked(id, starsByStage)) return

    const def = getStageDef(id)
    if (!def) return

    const seed = Date.now() % 1_000_000
    const questions = buildStageQuestionsFromPlan(
      def.generators,
      def.questionCount,
      seed,
      def.timeScale ?? 1,
      def.baseDifficulty,
    )

    stopMusic()
    startMusic()
    setMusicCombo(0)

    set({
      screen: 'play',
      questions,
      index: 0,
      combo: 0,
      maxCombo: 0,
      totalPoints: 0,
      answers: [],
      locked: false,
      lastFeedback: null,
      questionStartedAt: performance.now(),
      burst: null,
      lightningCount: 0,
      stageSummary: null,
      currentStageId: id,
      currentStage: def,
      lastWasWrong: false,
      recentPraises: [],
    })
  },

  submitAnswer: (value, errorMode, clientX, clientY) => {
    const s = get()
    if (s.locked || s.screen !== 'play') return
    const q = s.questions[s.index]
    if (!q) return

    const ms = performance.now() - s.questionStartedAt
    const correct = value === q.answer
    const scored = pointsForAnswer(
      correct,
      s.combo,
      ms,
      q.timeTargetSec,
      q.difficulty ?? 1,
    )
    const nextCombo = correct ? s.combo + 1 : 0

    const record: AnswerRecord = {
      correct,
      errorMode: correct ? undefined : errorMode,
      value,
      ms,
      pointsEarned: scored.total,
    }

    const answers = [...s.answers, record]
    const totalPoints = s.totalPoints + scored.total
    const maxCombo = Math.max(s.maxCombo, nextCombo)
    const lightningCount =
      s.lightningCount + (correct && scored.tier === 'lightning' ? 1 : 0)

    let praise: string | undefined
    let praiseKind: PraiseKind | undefined
    let recentPraises = s.recentPraises
    if (correct) {
      const picked = pickPraiseDetailed({
        combo: nextCombo,
        tier: scored.tier,
        recovered: s.lastWasWrong,
        questionIndex: s.index,
        totalQuestions: s.questions.length,
        recent: s.recentPraises,
      })
      praise = picked.text
      praiseKind = picked.kind
      recentPraises = [...s.recentPraises, praise].slice(-6)
    }

    setMusicCombo(nextCombo)

    set({
      locked: true,
      combo: nextCombo,
      maxCombo,
      totalPoints,
      answers,
      lightningCount,
      lastWasWrong: !correct,
      recentPraises,
      lastFeedback: {
        correct,
        errorMode,
        value,
        points: scored.total,
        praise,
        praiseKind,
        speedTier: scored.tier,
        speedBonus: scored.speed * scored.mult,
        ms,
      },
      burst: correct ? { x: clientX, y: clientY, id: Date.now() } : null,
    })

    if (correct) {
      const delay = scored.tier === 'lightning' ? 1300 : 1150
      window.setTimeout(() => {
        const cur = get()
        if (cur.screen !== 'play') return
        if (cur.index + 1 >= cur.questions.length) {
          void finishStage()
        } else {
          set({
            index: cur.index + 1,
            locked: false,
            lastFeedback: null,
            questionStartedAt: performance.now(),
            burst: null,
          })
        }
      }, delay)
    }
  },

  advanceAfterWrong: () => {
    const cur = get()
    if (!cur.lastFeedback || cur.lastFeedback.correct) return
    setMusicCombo(0)
    if (cur.index + 1 >= cur.questions.length) {
      void finishStage()
    } else {
      set({
        index: cur.index + 1,
        locked: false,
        lastFeedback: null,
        questionStartedAt: performance.now(),
        burst: null,
      })
    }
  },

  clearBurst: () => set({ burst: null }),
}))

async function finishStage() {
  const s = useGameStore.getState()
  const stageId = s.currentStageId ?? 1
  const def = s.currentStage ?? getStageDef(stageId)
  const prevBest = s.bestScore
  const correctCount = s.answers.filter((a) => a.correct).length
  const accuracy = s.answers.length ? correctCount / s.answers.length : 0
  const score = toTrainingScore(s.totalPoints, accuracy)
  const avgMs =
    s.answers.length > 0
      ? s.answers.reduce((a, b) => a + b.ms, 0) / s.answers.length
      : 0
  const avgTarget =
    s.questions.length > 0
      ? s.questions.reduce((a, q) => a + q.timeTargetSec, 0) / s.questions.length
      : 35
  const stars = starsForStage(accuracy, avgMs, avgTarget)

  const prevStars = { ...s.starsByStage }
  const newStarsForStage = Math.max(prevStars[stageId] ?? 0, stars)
  const starsByStage = { ...prevStars, [stageId]: newStarsForStage }
  const best = Math.max(prevBest, score)

  const nextId = stageId < 8 ? stageId + 1 : null
  const unlockedNext =
    nextId != null &&
    (prevStars[stageId] ?? 0) < 1 &&
    newStarsForStage >= 1

  const stageSummary = buildSummary({
    answers: s.answers,
    questions: s.questions,
    totalPoints: s.totalPoints,
    maxCombo: s.maxCombo,
    bestScore: best,
    prevBest,
    stageId,
    stageTitleKey: def?.titleKey ?? 'stage.1.title',
    unlockedNext: Boolean(unlockedNext || (nextId && isStageUnlocked(nextId, starsByStage))),
    nextStageId: nextId && isStageUnlocked(nextId, starsByStage) ? nextId : null,
  })
  // wasNewRecord for stage best / global
  stageSummary.wasNewRecord = score > prevBest

  try {
    await saveStageResult({ stageId, stars, score, bestScore: best })
  } catch (e) {
    console.error('saveStageResult failed', e)
  }

  window.setTimeout(() => stopMusic(), 2200)

  useGameStore.setState({
    screen: 'end',
    locked: false,
    lastFeedback: null,
    bestScore: best,
    burst: null,
    stageSummary,
    starsByStage,
    recommendId: recommendStageId(starsByStage),
  })
}
