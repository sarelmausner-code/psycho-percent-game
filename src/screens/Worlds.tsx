import { useState } from 'react'
import { isMuted, toggleMute } from '../audio/engine'
import { stopMusic } from '../audio/music'
import { playClick } from '../audio/sfx'
import {
  WORLDS,
  isWorldUnlocked,
  worldCompletedStages,
  worldStars,
} from '../engine/worlds'
import { Num } from '../components/Num'
import { t } from '../i18n/t'
import { useGameStore } from '../store/gameStore'

export function Worlds() {
  const starsByKey = useGameStore((s) => s.starsByKey)
  const bestScore = useGameStore((s) => s.bestScore)
  const openMap = useGameStore((s) => s.openMap)
  const goHome = useGameStore((s) => s.goHome)
  const startStage = useGameStore((s) => s.startStage)
  const recommendWorldId = useGameStore((s) => s.recommendWorldId)
  const recommendStageId = useGameStore((s) => s.recommendStageId)
  const [muted, setMuted] = useState(isMuted)

  function onMute() {
    const next = toggleMute()
    setMuted(next)
    if (next) stopMusic()
  }

  return (
    <div className="screen map-screen">
      <header className="map-header">
        <button type="button" className="chip" onClick={goHome}>
          ← {t('map.home')}
        </button>
        <div className="map-header-mid">
          <h1 className="map-title">{t('worlds.title')}</h1>
          <p className="map-sub">{t('worlds.sub')}</p>
        </div>
        <button type="button" className="chip" onClick={onMute} aria-label="mute">
          {muted ? '🔇' : '🔊'}
        </button>
      </header>

      {bestScore > 0 && (
        <div className="map-stats">
          <span className="stat-pill chip-best">
            🏆 <Num>{bestScore}</Num>
          </span>
        </div>
      )}

      <div className="worlds-grid">
        {WORLDS.map((world) => {
          const unlocked = isWorldUnlocked(world.id, starsByKey)
          const coming = world.status === 'coming'
          const stars = worldStars(world.id, starsByKey)
          const done = worldCompletedStages(world.id, starsByKey)
          const total = world.stages.length || 8
          const isRec = world.id === recommendWorldId && unlocked && !coming

          return (
            <button
              key={world.id}
              type="button"
              className={`world-card ${unlocked && !coming ? 'world-open' : 'world-locked'} ${isRec ? 'world-next' : ''}`}
              disabled={coming || !unlocked}
              onClick={() => {
                playClick()
                openMap(world.id)
              }}
            >
              <div className="world-emoji">{coming || !unlocked ? '🔒' : world.emoji}</div>
              <div className="world-body">
                <div className="world-top">
                  <h2 className="world-title">{t(world.titleKey)}</h2>
                  {isRec && <span className="map-badge-next">{t('map.continue')}</span>}
                  {coming && <span className="map-badge-done">{t('worlds.soon')}</span>}
                  {!coming && !unlocked && (
                    <span className="map-badge-done">{t('worlds.locked')}</span>
                  )}
                </div>
                <p className="world-blurb">{t(world.blurbKey)}</p>
                {!coming && (
                  <div className="world-foot">
                    <span>
                      ⭐ <Num>{stars}</Num>/{total * 3}
                    </span>
                    <span>
                      {t('worlds.stages_done', { n: done, total })}
                    </span>
                  </div>
                )}
                {!coming && !unlocked && (
                  <p className="world-unlock-hint">{t(`world.unlock.${world.id}`)}</p>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <button
        type="button"
        className="btn-play btn-play-fun"
        style={{ marginTop: 8 }}
        onClick={() => {
          playClick()
          startStage(recommendWorldId, recommendStageId)
        }}
      >
        <span className="btn-shine" aria-hidden />
        {t('home.continue')}
      </button>
    </div>
  )
}
