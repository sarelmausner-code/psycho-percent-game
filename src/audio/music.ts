import { getCtx, hz, isMuted } from './engine'

/**
 * Adaptive 8-bar loop built with Web Audio (no audio files).
 * Layer 1 always · Layer 2 at combo≥3 · Layer 3 at combo≥6 (+4% tempo).
 * Layer changes apply on the next bar boundary.
 */

const BEAT = 0.42 // seconds per beat at base tempo
const BEATS_PER_BAR = 4

type LayerGains = {
  bass: GainNode
  pulse: GainNode
  arp: GainNode
  hat: GainNode
  master: GainNode
}

let running = false
let layers: LayerGains | null = null
let schedulerId: number | null = null
let nextNoteTime = 0
let beatIndex = 0
let desiredIntensity = 0 // 0 | 1 | 2  (maps to combo bands)
let activeIntensity = 0
let tempoScale = 1

function beatDur() {
  return BEAT / tempoScale
}

export function startMusic() {
  const ctx = getCtx()
  if (!ctx || running || isMuted()) return

  const master = ctx.createGain()
  master.gain.value = 0.22
  master.connect(ctx.destination)

  const mk = (v: number) => {
    const g = ctx.createGain()
    g.gain.value = v
    g.connect(master)
    return g
  }

  layers = {
    bass: mk(0.9),
    pulse: mk(0.55),
    arp: mk(0),
    hat: mk(0),
    master,
  }

  running = true
  beatIndex = 0
  activeIntensity = 0
  desiredIntensity = 0
  tempoScale = 1
  nextNoteTime = ctx.currentTime + 0.05
  schedule()
}

export function stopMusic() {
  running = false
  if (schedulerId != null) {
    clearTimeout(schedulerId)
    schedulerId = null
  }
  if (layers) {
    try {
      layers.master.disconnect()
    } catch {
      /* ignore */
    }
    layers = null
  }
}

/** Map combo → intensity. Applied at bar boundary. */
export function setMusicCombo(combo: number) {
  if (combo >= 6) desiredIntensity = 2
  else if (combo >= 3) desiredIntensity = 1
  else desiredIntensity = 0
}

export function setMusicMuted(muted: boolean) {
  if (muted) stopMusic()
  else if (getCtx() && !running) {
    // only restart if something external calls startMusic again
  }
}

function schedule() {
  const ctx = getCtx()
  if (!ctx || !running || !layers) return

  const horizon = ctx.currentTime + 0.12
  while (nextNoteTime < horizon) {
    // Bar boundary: apply intensity + tempo
    if (beatIndex % BEATS_PER_BAR === 0) {
      if (desiredIntensity !== activeIntensity) {
        activeIntensity = desiredIntensity
        applyIntensity(ctx, activeIntensity)
      }
      tempoScale = activeIntensity >= 2 ? 1.04 : 1
    }

    scheduleBeat(ctx, beatIndex, nextNoteTime)
    nextNoteTime += beatDur()
    beatIndex++
  }

  schedulerId = window.setTimeout(schedule, 25)
}

function applyIntensity(ctx: AudioContext, level: number) {
  if (!layers) return
  const t = ctx.currentTime
  const fade = 0.08
  // arp on ≥1, hat on ≥2
  layers.arp.gain.cancelScheduledValues(t)
  layers.hat.gain.cancelScheduledValues(t)
  layers.arp.gain.setTargetAtTime(level >= 1 ? 0.55 : 0, t, fade)
  layers.hat.gain.setTargetAtTime(level >= 2 ? 0.4 : 0, t, fade)
  // slight master pump when hot
  layers.master.gain.setTargetAtTime(level >= 2 ? 0.28 : 0.22, t, fade)
}

function scheduleBeat(ctx: AudioContext, beat: number, time: number) {
  if (!layers || isMuted()) return
  const barBeat = beat % BEATS_PER_BAR
  const bar = Math.floor(beat / BEATS_PER_BAR) % 8

  // Layer 1 — bass root pattern (C minor-ish fun)
  const bassNotes = [0, 0, -5, -7, 0, 3, -5, -12] // semitones from C3-ish
  if (barBeat === 0 || barBeat === 2) {
    const semi = bassNotes[bar]! + (barBeat === 2 ? 7 : 0)
    pluck(ctx, layers.bass, hz(semi - 24), time, 0.28, 'triangle', 0.35)
  }

  // soft pulse on every beat
  pluck(ctx, layers.pulse, hz(-12), time, 0.06, 'sine', barBeat === 0 ? 0.12 : 0.06)

  // Layer 2 — arpeggio C-Eb-G-Bb
  if (activeIntensity >= 1) {
    const arp = [0, 3, 7, 10, 12, 10, 7, 3]
    const note = arp[(beat + bar) % arp.length]!
    pluck(ctx, layers.arp, hz(note), time + 0.02, 0.12, 'sine', 0.14)
    if (barBeat === 1 || barBeat === 3) {
      pluck(ctx, layers.arp, hz(note + 12), time + beatDur() * 0.5, 0.08, 'triangle', 0.08)
    }
  }

  // Layer 3 — hi-hat ticks (noise-ish via high square)
  if (activeIntensity >= 2) {
    hat(ctx, layers.hat, time, 0.03, 0.07)
    hat(ctx, layers.hat, time + beatDur() * 0.5, 0.025, 0.05)
  }
}

function pluck(
  ctx: AudioContext,
  dest: GainNode,
  freq: number,
  time: number,
  dur: number,
  type: OscillatorType,
  vol: number,
) {
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, time)
  g.gain.setValueAtTime(0.0001, time)
  g.gain.exponentialRampToValueAtTime(Math.max(vol, 0.0001), time + 0.015)
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur)
  o.connect(g)
  g.connect(dest)
  o.start(time)
  o.stop(time + dur + 0.02)
}

function hat(ctx: AudioContext, dest: GainNode, time: number, dur: number, vol: number) {
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = 'square'
  o.frequency.setValueAtTime(8000 + Math.random() * 2000, time)
  g.gain.setValueAtTime(0.0001, time)
  g.gain.exponentialRampToValueAtTime(vol, time + 0.005)
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur)
  o.connect(g)
  g.connect(dest)
  o.start(time)
  o.stop(time + dur + 0.01)
}

export function isMusicRunning() {
  return running
}
