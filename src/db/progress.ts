import Dexie, { type EntityTable } from 'dexie'

export interface ProfileRow {
  id: number // always 1
  bestScore: number
  totalStars: number
  stagesCompleted: number
  updatedAt: number
}

export interface StageRow {
  stageId: number
  stars: number // 0–3
  bestScore: number
  plays: number
  lastPlayedAt: number
}

class PsychoDB extends Dexie {
  profile!: EntityTable<ProfileRow, 'id'>
  stages!: EntityTable<StageRow, 'stageId'>

  constructor() {
    super('psycho_progress_v1')
    this.version(1).stores({
      profile: 'id',
      stages: 'stageId',
    })
  }
}

export const db = new PsychoDB()

export async function loadProgress(): Promise<{
  bestScore: number
  starsByStage: Record<number, number>
  stageRows: StageRow[]
}> {
  const profile = await db.profile.get(1)
  const stageRows = await db.stages.toArray()
  const starsByStage: Record<number, number> = {}
  for (const row of stageRows) {
    starsByStage[row.stageId] = row.stars
  }
  return {
    bestScore: profile?.bestScore ?? 0,
    starsByStage,
    stageRows,
  }
}

export async function saveStageResult(input: {
  stageId: number
  stars: number
  score: number
  bestScore: number
}): Promise<void> {
  const existing = await db.stages.get(input.stageId)
  const stars = Math.max(existing?.stars ?? 0, input.stars)
  const bestScore = Math.max(existing?.bestScore ?? 0, input.score)
  const plays = (existing?.plays ?? 0) + 1

  await db.stages.put({
    stageId: input.stageId,
    stars,
    bestScore,
    plays,
    lastPlayedAt: Date.now(),
  })

  const all = await db.stages.toArray()
  const totalStars = all.reduce((s, r) => s + r.stars, 0)
  const stagesCompleted = all.filter((r) => r.stars >= 1).length
  const globalBest = Math.max(input.bestScore, ...all.map((r) => r.bestScore), 0)

  await db.profile.put({
    id: 1,
    bestScore: globalBest,
    totalStars,
    stagesCompleted,
    updatedAt: Date.now(),
  })
}
