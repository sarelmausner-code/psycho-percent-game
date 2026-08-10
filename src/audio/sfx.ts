import { hz, now, tone } from './engine'

/** Rising scale by combo length — resets on wrong. */
const SCALE = [0, 4, 7, 11, 14, 18, 21, 24]

export function playCorrect(combo: number, speedTier: 'lightning' | 'fast' | 'ok' | 'slow' = 'ok') {
  const t0 = now()
  const degree = SCALE[Math.min(combo, SCALE.length - 1)] ?? 0
  const f = hz(degree)
  tone(f, t0, 0.14, 'triangle', 0.18)
  tone(f * 2, t0, 0.12, 'sine', 0.08)

  if (combo >= 3) {
    tone(f * 1.5, t0 + 0.085, 0.12, 'sine', 0.1)
  }

  // Extra sparkle for quick answers
  if (speedTier === 'lightning') {
    ;[12, 16, 19, 24].forEach((s, i) => {
      tone(hz(degree + s - 12), t0 + 0.05 + i * 0.045, 0.1, 'sine', 0.09)
    })
  } else if (speedTier === 'fast') {
    tone(hz(degree + 12), t0 + 0.1, 0.1, 'triangle', 0.1)
    tone(hz(degree + 19), t0 + 0.16, 0.1, 'sine', 0.08)
  }
}

export function playWrong() {
  const t0 = now()
  tone(hz(-12), t0, 0.16, 'sine', 0.1)
  tone(hz(-17), t0 + 0.1, 0.2, 'sine', 0.08)
}

export function playClick() {
  const t0 = now()
  tone(880, t0, 0.07, 'square', 0.06)
}

export function playStageClear() {
  const t0 = now()
  const notes = [0, 4, 7, 12, 16, 19, 24]
  notes.forEach((s, i) => {
    tone(hz(s), t0 + i * 0.1, 0.18, 'triangle', 0.14)
  })
}

export function playFailSoft() {
  const t0 = now()
  ;[0, -3, -7, -12].forEach((s, i) => {
    tone(hz(s), t0 + i * 0.09, 0.15, 'sine', 0.07)
  })
}

export function playTick() {
  const t0 = now()
  tone(1200, t0, 0.04, 'square', 0.04)
}

export function playHurry() {
  const t0 = now()
  tone(660, t0, 0.05, 'square', 0.05)
  tone(880, t0 + 0.06, 0.05, 'square', 0.05)
}
