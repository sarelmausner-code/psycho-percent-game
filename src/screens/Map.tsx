import { bootAudio, isMuted, toggleMute } from '../audio/engine'
import { stopMusic } from '../audio/music'
import { playClick } from '../audio/sfx'
import {
  getWorld,
  isStageUnlocked,
  isWorldUnlocked,
  stageKey,
  worldStars,
} from '../engine/worlds'
import { Num } from '../components/Num'
import { t } from '../i18n/t'
import { useGameStore } from '../store/gameStore'
import { useState } from 'react'

export function Map() {
  const starsByKey = useGameStore((s) => s.starsByKey)
  const currentWorldId = useGameStore((s) => s.currentWorldId)
  const recommendStageId = useGameStore((s) => s.recommendStageId)
  const bestScore = useGameStore((s) => s.bestScore)
  const startStage = useGameStore((s) => s.startStage)
  const openWorlds = useGameStore((s) => s.openWorlds)
  const goHome = useGameStore((s) => s.goHome)
  const [muted, setMuted] = useState(isMuted)

  const world = getWorld(currentWorldId)
  const stages = world?.stages ?? []
  const unlockedWorld = isWorldUnlocked(currentWorldId, starsByKey)
  const totalStars = worldStars(currentWorldId, starsByKey)
  const completed = stages.filter(
    (st) => (starsByKey[stageKey(currentWorldId, st.id)] ?? 0) >= 1,
  ).length

  async function onPlay(stageId: number) {
    if (!unlockedWorld || !isStageUnlocked(currentWorldId, stageId, starsByKey)) return
    await bootAudio()
    playClick()
    startStage(currentWorldId, stageId)
  }

  function onMute() {
    const next = toggleMute()
    setMuted(next)
    if (next) stopMusic()
  }

  if (!world) {
    return (
      <div className="screen map-screen">
        <p className="hint">{t('end.missing')}</p>
        <button type="button" className="btn-secondary" onClick={openWorlds}>
          {t('worlds.title')}
        </button>
      </div>
    )
  }

  return (
    <div className="screen map-screen">
      <header className="map-header">
        <button type="button" className="chip" onClick={openWorlds}>
          ← {t('worlds.title')}
        </button>
        <div className="map-header-mid">
          <h1 className="map-title">
            {world.emoji} {t(world.titleKey)}
          </h1>
          <p className="map-sub">{t(world.blurbKey)}</p>
        </div>
        <button type="button" className="chip" onClick={onMute} aria-label="mute">
          {muted ? '🔇' : '🔊'}
        </button>
      </header>

      <div className="map-stats">
        <span className="stat-pill">
          ⭐ <Num>{totalStars}</Num>/{stages.length * 3}
        </span>
        <span className="stat-pill">
          {t('map.completed', { n: completed }).replace('8', String(stages.length))}
        </span>
        {bestScore > 0 && (
          <span className="stat-pill chip-best">
            🏆 <Num>{bestScore}</Num>
          </span>
        )}
      </div>

      {!unlockedWorld && (
        <div className="wrong-panel" style={{ marginBottom: 12 }}>
          <p className="wrong-title">{t('worlds.locked')}</p>
          <p className="wrong-err">{t(`world.unlock.${currentWorldId}`)}</p>
          <button type="button" className="btn-secondary" onClick={goHome}>
            {t('map.home')}
          </button>
        </div>
      )}

      <div className="map-list">
        {stages.map((stage, i) => {
          const unlocked =
            unlockedWorld && isStageUnlocked(currentWorldId, stage.id, starsByKey)
          const stars = starsByKey[stageKey(currentWorldId, stage.id)] ?? 0
          const isNext = stage.id === recommendStageId && unlocked
          return (
            <button
              key={stage.id}
              type="button"
              className={`map-card ${unlocked ? 'map-card-open' : 'map-card-locked'} ${isNext ? 'map-card-next' : ''} ${stars > 0 ? 'map-card-done' : ''}`}
              disabled={!unlocked}
              onClick={() => onPlay(stage.id)}
            >
              <div className="map-card-rail" aria-hidden>
                <span className={`map-node ${unlocked ? 'on' : ''} ${stars > 0 ? 'done' : ''}`}>
                  {unlocked ? stage.emoji : '🔒'}
                </span>
                {i < stages.length - 1 && (
                  <span className={`map-line ${unlocked ? 'on' : ''}`} />
                )}
              </div>

              <div className="map-card-body">
                <div className="map-card-top">
                  <span className="map-stage-num">
                    {t('map.stage_n', { n: stage.id })}
                  </span>
                  {isNext && <span className="map-badge-next">{t('map.continue')}</span>}
                  {stars > 0 && !isNext && (
                    <span className="map-badge-done">{t('map.replay')}</span>
                  )}
                </div>
                <h2 className="map-card-title">{t(stage.titleKey)}</h2>
                <p className="map-card-blurb">{t(stage.blurbKey)}</p>
                <div className="map-card-foot">
                  <span className="map-stars" aria-label={`${stars} stars`}>
                    {[1, 2, 3].map((k) => (
                      <span key={k} className={stars >= k ? 'on' : ''}>
                        ⭐
                      </span>
                    ))}
                  </span>
                  <span className="map-qcount">
                    <Num>{stage.questionCount}</Num> {t('map.questions')}
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
