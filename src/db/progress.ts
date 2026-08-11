import Dexie, { type EntityTable } from 'dexie'
import type { WorldId } from '../engine/worlds'
import { stageKey } from '../engine/worlds'

export interface ProfileRow {
  id: number
  bestScore: number
  totalStars: number
  stagesCompleted: number
  updatedAt: number
}

/** Compound progress key: worldId:stageId */
export interface StageRow {
  key: string
  worldId: string
  stageId: number
  stars: number
  bestScore: number
  plays: number
  lastPlayedAt: number
}

class PsychoDB extends Dexie {
  profile!: EntityTable<ProfileRow, 'id'>
  stages!: EntityTable<StageRow, 'key'>

  constructor() {
    super('psycho_progress_v2')
    this.version(1).stores({
      profile: 'id',
      stages: 'key, worldId, stageId',
    })
  }
}

export const db = new PsychoDB()

export async function loadProgress(): Promise<{
  bestScore: number
  starsByKey: Record<string, number>
  stageRows: StageRow[]
}> {
  // Migrate v1 flat stage ids → percentages:N if old DB exists
  await migrateV1IfNeeded()

  const profile = await db.profile.get(1)
  const stageRows = await db.stages.toArray()
  const starsByKey: Record<string, number> = {}
  for (const row of stageRows) {
    starsByKey[row.key] = row.stars
  }
  return {
    bestScore: profile?.bestScore ?? 0,
    starsByKey,
    stageRows,
  }
}

async function migrateV1IfNeeded() {
  try {
    const old = await new Dexie('psycho_progress_v1').open()
    if (!old.tables.some((t) => t.name === 'stages')) {
      old.close()
      return
    }
    const oldStages = await old.table('stages').toArray()
    const existing = await db.stages.count()
    if (existing === 0 && oldStages.length > 0) {
      for (const row of oldStages as { stageId: number; stars: number; bestScore: number; plays: number; lastPlayedAt: number }[]) {
        const key = stageKey('percentages', row.stageId)
        await db.stages.put({
          key,
          worldId: 'percentages',
          stageId: row.stageId,
          stars: row.stars,
          bestScore: row.bestScore,
          plays: row.plays,
          lastPlayedAt: row.lastPlayedAt,
        })
      }
      const oldProfile = await old.table('profile').get(1)
      if (oldProfile) {
        await db.profile.put(oldProfile as ProfileRow)
      }
    }
    old.close()
  } catch {
    /* no v1 db */
  }
}

export async function saveStageResult(input: {
  worldId: WorldId
  stageId: number
  stars: number
  score: number
  bestScore: number
}): Promise<void> {
  const key = stageKey(input.worldId, input.stageId)
  const existing = await db.stages.get(key)
  const stars = Math.max(existing?.stars ?? 0, input.stars)
  const bestScore = Math.max(existing?.bestScore ?? 0, input.score)
  const plays = (existing?.plays ?? 0) + 1

  await db.stages.put({
    key,
    worldId: input.worldId,
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
