import { create } from 'zustand'
import { setMusicCombo, startMusic, stopMusic } from '../audio/music'
import { loadProgress, saveStageResult } from '../db/progress'
import { buildStageQuestionsFromPlan } from '../engine/generators'
import {
  getStageDef,
  getWorld,
  isStageUnlocked,
  isWorldUnlocked,
  recommendInWorld,
  recommendTarget,
  stageKey,
  type StageDef,
  type WorldId,
} from '../engine/worlds'
import {
  comboMultiplier,
  didPassStage,
  pickPraiseDetailed,
  pointsForAnswer,
  starsForStage,
  toTrainingScore,
  type PraiseKind,
  type SpeedTier,
} from '../engine/scoring'
import type { AnswerRecord, GeneratedQuestion } from '../engine/types'

export type Screen = 'home' | 'worlds' | 'map' | 'play' | 'end'

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
  worldId: WorldId
  stageId: number
  stageTitleKey: string
  worldTitleKey: string
  accuracy: number
  correctCount: number
  wrongCount: number
  total: number
  points: number
  score: number
  stars: 0 | 1 | 2 | 3
  passed: boolean
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
  /** worldId:stageId → stars */
  starsByKey: Record<string, number>
  currentWorldId: WorldId
  currentStageId: number | null
  currentStage: StageDef | null
  recommendWorldId: WorldId
  recommendStageId: number
  lastWasWrong: boolean
  recentPraises: string[]

  hydrate: () => Promise<void>
  openWorlds: () => void
  openMap: (worldId?: WorldId) => void
  goHome: () => void
  startStage: (worldId?: WorldId, stageId?: number) => void
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
  worldId: WorldId
  stageId: number
  stageTitleKey: string
  worldTitleKey: string
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

  const stars = starsForStage(accuracy, avgMs, avgTarget)
  return {
    worldId: input.worldId,
    stageId: input.stageId,
    stageTitleKey: input.stageTitleKey,
    worldTitleKey: input.worldTitleKey,
    accuracy,
    correctCount,
    wrongCount,
    total: input.answers.length || input.questions.length,
    points: input.totalPoints,
    score,
    stars,
    passed: didPassStage(accuracy),
    maxCombo: input.maxCombo,
    mult: comboMultiplier(input.maxCombo),
    wasNewRecord: score > input.prevBest && didPassStage(accuracy),
    unlockedNext: input.unlockedNext,
    nextStageId: input.nextStageId,
    lightningCount: recap.filter((r) => r.speedTier === 'lightning').length,
    fastCount: recap.filter((r) => r.speedTier === 'fast' || r.speedTier === 'lightning').length,
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
  starsByKey: {},
  currentWorldId: 'percentages',
  currentStageId: null,
  currentStage: null,
  recommendWorldId: 'percentages',
  recommendStageId: 1,
  lastWasWrong: false,
  recentPraises: [],

  hydrate: async () => {
    try {
      const { bestScore, starsByKey } = await loadProgress()
      const rec = recommendTarget(starsByKey)
      set({
        ready: true,
        bestScore,
        starsByKey,
        recommendWorldId: rec.worldId,
        recommendStageId: rec.stageId,
      })
    } catch (e) {
      console.error('hydrate failed', e)
      set({ ready: true })
    }
  },

  openWorlds: () => {
    stopMusic()
    const rec = recommendTarget(get().starsByKey)
    set({
      screen: 'worlds',
      locked: false,
      lastFeedback: null,
      burst: null,
      recommendWorldId: rec.worldId,
      recommendStageId: rec.stageId,
    })
  },

  openMap: (worldId) => {
    stopMusic()
    const starsByKey = get().starsByKey
    const wid = worldId ?? get().currentWorldId
    if (!isWorldUnlocked(wid, starsByKey) && getWorld(wid)?.status === 'live') {
      // still allow opening locked live worlds to show lock UI — use unlock check in UI
    }
    set({
      screen: 'map',
      currentWorldId: wid,
      locked: false,
      lastFeedback: null,
      burst: null,
      recommendStageId: recommendInWorld(wid, starsByKey),
    })
  },

  goHome: () => {
    stopMusic()
    const rec = recommendTarget(get().starsByKey)
    set({
      screen: 'home',
      locked: false,
      lastFeedback: null,
      burst: null,
      recommendWorldId: rec.worldId,
      recommendStageId: rec.stageId,
    })
  },

  startStage: (worldId, stageId) => {
    const starsByKey = get().starsByKey
    const rec = recommendTarget(starsByKey)
    const wid = worldId ?? rec.worldId
    const sid = stageId ?? recommendInWorld(wid, starsByKey)

    if (!isWorldUnlocked(wid, starsByKey)) return
    if (!isStageUnlocked(wid, sid, starsByKey)) return

    const def = getStageDef(wid, sid)
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
      currentWorldId: wid,
      currentStageId: sid,
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
        difficulty: q.difficulty ?? 1,
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
  const worldId = s.currentWorldId
  const stageId = s.currentStageId ?? 1
  const def = s.currentStage ?? getStageDef(worldId, stageId)
  const world = getWorld(worldId)
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
  const passed = didPassStage(accuracy)

  const key = stageKey(worldId, stageId)
  const prevStars = { ...s.starsByKey }
  // Never overwrite a previous pass with a fail (0 stars)
  const newStarsForStage = Math.max(prevStars[key] ?? 0, stars)
  const starsByKey = { ...prevStars, [key]: newStarsForStage }
  const best = passed ? Math.max(prevBest, score) : prevBest

  const maxStage = world?.stages.length ?? 8
  const nextId = stageId < maxStage ? stageId + 1 : null
  // Next stage only if this run (or a previous one) has ≥1 star = ≥50% accuracy
  const canOpenNext = newStarsForStage >= 1
  const unlockedNextThisRun =
    passed && nextId != null && (prevStars[key] ?? 0) < 1

  const stageSummary = buildSummary({
    answers: s.answers,
    questions: s.questions,
    totalPoints: s.totalPoints,
    maxCombo: s.maxCombo,
    bestScore: Math.max(prevBest, best),
    prevBest,
    worldId,
    stageId,
    stageTitleKey: def?.titleKey ?? 'pct.stage.1.title',
    worldTitleKey: world?.titleKey ?? 'world.percentages.title',
    unlockedNext: Boolean(unlockedNextThisRun),
    nextStageId: nextId && canOpenNext ? nextId : null,
  })
  stageSummary.passed = passed
  stageSummary.stars = stars
  stageSummary.wasNewRecord = passed && score > prevBest

  try {
    // Save attempt; stars only increase, so fails don't wipe a prior unlock
    await saveStageResult({
      worldId,
      stageId,
      stars,
      score: passed ? score : prevBest,
      bestScore: best,
    })
  } catch (e) {
    console.error('saveStageResult failed', e)
  }

  window.setTimeout(() => stopMusic(), 2200)

  const rec = recommendTarget(starsByKey)
  useGameStore.setState({
    screen: 'end',
    locked: false,
    lastFeedback: null,
    bestScore: best,
    burst: null,
    stageSummary,
    starsByKey,
    recommendWorldId: rec.worldId,
    recommendStageId: rec.stageId,
  })
}
