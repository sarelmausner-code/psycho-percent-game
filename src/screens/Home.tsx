import { useState } from 'react'
import { bootAudio, isMuted, toggleMute } from '../audio/engine'
import { stopMusic } from '../audio/music'
import { playClick } from '../audio/sfx'
import { getStageDef, getWorld } from '../engine/worlds'
import { Num } from '../components/Num'
import { t } from '../i18n/t'
import { useGameStore } from '../store/gameStore'

export function Home() {
  const startStage = useGameStore((s) => s.startStage)
  const openWorlds = useGameStore((s) => s.openWorlds)
  const bestScore = useGameStore((s) => s.bestScore)
  const recommendWorldId = useGameStore((s) => s.recommendWorldId)
  const recommendStageId = useGameStore((s) => s.recommendStageId)
  const starsByKey = useGameStore((s) => s.starsByKey)
  const ready = useGameStore((s) => s.ready)
  const [muted, setMutedUi] = useState(isMuted)

  const world = getWorld(recommendWorldId)
  const stage = getStageDef(recommendWorldId, recommendStageId)
  const totalStars = Object.values(starsByKey).reduce((a, b) => a + b, 0)
  const hasProgress = totalStars > 0 || bestScore > 0

  async function onContinue() {
    await bootAudio()
    playClick()
    startStage(recommendWorldId, recommendStageId)
  }

  function onMute() {
    const next = toggleMute()
    setMutedUi(next)
    if (next) stopMusic()
  }

  return (
    <div className="screen home">
      <div className="float-shapes" aria-hidden>
        <span className="blob b1" />
        <span className="blob b2" />
        <span className="blob b3" />
        <span className="spark s1">%</span>
        <span className="spark s2">×</span>
        <span className="spark s3">+</span>
      </div>

      <header className="home-top">
        <button type="button" className="chip" onClick={onMute} aria-label="mute">
          {muted ? `🔇 ${t('home.muted')}` : `🔊 ${t('home.sound_on')}`}
        </button>
        {bestScore > 0 && (
          <div className="chip chip-best">
            🏆 <span className="num-inline">{bestScore}</span>
          </div>
        )}
      </header>

      <div className="home-hero">
        <div className="notebook-badge bounce-soft">📒✨</div>
        <h1 className="display-title title-pop">{t('app.title')}</h1>
        <p className="subtitle">{t('app.subtitle')}</p>
        <p className="tagline wobble">{t('app.tagline')}</p>
      </div>

      <div className="feature-row">
        <span className="feature-chip">{t('home.feature_worlds')}</span>
        <span className="feature-chip">{t('home.feature_speed')}</span>
        <span className="feature-chip">{t('home.feature_combo')}</span>
      </div>

      <div className="home-card home-card-fun">
        <div className="stage-pill pulse-pill">{t('home.worlds_line')}</div>
        {ready && world && stage ? (
          <>
            <p className="continue-label">
              {hasProgress ? t('home.continue_label') : t('home.start_label')}
            </p>
            <p className="continue-stage">
              {world.emoji} {t(world.titleKey)}
            </p>
            <p className="hint" style={{ marginBottom: 8 }}>
              {stage.emoji} {t('map.stage_n', { n: recommendStageId })} · {t(stage.titleKey)}
            </p>
            <p className="hint">
              <Num>{stage.questionCount}</Num> {t('map.questions')}
              {totalStars > 0 && (
                <>
                  {' · '}
                  ⭐ <Num>{totalStars}</Num>
                </>
              )}
            </p>
          </>
        ) : (
          <p className="hint">{t('home.loading')}</p>
        )}

        <button
          type="button"
          className="btn-play btn-play-fun"
          onClick={onContinue}
          disabled={!ready}
        >
          <span className="btn-shine" aria-hidden />
          {hasProgress ? t('home.continue') : t('home.play')}
        </button>

        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            playClick()
            openWorlds()
          }}
        >
          {t('home.open_worlds')}
        </button>
      </div>

      <p className="disclaimer">{t('home.disclaimer')}</p>
    </div>
  )
}
