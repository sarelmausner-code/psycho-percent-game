import { getCtx, getMusicBus, hz, isMuted } from './engine'

/**
 * Single adaptive music loop (never two instances).
 * Kick + bass + light chords + arp/hats by combo intensity.
 */

const BEAT = 0.4
const BEATS_PER_BAR = 4
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
/** Monotonic id so a late schedule() from an old session never starts notes. */
let sessionId = 0
let layers: Layers | null = null
let schedulerId: ReturnType<typeof setTimeout> | null = null
let stopTimerId: ReturnType<typeof setTimeout> | null = null
let nextNoteTime = 0
let beatIndex = 0
let desiredIntensity = 0
let activeIntensity = 0
let tempoScale = 1
let urgency = 0

function beatDur() {
  return (BEAT / tempoScale) * (1 - urgency * 0.06)
}

function clearScheduler() {
  if (schedulerId != null) {
    clearTimeout(schedulerId)
    schedulerId = null
  }
}

function clearStopTimer() {
  if (stopTimerId != null) {
    clearTimeout(stopTimerId)
    stopTimerId = null
  }
}

/**
 * Hard stop: kill scheduler, silence + disconnect graph.
 * Always safe to call; cancels any pending delayed stop.
 */
export function stopMusic() {
  clearStopTimer()
  running = false
  sessionId += 1 // invalidate in-flight schedule() callbacks
  clearScheduler()

  if (layers) {
    const ctx = getCtx()
    const master = layers.master
    try {
      if (ctx) {
        const t = ctx.currentTime
        master.gain.cancelScheduledValues(t)
        master.gain.setValueAtTime(master.gain.value, t)
        master.gain.linearRampToValueAtTime(0.0001, t + 0.04)
      }
      // Disconnect after short silence so tails die
      const toDisconnect = master
      window.setTimeout(() => {
        try {
          toDisconnect.disconnect()
        } catch {
          /* ignore */
        }
      }, 60)
    } catch {
      try {
        master.disconnect()
      } catch {
        /* ignore */
      }
    }
    layers = null
  }
}

/** Stop any existing loop, then start exactly one. */
export function startMusic() {
  // Prevent double-start / stacking loops
  stopMusic()

  const ctx = getCtx()
  const bus = getMusicBus()
  if (!ctx || !bus || isMuted()) return

  const mySession = sessionId

  const master = ctx.createGain()
  master.gain.value = 0.0001
  master.connect(bus)
  // Fade in cleanly
  master.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.08)

  const mk = (v: number) => {
    const g = ctx.createGain()
    g.gain.value = v
    g.connect(master)
    return g
  }

  layers = {
    kick: mk(0.85),
    bass: mk(0.7),
    chord: mk(0.22), // quieter so it doesn’t fight the bass
    arp: mk(0),
    hat: mk(0.12),
    master,
  }

  running = true
  beatIndex = 0
  activeIntensity = 0
  desiredIntensity = 0
  tempoScale = 1
  urgency = 0
  nextNoteTime = ctx.currentTime + 0.08
  schedule(mySession)
}

/** Fade out after delay (stage end). Restarting cancels this. */
export function stopMusicSoon(ms = 2200) {
  clearStopTimer()
  stopTimerId = setTimeout(() => {
    stopTimerId = null
    stopMusic()
  }, ms)
}

export function setMusicCombo(combo: number) {
  if (combo >= 6) desiredIntensity = 2
  else if (combo >= 3) desiredIntensity = 1
  else desiredIntensity = 0
}

export function setMusicUrgency(u: number) {
  urgency = Math.max(0, Math.min(1, u))
}

export function setMusicMuted(mutedFlag: boolean) {
  if (mutedFlag) stopMusic()
}

function schedule(mySession: number) {
  const ctx = getCtx()
  if (!ctx || !running || !layers || mySession !== sessionId) return

  const horizon = ctx.currentTime + 0.12
  while (nextNoteTime < horizon) {
    if (mySession !== sessionId || !running || !layers) return

    if (beatIndex % BEATS_PER_BAR === 0) {
      if (desiredIntensity !== activeIntensity) {
        activeIntensity = desiredIntensity
        applyIntensity(ctx, activeIntensity)
      }
      tempoScale = activeIntensity >= 2 ? 1.05 : activeIntensity >= 1 ? 1.02 : 1
    }

    scheduleBeat(ctx, beatIndex, nextNoteTime, mySession)
    nextNoteTime += beatDur()
    beatIndex++
  }

  if (mySession !== sessionId || !running) return
  schedulerId = setTimeout(() => schedule(mySession), 25)
}

function applyIntensity(ctx: AudioContext, level: number) {
  if (!layers) return
  const t = ctx.currentTime
  const fade = 0.1
  layers.arp.gain.cancelScheduledValues(t)
  layers.hat.gain.cancelScheduledValues(t)
  layers.chord.gain.cancelScheduledValues(t)

  layers.arp.gain.setTargetAtTime(level >= 1 ? 0.38 : 0, t, fade)
  layers.hat.gain.setTargetAtTime(level >= 2 ? 0.36 : level >= 1 ? 0.22 : 0.1, t, fade)
  layers.chord.gain.setTargetAtTime(level >= 1 ? 0.28 : 0.2, t, fade)
  // Keep master steady — duckMusic handles SFX punches
  if (layers.master.gain.value > 0.01) {
    layers.master.gain.setTargetAtTime(level >= 2 ? 0.22 : 0.18, t, fade)
  }
}

function scheduleBeat(
  ctx: AudioContext,
  beat: number,
  time: number,
  mySession: number,
) {
  if (!layers || isMuted() || mySession !== sessionId) return
  const barBeat = beat % BEATS_PER_BAR
  const bar = Math.floor(beat / BEATS_PER_BAR) % 8
  const root = CHORD_ROOTS[bar]!
  const bd = beatDur()

  // Kick on 1 and 3
  if (barBeat === 0 || barBeat === 2) {
    kick(ctx, layers.kick, time, barBeat === 0 ? 0.13 : 0.09)
  }
  if (activeIntensity >= 2 && barBeat === 1) {
    kick(ctx, layers.kick, time + bd * 0.5, 0.05)
  }

  // Snare on 2 and 4
  if (barBeat === 1 || barBeat === 3) {
    snare(ctx, layers.kick, time, 0.06)
  }

  // Bass
  if (barBeat === 0) {
    pluck(ctx, layers.bass, hz(root - 24), time, 0.3, 'triangle', 0.3)
  } else if (barBeat === 2) {
    pluck(ctx, layers.bass, hz(root - 24 + 7), time, 0.2, 'triangle', 0.2)
  } else if (activeIntensity >= 1 && (barBeat === 1 || barBeat === 3)) {
    pluck(ctx, layers.bass, hz(root - 24), time + bd * 0.5, 0.09, 'sine', 0.1)
  }

  // Soft pad only on bar start (not every beat — was muddy / “double track”)
  if (barBeat === 0) {
    chord(ctx, layers.chord, root, time, 1.4)
  }

  // Arp when combo ≥ 3
  if (activeIntensity >= 1) {
    const triad = [0, 4, 7, 12, 7, 4]
    const note = root + triad[beat % triad.length]!
    pluck(ctx, layers.arp, hz(note), time + 0.01, 0.1, 'sine', 0.1)
    if (activeIntensity >= 2 && (barBeat === 1 || barBeat === 3)) {
      pluck(ctx, layers.arp, hz(note + 12), time + bd * 0.5, 0.07, 'triangle', 0.06)
    }
  }

  // Hats
  noiseHat(ctx, layers.hat, time, 0.028, barBeat === 0 ? 0.05 : 0.035)
  if (activeIntensity >= 1) {
    noiseHat(ctx, layers.hat, time + bd * 0.5, 0.022, 0.03)
  }
  if (activeIntensity >= 2) {
    noiseHat(ctx, layers.hat, time + bd * 0.25, 0.018, 0.025)
    noiseHat(ctx, layers.hat, time + bd * 0.75, 0.018, 0.022)
  }
}

function kick(ctx: AudioContext, dest: GainNode, time: number, vol: number) {
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = 'sine'
  o.frequency.setValueAtTime(140, time)
  o.frequency.exponentialRampToValueAtTime(42, time + 0.08)
  g.gain.setValueAtTime(0.0001, time)
  g.gain.exponentialRampToValueAtTime(vol, time + 0.005)
  g.gain.exponentialRampToValueAtTime(0.0001, time + 0.16)
  o.connect(g)
  g.connect(dest)
  o.start(time)
  o.stop(time + 0.18)
}

function snare(ctx: AudioContext, dest: GainNode, time: number, vol: number) {
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = 'triangle'
  o.frequency.setValueAtTime(190, time)
  o.frequency.exponentialRampToValueAtTime(110, time + 0.07)
  g.gain.setValueAtTime(0.0001, time)
  g.gain.exponentialRampToValueAtTime(vol * 0.45, time + 0.005)
  g.gain.exponentialRampToValueAtTime(0.0001, time + 0.09)
  o.connect(g)
  g.connect(dest)
  o.start(time)
  o.stop(time + 0.1)
  noiseHat(ctx, dest, time, 0.05, vol * 0.55)
}

function noiseHat(ctx: AudioContext, dest: GainNode, time: number, dur: number, vol: number) {
  for (let i = 0; i < 2; i++) {
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'square'
    o.frequency.setValueAtTime(7000 + Math.random() * 4000 + i * 900, time)
    g.gain.setValueAtTime(0.0001, time)
    g.gain.exponentialRampToValueAtTime(vol * 0.7, time + 0.003)
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur)
    o.connect(g)
    g.connect(dest)
    o.start(time)
    o.stop(time + dur + 0.015)
  }
}

function chord(ctx: AudioContext, dest: GainNode, root: number, time: number, dur: number) {
  // Single soft triad — avoid double-octave stack that sounded like 2 tracks
  ;[0, 4, 7].forEach((iv, i) => {
    pluck(ctx, dest, hz(root + iv - 12), time + i * 0.008, dur, 'sine', 0.055)
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
  g.gain.exponentialRampToValueAtTime(Math.max(vol, 0.0001), time + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur)
  o.connect(g)
  g.connect(dest)
  o.start(time)
  o.stop(time + dur + 0.02)
}

export function isMusicRunning() {
  return running
}
