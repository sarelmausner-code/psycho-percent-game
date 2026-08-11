import { getCtx, getMusicBus, hz, isMuted } from './engine'

/**
 * Adaptive loop: kick + bass + chords + arp + hats.
 * Intensity 0/1/2 from combo, applied on bar boundaries.
 */

const BEAT = 0.4
const BEATS_PER_BAR = 4

// Chord roots (semitones from C) for an 8-bar pop-ish loop in C major-ish bright
const CHORD_ROOTS = [0, 0, 5, 5, 7, 7, 0, -5] // C C F F G G C G

type Layers = {
  kick: GainNode
  bass: GainNode
  chord: GainNode
  arp: GainNode
  hat: GainNode
  master: GainNode
}

let running = false
let layers: Layers | null = null
let schedulerId: number | null = null
let nextNoteTime = 0
let beatIndex = 0
let desiredIntensity = 0
let activeIntensity = 0
let tempoScale = 1
let urgency = 0 // 0–1 stage progress for slight speed-up

function beatDur() {
  return (BEAT / tempoScale) * (1 - urgency * 0.06)
}

export function startMusic() {
  const ctx = getCtx()
  const bus = getMusicBus()
  if (!ctx || !bus || running || isMuted()) return

  const master = ctx.createGain()
  master.gain.value = 0.2
  master.connect(bus)

  const mk = (v: number) => {
    const g = ctx.createGain()
    g.gain.value = v
    g.connect(master)
    return g
  }

  layers = {
    kick: mk(0.9),
    bass: mk(0.75),
    chord: mk(0.35),
    arp: mk(0),
    hat: mk(0.15),
    master,
  }

  running = true
  beatIndex = 0
  activeIntensity = 0
  desiredIntensity = 0
  tempoScale = 1
  urgency = 0
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

export function setMusicCombo(combo: number) {
  if (combo >= 6) desiredIntensity = 2
  else if (combo >= 3) desiredIntensity = 1
  else desiredIntensity = 0
}

/** 0–1 how far through the stage (tightens groove slightly). */
export function setMusicUrgency(u: number) {
  urgency = Math.max(0, Math.min(1, u))
}

export function setMusicMuted(muted: boolean) {
  if (muted) stopMusic()
}

function schedule() {
  const ctx = getCtx()
  if (!ctx || !running || !layers) return

  const horizon = ctx.currentTime + 0.12
  while (nextNoteTime < horizon) {
    if (beatIndex % BEATS_PER_BAR === 0) {
      if (desiredIntensity !== activeIntensity) {
        activeIntensity = desiredIntensity
        applyIntensity(ctx, activeIntensity)
      }
      tempoScale = activeIntensity >= 2 ? 1.05 : activeIntensity >= 1 ? 1.02 : 1
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
  const fade = 0.1
  layers.arp.gain.cancelScheduledValues(t)
  layers.hat.gain.cancelScheduledValues(t)
  layers.chord.gain.cancelScheduledValues(t)
  layers.master.gain.cancelScheduledValues(t)

  layers.arp.gain.setTargetAtTime(level >= 1 ? 0.45 : 0, t, fade)
  layers.hat.gain.setTargetAtTime(level >= 1 ? 0.28 : 0.12, t, fade)
  layers.hat.gain.setTargetAtTime(level >= 2 ? 0.42 : level >= 1 ? 0.28 : 0.12, t, fade)
  layers.chord.gain.setTargetAtTime(level >= 1 ? 0.42 : 0.32, t, fade)
  layers.master.gain.setTargetAtTime(level >= 2 ? 0.26 : 0.2, t, fade)
}

function scheduleBeat(ctx: AudioContext, beat: number, time: number) {
  if (!layers || isMuted()) return
  const barBeat = beat % BEATS_PER_BAR
  const bar = Math.floor(beat / BEATS_PER_BAR) % 8
  const root = CHORD_ROOTS[bar]!
  const bd = beatDur()

  // Kick: 1 and 3 (four-on-floor-ish light)
  if (barBeat === 0 || barBeat === 2) {
    kick(ctx, layers.kick, time, barBeat === 0 ? 0.14 : 0.1)
  }
  // Extra kick on intensity 2
  if (activeIntensity >= 2 && barBeat === 1) {
    kick(ctx, layers.kick, time + bd * 0.5, 0.06)
  }

  // Soft snare-ish on 2 and 4
  if (barBeat === 1 || barBeat === 3) {
    snare(ctx, layers.kick, time, 0.07)
  }

  // Bass: root + fifth pattern
  if (barBeat === 0) {
    pluck(ctx, layers.bass, hz(root - 24), time, 0.32, 'triangle', 0.32)
  } else if (barBeat === 2) {
    pluck(ctx, layers.bass, hz(root - 24 + 7), time, 0.22, 'triangle', 0.22)
  } else if (activeIntensity >= 1 && (barBeat === 1 || barBeat === 3)) {
    pluck(ctx, layers.bass, hz(root - 24), time + bd * 0.5, 0.1, 'sine', 0.12)
  }

  // Soft chord pad on beat 1 of bar
  if (barBeat === 0) {
    chord(ctx, layers.chord, root, time, 0.85)
  }

  // Arp layer
  if (activeIntensity >= 1) {
    const triad = [0, 4, 7, 12, 7, 4, 0, 7]
    const note = root + triad[(beat + bar) % triad.length]!
    pluck(ctx, layers.arp, hz(note), time + 0.01, 0.11, 'sine', 0.12)
    if (barBeat === 1 || barBeat === 3) {
      pluck(ctx, layers.arp, hz(note + 12), time + bd * 0.5, 0.08, 'triangle', 0.07)
    }
  }

  // Hats every beat; double-time when hot
  noiseHat(ctx, layers.hat, time, 0.03, barBeat === 0 ? 0.06 : 0.04)
  if (activeIntensity >= 1) {
    noiseHat(ctx, layers.hat, time + bd * 0.5, 0.025, 0.035)
  }
  if (activeIntensity >= 2) {
    noiseHat(ctx, layers.hat, time + bd * 0.25, 0.02, 0.03)
    noiseHat(ctx, layers.hat, time + bd * 0.75, 0.02, 0.028)
  }
}

function kick(ctx: AudioContext, dest: GainNode, time: number, vol: number) {
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = 'sine'
  o.frequency.setValueAtTime(150, time)
  o.frequency.exponentialRampToValueAtTime(45, time + 0.08)
  g.gain.setValueAtTime(0.0001, time)
  g.gain.exponentialRampToValueAtTime(vol, time + 0.005)
  g.gain.exponentialRampToValueAtTime(0.0001, time + 0.18)
  o.connect(g)
  g.connect(dest)
  o.start(time)
  o.stop(time + 0.2)
}

function snare(ctx: AudioContext, dest: GainNode, time: number, vol: number) {
  // Tone body
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = 'triangle'
  o.frequency.setValueAtTime(200, time)
  o.frequency.exponentialRampToValueAtTime(120, time + 0.08)
  g.gain.setValueAtTime(0.0001, time)
  g.gain.exponentialRampToValueAtTime(vol * 0.5, time + 0.005)
  g.gain.exponentialRampToValueAtTime(0.0001, time + 0.1)
  o.connect(g)
  g.connect(dest)
  o.start(time)
  o.stop(time + 0.12)
  // Noise crack
  noiseHat(ctx, dest, time, 0.06, vol * 0.7)
}

function noiseHat(ctx: AudioContext, dest: GainNode, time: number, dur: number, vol: number) {
  // Filtered noise via many short high partials (no AudioBuffer needed)
  for (let i = 0; i < 3; i++) {
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'square'
    o.frequency.setValueAtTime(6000 + Math.random() * 6000 + i * 800, time)
    g.gain.setValueAtTime(0.0001, time)
    g.gain.exponentialRampToValueAtTime(vol * (0.5 + Math.random() * 0.5), time + 0.004)
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur)
    o.connect(g)
    g.connect(dest)
    o.start(time)
    o.stop(time + dur + 0.02)
  }
}

function chord(ctx: AudioContext, dest: GainNode, root: number, time: number, dur: number) {
  const intervals = [0, 4, 7] // major triad
  intervals.forEach((iv, i) => {
    pluck(ctx, dest, hz(root + iv - 12), time + i * 0.01, dur, 'sine', 0.07)
    pluck(ctx, dest, hz(root + iv), time + i * 0.012, dur * 0.7, 'triangle', 0.04)
  })
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
  if (freq < 20 || !Number.isFinite(freq)) return
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, time)
  g.gain.setValueAtTime(0.0001, time)
  g.gain.exponentialRampToValueAtTime(Math.max(vol, 0.0001), time + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur)
  o.connect(g)
  g.connect(dest)
  o.start(time)
  o.stop(time + dur + 0.03)
}

export function isMusicRunning() {
  return running
}
