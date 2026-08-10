import { bootAudio, isMuted, toggleMute } from '../audio/engine'
import { stopMusic } from '../audio/music'
import { playClick } from '../audio/sfx'
import { PERCENT_STAGES, isStageUnlocked } from '../engine/stages'
import { Num } from '../components/Num'
import { t } from '../i18n/t'
import { useGameStore } from '../store/gameStore'
import { useState } from 'react'

export function Map() {
  const starsByStage = useGameStore((s) => s.starsByStage)
  const recommendId = useGameStore((s) => s.recommendId)
  const bestScore = useGameStore((s) => s.bestScore)
  const startStage = useGameStore((s) => s.startStage)
  const goHome = useGameStore((s) => s.goHome)
  const [muted, setMuted] = useState(isMuted)

  const totalStars = PERCENT_STAGES.reduce(
    (sum, st) => sum + (starsByStage[st.id] ?? 0),
    0,
  )
  const completed = PERCENT_STAGES.filter((st) => (starsByStage[st.id] ?? 0) >= 1).length

  async function onPlay(stageId: number) {
    if (!isStageUnlocked(stageId, starsByStage)) return
    await bootAudio()
    playClick()
    startStage(stageId)
  }

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
          <h1 className="map-title">{t('map.title')}</h1>
          <p className="map-sub">{t('map.world')}</p>
        </div>
        <button type="button" className="chip" onClick={onMute} aria-label="mute">
          {muted ? '🔇' : '🔊'}
        </button>
      </header>

      <div className="map-stats">
        <span className="stat-pill">
          ⭐ <Num>{totalStars}</Num>/24
        </span>
        <span className="stat-pill">
          {t('map.completed', { n: completed })}
        </span>
        {bestScore > 0 && (
          <span className="stat-pill chip-best">
            🏆 <Num>{bestScore}</Num>
          </span>
        )}
      </div>

      <div className="map-list">
        {PERCENT_STAGES.map((stage, i) => {
          const unlocked = isStageUnlocked(stage.id, starsByStage)
          const stars = starsByStage[stage.id] ?? 0
          const isNext = stage.id === recommendId && unlocked
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
                {i < PERCENT_STAGES.length - 1 && (
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
