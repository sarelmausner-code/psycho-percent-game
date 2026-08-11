import { duckMusic, hz, now, tone } from './engine'

/** Rising major-ish scale by combo — resets on wrong. */
const SCALE = [0, 4, 7, 11, 14, 16, 19, 24]

export function playCorrect(
  combo: number,
  speedTier: 'lightning' | 'fast' | 'ok' | 'slow' = 'ok',
) {
  const t0 = now()
  duckMusic(0.32, 0.015, 0.06, 0.14)

  const degree = SCALE[Math.min(Math.max(combo - 1, 0), SCALE.length - 1)] ?? 0
  const f = hz(degree)

  // Punchy triad stab
  tone(f, t0, 0.12, 'triangle', 0.2)
  tone(f * (5 / 4), t0 + 0.01, 0.1, 'triangle', 0.1) // major third-ish
  tone(f * 1.5, t0 + 0.015, 0.1, 'sine', 0.09) // fifth
  tone(f * 2, t0, 0.09, 'sine', 0.07) // octave sparkle

  if (combo >= 3) {
    tone(f * 1.5, t0 + 0.08, 0.11, 'sine', 0.1)
  }
  if (combo >= 6) {
    tone(f * 2, t0 + 0.1, 0.1, 'triangle', 0.08)
    tone(f * 3, t0 + 0.12, 0.08, 'sine', 0.05)
  }

  if (speedTier === 'lightning') {
    ;[0, 4, 7, 12, 16].forEach((s, i) => {
      tone(hz(degree + s), t0 + 0.04 + i * 0.04, 0.09, 'sine', 0.08)
    })
  } else if (speedTier === 'fast') {
    tone(hz(degree + 12), t0 + 0.09, 0.1, 'triangle', 0.1)
    tone(hz(degree + 19), t0 + 0.14, 0.09, 'sine', 0.07)
  }
}

export function playWrong() {
  const t0 = now()
  // Soft descending minor — never harsh buzzer
  tone(hz(-5), t0, 0.14, 'sine', 0.09)
  tone(hz(-8), t0 + 0.08, 0.16, 'triangle', 0.07)
  tone(hz(-12), t0 + 0.16, 0.18, 'sine', 0.06)
}

export function playClick() {
  const t0 = now()
  tone(1200, t0, 0.04, 'square', 0.045)
  tone(800, t0 + 0.02, 0.03, 'sine', 0.03)
}

export function playStageClear() {
  const t0 = now()
  duckMusic(0.25, 0.02, 0.2, 0.3)
  const notes = [0, 4, 7, 12, 16, 19, 24]
  notes.forEach((s, i) => {
    const at = t0 + i * 0.09
    tone(hz(s), at, 0.2, 'triangle', 0.15)
    tone(hz(s + 12), at, 0.14, 'sine', 0.07)
  })
  // Low boom under the fanfare
  tone(hz(-24), t0, 0.45, 'sine', 0.12)
  tone(hz(-12), t0 + 0.05, 0.35, 'triangle', 0.08)
}

export function playFailSoft() {
  const t0 = now()
  ;[0, -3, -7, -12, -15].forEach((s, i) => {
    tone(hz(s), t0 + i * 0.085, 0.16, 'sine', 0.065)
  })
}

export function playTick() {
  const t0 = now()
  tone(1400, t0, 0.03, 'square', 0.035)
}

export function playHurry() {
  const t0 = now()
  tone(740, t0, 0.05, 'square', 0.05)
  tone(990, t0 + 0.055, 0.05, 'square', 0.05)
  tone(1180, t0 + 0.11, 0.06, 'triangle', 0.04)
}

/** Combo milestone stinger (×2 / ×3) */
export function playComboUp(level: 2 | 3 | 4) {
  const t0 = now()
  duckMusic(0.4, 0.01, 0.05, 0.12)
  const base = level === 2 ? 0 : level === 3 ? 5 : 7
  ;[0, 4, 7, 12].forEach((s, i) => {
    tone(hz(base + s), t0 + i * 0.05, 0.12, 'triangle', 0.12)
  })
}
