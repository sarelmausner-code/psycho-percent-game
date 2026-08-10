import { useState } from 'react'
import { bootAudio, isMuted, toggleMute } from '../audio/engine'
import { stopMusic } from '../audio/music'
import { playClick } from '../audio/sfx'
import { getStageDef } from '../engine/stages'
import { Num } from '../components/Num'
import { t } from '../i18n/t'
import { useGameStore } from '../store/gameStore'

export function Home() {
  const startStage = useGameStore((s) => s.startStage)
  const openMap = useGameStore((s) => s.openMap)
  const bestScore = useGameStore((s) => s.bestScore)
  const recommendId = useGameStore((s) => s.recommendId)
  const starsByStage = useGameStore((s) => s.starsByStage)
  const ready = useGameStore((s) => s.ready)
  const [muted, setMutedUi] = useState(isMuted)

  const rec = getStageDef(recommendId)
  const recStars = starsByStage[recommendId] ?? 0
  const totalStars = Object.values(starsByStage).reduce((a, b) => a + b, 0)
  const hasProgress = totalStars > 0 || bestScore > 0

  async function onContinue() {
    await bootAudio()
    playClick()
    startStage(recommendId)
  }

  async function onMap() {
    playClick()
    openMap()
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
        <span className="feature-chip">{t('home.feature_speed')}</span>
        <span className="feature-chip">{t('home.feature_music')}</span>
        <span className="feature-chip">{t('home.feature_combo')}</span>
      </div>

      <div className="home-card home-card-fun">
        <div className="stage-pill pulse-pill">{t('home.world')}</div>
        {ready && rec ? (
          <>
            <p className="continue-label">
              {hasProgress ? t('home.continue_label') : t('home.start_label')}
            </p>
            <p className="continue-stage">
              {rec.emoji}{' '}
              {t('map.stage_n', { n: recommendId })} · {t(rec.titleKey)}
            </p>
            {recStars > 0 && (
              <p className="continue-stars">
                {[1, 2, 3].map((k) => (
                  <span key={k} style={{ opacity: recStars >= k ? 1 : 0.25 }}>
                    ⭐
                  </span>
                ))}
              </p>
            )}
            <p className="hint">
              <Num>{rec.questionCount}</Num> {t('map.questions')}
              {totalStars > 0 && (
                <>
                  {' · '}
                  ⭐ <Num>{totalStars}</Num>/24
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

        <button type="button" className="btn-secondary" onClick={onMap}>
          {t('home.open_map')}
        </button>
      </div>

      <p className="disclaimer">{t('home.disclaimer')}</p>
    </div>
  )
}
