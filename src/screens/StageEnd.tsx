import { useEffect, useState } from 'react'
import { bootAudio } from '../audio/engine'
import { playStageClear } from '../audio/sfx'
import { Num } from '../components/Num'
import { t } from '../i18n/t'
import { useGameStore, type StageSummary } from '../store/gameStore'

function EmptyEnd({
  onReplay,
  onMap,
  onHome,
}: {
  onReplay: () => void
  onMap: () => void
  onHome: () => void
}) {
  return (
    <div className="screen end">
      <h1 className="display-title end-title">{t('end.title')}</h1>
      <div className="end-card end-card-fun">
        <p className="end-label">{t('end.summary')}</p>
        <p className="end-meta" style={{ marginTop: 12 }}>
          {t('end.missing')}
        </p>
      </div>
      <div className="end-actions">
        <button type="button" className="btn-play" onClick={onReplay}>
          {t('end.replay')}
        </button>
        <button type="button" className="btn-secondary" onClick={onMap}>
          {t('end.map')}
        </button>
        <button type="button" className="btn-secondary" onClick={onHome}>
          {t('end.home')}
        </button>
      </div>
    </div>
  )
}

function SummaryBody({ result }: { result: StageSummary }) {
  const [shownStars, setShownStars] = useState(0)
  const [displayScore, setDisplayScore] = useState(200)

  useEffect(() => {
    playStageClear()
    setShownStars(0)
    setDisplayScore(200)
    const timers: number[] = []
    for (let i = 1; i <= result.stars; i++) {
      timers.push(window.setTimeout(() => setShownStars(i), i * 170))
    }
    const start = performance.now()
    const from = 200
    const to = result.score
    const dur = 900
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplayScore(Math.round(from + (to - from) * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      timers.forEach(clearTimeout)
      cancelAnimationFrame(raf)
    }
  }, [result.score, result.stars])

  return (
    <>
      <div className="confetti" aria-hidden>
        {Array.from({ length: 18 }, (_, i) => (
          <span
            key={i}
            className={`confetti-bit c${i % 6}`}
            style={{ left: `${4 + i * 5}%`, animationDelay: `${i * 35}ms` }}
          />
        ))}
      </div>

      <h1 className="display-title end-title">{t('end.title')}</h1>

      <p className="end-stage-name">
        {t('map.stage_n', { n: result.stageId })} · {t(result.stageTitleKey)}
      </p>

      {result.wasNewRecord && (
        <div className="record-banner">{t('end.new_record')}</div>
      )}

      {result.unlockedNext && result.nextStageId && (
        <div className="unlock-banner">
          🔓 {t('end.unlocked', { n: result.nextStageId })}
        </div>
      )}

      <div className="stars-row" aria-label={t('end.stars')}>
        {[1, 2, 3].map((i) => (
          <span key={i} className={`star ${shownStars >= i ? 'star-on' : ''}`}>
            ⭐
          </span>
        ))}
      </div>

      <div className="end-card end-card-fun">
        <p className="end-label">{t('end.score_label')}</p>
        <p className="end-score">
          <Num>{displayScore}</Num>
        </p>
        {result.bestScore > 0 && (
          <p className="end-best">
            {t('end.best')}: <Num>{result.bestScore}</Num>
          </p>
        )}
      </div>

      <section className="summary-card" aria-label={t('end.summary')}>
        <h2 className="summary-title">{t('end.summary')}</h2>

        <div className="summary-grid">
          <div className="summary-cell">
            <span className="summary-icon">✅</span>
            <span className="summary-val">
              <Num>
                {result.correctCount}/{result.total}
              </Num>
            </span>
            <span className="summary-key">{t('end.correct')}</span>
          </div>
          <div className="summary-cell">
            <span className="summary-icon">🎯</span>
            <span className="summary-val">
              <Num>{Math.round(result.accuracy * 100)}</Num>%
            </span>
            <span className="summary-key">{t('end.accuracy_short')}</span>
          </div>
          <div className="summary-cell">
            <span className="summary-icon">💎</span>
            <span className="summary-val">
              <Num>{result.points}</Num>
            </span>
            <span className="summary-key">{t('end.points_short')}</span>
          </div>
          <div className="summary-cell">
            <span className="summary-icon">🔥</span>
            <span className="summary-val">
              <Num>{result.maxCombo}</Num>
            </span>
            <span className="summary-key">{t('end.combo_short')}</span>
          </div>
          <div className="summary-cell">
            <span className="summary-icon">⏱️</span>
            <span className="summary-val">
              <Num>{Number.isFinite(result.avgSec) ? result.avgSec.toFixed(1) : '0.0'}</Num>
              <span className="summary-unit">שנ׳</span>
            </span>
            <span className="summary-key">{t('end.avg_short')}</span>
          </div>
          <div className="summary-cell">
            <span className="summary-icon">⌛</span>
            <span className="summary-val">
              <Num>{Number.isFinite(result.totalSec) ? result.totalSec.toFixed(0) : '0'}</Num>
              <span className="summary-unit">שנ׳</span>
            </span>
            <span className="summary-key">{t('end.total_time')}</span>
          </div>
        </div>

        <div className="end-stats">
          {result.lightningCount > 0 && (
            <span className="stat-pill stat-lightning">
              {t('end.lightning', { n: result.lightningCount })}
            </span>
          )}
          {result.fastCount > 0 && (
            <span className="stat-pill stat-fast">
              {t('end.fast', { n: result.fastCount })}
            </span>
          )}
          {result.wrongCount > 0 && (
            <span className="stat-pill stat-wrong">
              {t('end.wrong', { n: result.wrongCount })}
            </span>
          )}
          {result.wrongCount === 0 && result.total > 0 && (
            <span className="stat-pill stat-perfect">{t('end.perfect')}</span>
          )}
        </div>

        {result.recap.length > 0 && (
          <div className="recap-list">
            <h3 className="recap-heading">{t('end.per_question')}</h3>
            {result.recap.map((row) => (
              <div
                key={row.index}
                className={`recap-row ${row.correct ? 'recap-ok' : 'recap-no'}`}
              >
                <span className="recap-n">
                  <Num>{row.index}</Num>
                </span>
                <span className="recap-mark" aria-hidden>
                  {row.correct ? '✓' : '✗'}
                </span>
                <span className="recap-mid">
                  {row.correct ? (
                    <>
                      <span className="recap-pts">
                        +<Num>{row.points}</Num>
                      </span>
                      {row.speedTier === 'lightning' && (
                        <span className="recap-tag">⚡ {t('play.lightning')}</span>
                      )}
                      {row.speedTier === 'fast' && (
                        <span className="recap-tag">💨 {t('play.fast')}</span>
                      )}
                    </>
                  ) : (
                    <span className="recap-err">
                      {row.errorMode && t(`err.${row.errorMode}`) !== `err.${row.errorMode}`
                        ? t(`err.${row.errorMode}`)
                        : t('err.guessed_round_up')}
                    </span>
                  )}
                </span>
                <span className="recap-time" dir="ltr">
                  <Num>{(row.ms / 1000).toFixed(1)}</Num>s
                </span>
              </div>
            ))}
          </div>
        )}

        <p className="disclaimer">{t('home.disclaimer')}</p>
      </section>
    </>
  )
}

export function StageEnd() {
  const stageSummary = useGameStore((s) => s.stageSummary)
  const startStage = useGameStore((s) => s.startStage)
  const goHome = useGameStore((s) => s.goHome)
  const openMap = useGameStore((s) => s.openMap)
  const currentStageId = useGameStore((s) => s.currentStageId)

  async function onReplay() {
    await bootAudio()
    startStage(stageSummary?.stageId ?? currentStageId ?? 1)
  }

  async function onNext() {
    if (!stageSummary?.nextStageId) return
    await bootAudio()
    startStage(stageSummary.nextStageId)
  }

  if (!stageSummary) {
    return (
      <EmptyEnd
        onReplay={onReplay}
        onMap={openMap}
        onHome={goHome}
      />
    )
  }

  return (
    <div className="screen end">
      <SummaryBody result={stageSummary} />
      <div className="end-actions">
        {stageSummary.nextStageId != null && (
          <button type="button" className="btn-play btn-play-fun" onClick={onNext}>
            <span className="btn-shine" aria-hidden />
            {t('end.next', { n: stageSummary.nextStageId })}
          </button>
        )}
        <button
          type="button"
          className={stageSummary.nextStageId != null ? 'btn-secondary' : 'btn-play btn-play-fun'}
          onClick={onReplay}
        >
          {stageSummary.nextStageId == null && <span className="btn-shine" aria-hidden />}
          {t('end.replay')}
        </button>
        <button type="button" className="btn-secondary" onClick={openMap}>
          {t('end.map')}
        </button>
        <button type="button" className="btn-secondary" onClick={goHome}>
          {t('end.home')}
        </button>
      </div>
    </div>
  )
}
