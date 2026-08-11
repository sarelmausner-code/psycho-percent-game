import { useCallback, useMemo, useState } from 'react'
import { isMuted, toggleMute } from '../audio/engine'
import { startMusic, stopMusic } from '../audio/music'
import { playCorrect, playHurry, playWrong } from '../audio/sfx'
import { Narrative, Num } from '../components/Num'
import { ParticleBurst } from '../components/ParticleBurst'
import { TimerRing } from '../components/TimerRing'
import { t } from '../i18n/t'
import { useGameStore } from '../store/gameStore'

export function Play() {
  const questions = useGameStore((s) => s.questions)
  const index = useGameStore((s) => s.index)
  const combo = useGameStore((s) => s.combo)
  const totalPoints = useGameStore((s) => s.totalPoints)
  const locked = useGameStore((s) => s.locked)
  const lastFeedback = useGameStore((s) => s.lastFeedback)
  const burst = useGameStore((s) => s.burst)
  const questionStartedAt = useGameStore((s) => s.questionStartedAt)
  const submitAnswer = useGameStore((s) => s.submitAnswer)
  const advanceAfterWrong = useGameStore((s) => s.advanceAfterWrong)
  const currentStage = useGameStore((s) => s.currentStage)
  const currentStageId = useGameStore((s) => s.currentStageId)
  const [muted, setMuted] = useState(isMuted)

  const q = questions[index]
  const hot = combo >= 6
  const mid = combo >= 3

  const narrative = useMemo(() => {
    if (!q) return ''
    return t(q.narrativeKey, q.params)
  }, [q])

  const onHurry = useCallback(() => {
    if (!isMuted()) playHurry()
  }, [])

  function onMuteTap() {
    const next = toggleMute()
    setMuted(next)
    if (next) stopMusic()
    else {
      startMusic()
      // intensity will re-apply from combo on next bar
    }
  }

  if (!q) return null

  function onPick(
    value: number,
    errorMode: string | undefined,
    e: React.MouseEvent | React.TouchEvent,
  ) {
    if (locked) return
    const point =
      'clientX' in e
        ? { x: e.clientX, y: e.clientY }
        : { x: window.innerWidth / 2, y: window.innerHeight / 2 }

    const ms = performance.now() - questionStartedAt
    const correct = value === q!.answer
    const ratio = ms / (q!.timeTargetSec * 1000)
    const tier =
      ratio < 0.35 ? 'lightning' : ratio < 0.55 ? 'fast' : ratio <= 1 ? 'ok' : 'slow'

    if (correct) playCorrect(combo + 1, tier)
    else playWrong()

    submitAnswer(value, errorMode, point.x, point.y)
  }

  const speedClass =
    lastFeedback?.correct && lastFeedback.speedTier === 'lightning'
      ? 'play-lightning'
      : lastFeedback?.correct && lastFeedback.speedTier === 'fast'
        ? 'play-fast'
        : ''

  return (
    <div
      className={`screen play ${hot ? 'play-hot' : mid ? 'play-mid' : ''} ${lastFeedback?.correct ? 'play-ok' : ''} ${lastFeedback && !lastFeedback.correct ? 'play-no' : ''} ${speedClass}`}
    >
      <div className={`edge-glow ${hot ? 'edge-hot' : mid ? 'edge-mid' : ''}`} aria-hidden />

      <button type="button" className="mute-fab" onClick={onMuteTap} aria-label="mute">
        {muted ? '🔇' : '🔊'}
      </button>

      <header className="play-hud">
        <div className="hud-score">
          <span className={`score-pop ${lastFeedback?.correct ? 'score-pop-go' : ''}`}>
            <Num>{totalPoints}</Num>
          </span>
          <span className="hud-label">{t('play.score')}</span>
        </div>

        <TimerRing
          key={questionStartedAt}
          totalSec={q.timeTargetSec}
          startedAt={questionStartedAt}
          paused={locked}
          onHurry={onHurry}
        />

        <div className={`hud-combo ${combo >= 3 ? 'hud-combo-on' : ''} ${hot ? 'hud-combo-hot' : ''}`}>
          {combo > 0 ? (
            <>
              <span className="combo-fire">{hot ? '🔥' : mid ? '✨' : '⭐'}</span>
              {t('play.combo', {
                n: combo >= 9 ? 4 : combo >= 6 ? 3 : combo >= 3 ? 2 : 1,
              })}
            </>
          ) : (
            '—'
          )}
        </div>
      </header>

      <div className="q-dots" aria-hidden>
        {questions.map((qq, i) => (
          <span
            key={i}
            className={`q-dot ${i < index ? 'done' : ''} ${i === index ? 'current' : ''} ${qq.difficulty >= 4 ? 'hard' : ''}`}
            title={`d${qq.difficulty}`}
          />
        ))}
      </div>

      <div className="progress-track" aria-hidden>
        <div
          className="progress-fill"
          style={{ width: `${((index + (locked && lastFeedback?.correct ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>

      <div className="combo-bar" aria-hidden>
        <div className="combo-fill" style={{ width: `${Math.min(100, (combo / 9) * 100)}%` }} />
      </div>

      <article className={`question-card ${hot ? 'question-hot' : ''} ${q.difficulty >= 4 ? 'question-hard' : ''}`}>
        <div className="q-badge-row">
          <div className="q-badge">
            {currentStage
              ? `${currentStage.emoji} ${t('map.stage_n', { n: currentStageId ?? 1 })} · ${index + 1}/${questions.length}`
              : `${t('play.q_of', { n: index + 1, total: questions.length })}`}
          </div>
          <div className={`diff-chip d${Math.min(5, q.difficulty || 1)}`}>
            {t('play.diff', { n: q.difficulty || 1 })}
            {index >= Math.floor(questions.length * 0.6) ? ` · ${t('play.ramp')}` : ''}
          </div>
        </div>
        <p className="question-text">
          <Narrative template={t(q.narrativeKey)} params={q.params} />
        </p>
      </article>

      <div className="options" role="listbox" aria-label="תשובות">
        {q.options.map((opt, i) => {
          let state = ''
          if (lastFeedback) {
            if (opt.correct) state = 'opt-correct'
            else if (opt.value === lastFeedback.value && !lastFeedback.correct) state = 'opt-wrong'
            else state = 'opt-dim'
          }
          return (
            <button
              key={opt.label}
              type="button"
              className={`opt ${state} ${lastFeedback?.correct && opt.correct ? 'opt-jump' : ''}`}
              style={{ animationDelay: `${i * 40}ms` }}
              disabled={locked}
              onClick={(e) => onPick(opt.value, opt.errorMode, e)}
            >
              <span className="opt-bubble" aria-hidden>
                <span className="opt-letter">{opt.label}</span>
                {lastFeedback && opt.correct && <span className="opt-check">✓</span>}
              </span>
              <span className="opt-value">
                <Num>{formatOpt(opt.value)}</Num>
              </span>
            </button>
          )
        })}
      </div>

      {lastFeedback?.correct && lastFeedback.praise && (
        <div
          className={`praise ${lastFeedback.speedTier === 'lightning' ? 'praise-lightning' : ''} ${lastFeedback.speedTier === 'fast' ? 'praise-fast' : ''} ${lastFeedback.praiseKind === 'recovery' ? 'praise-recovery' : ''} ${lastFeedback.praiseKind === 'milestone' || lastFeedback.praiseKind === 'progress' ? 'praise-milestone' : ''}`}
          key={lastFeedback.praise + index}
        >
          <span className="praise-word">{lastFeedback.praise}</span>
          {lastFeedback.speedTier && lastFeedback.speedTier !== 'slow' && lastFeedback.speedTier !== 'ok' && (
            <span className="praise-speed">
              {lastFeedback.speedTier === 'lightning' ? '⚡ ' : '💨 '}
              {t('play.time_took', {
                sec: ((lastFeedback.ms ?? 0) / 1000).toFixed(1),
              })}
              {lastFeedback.speedBonus ? (
                <>
                  {' · '}
                  {t('play.speed_bonus', { n: lastFeedback.speedBonus })}
                </>
              ) : null}
            </span>
          )}
          {lastFeedback.speedTier === 'ok' && (
            <span className="praise-speed">
              {t('play.time_took', { sec: ((lastFeedback.ms ?? 0) / 1000).toFixed(1) })}
            </span>
          )}
          <span className="praise-pts">
            +<Num>{lastFeedback.points}</Num>
          </span>
        </div>
      )}

      {lastFeedback && !lastFeedback.correct && (
        <div className="wrong-panel">
          <p className="wrong-title">{t('play.almost')}</p>
          <p className="wrong-err">
            {lastFeedback.errorMode
              ? t(`err.${lastFeedback.errorMode}`)
              : t('err.guessed_round_up')}
          </p>
          <p className="wrong-answer">
            {t('play.correct_was')}
            <Num>{formatOpt(q.answer)}</Num>
          </p>
          <button type="button" className="btn-secondary" onClick={advanceAfterWrong}>
            {t('play.got_it')}
          </button>
        </div>
      )}

      {burst && (
        <ParticleBurst
          x={burst.x}
          y={burst.y}
          active
          mega={lastFeedback?.speedTier === 'lightning'}
        />
      )}

      <span className="sr-only">{narrative}</span>
    </div>
  )
}

function formatOpt(n: number): string {
  if (Number.isInteger(n)) return String(n)
  return String(Math.round(n * 100) / 100)
}
