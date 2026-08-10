import { useEffect, useState } from 'react'

export function TimerRing({
  totalSec,
  startedAt,
  paused,
  onHurry,
}: {
  totalSec: number
  startedAt: number
  paused: boolean
  onHurry?: () => void
}) {
  const [left, setLeft] = useState(totalSec)
  const [hurryFired, setHurryFired] = useState(false)

  useEffect(() => {
    setLeft(totalSec)
    setHurryFired(false)
  }, [startedAt, totalSec])

  useEffect(() => {
    if (paused) return
    let raf = 0
    const tick = () => {
      const elapsed = (performance.now() - startedAt) / 1000
      const remain = Math.max(0, totalSec - elapsed)
      setLeft(remain)
      if (remain <= totalSec * 0.25 && remain > 0 && !hurryFired) {
        setHurryFired(true)
        onHurry?.()
      }
      if (remain > 0) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [startedAt, totalSec, paused, hurryFired, onHurry])

  const pct = Math.max(0, Math.min(1, left / totalSec))
  const r = 22
  const c = 2 * Math.PI * r
  const dash = c * pct
  const urgent = pct <= 0.25
  const warn = pct <= 0.5

  return (
    <div
      className={`timer-ring ${urgent ? 'timer-urgent' : warn ? 'timer-warn' : ''}`}
      aria-label={`נותרו ${Math.ceil(left)} שניות`}
    >
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle className="timer-track" cx="28" cy="28" r={r} />
        <circle
          className="timer-prog"
          cx="28"
          cy="28"
          r={r}
          strokeDasharray={`${dash} ${c}`}
          transform="rotate(-90 28 28)"
        />
      </svg>
      <span className="timer-num" dir="ltr">
        {Math.ceil(left)}
      </span>
    </div>
  )
}
