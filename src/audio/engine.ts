const C5 = 523.25

export const hz = (semitones: number) => C5 * Math.pow(2, semitones / 12)

let ctx: AudioContext | null = null
let muted = false

/** Shared buses so SFX can duck music. */
let masterOut: GainNode | null = null
let musicBus: GainNode | null = null
let sfxBus: GainNode | null = null

export function isMuted() {
  return muted
}

export function setMuted(v: boolean) {
  muted = v
}

export function toggleMute() {
  muted = !muted
  return muted
}

export function getMutedFlag() {
  return muted
}

function ensureBuses() {
  if (!ctx) return
  if (!masterOut) {
    masterOut = ctx.createGain()
    masterOut.gain.value = 1
    masterOut.connect(ctx.destination)
  }
  if (!musicBus) {
    musicBus = ctx.createGain()
    musicBus.gain.value = 0.85
    musicBus.connect(masterOut)
  }
  if (!sfxBus) {
    sfxBus = ctx.createGain()
    sfxBus.gain.value = 1
    sfxBus.connect(masterOut)
  }
}

export async function bootAudio() {
  if (!ctx) {
    ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  }
  ensureBuses()
  try {
    ;(navigator as unknown as { audioSession?: { type: string } }).audioSession &&
      ((navigator as unknown as { audioSession: { type: string } }).audioSession.type = 'playback')
  } catch {
    /* ignore */
  }
  if (ctx.state !== 'running') await ctx.resume()

  const o = ctx.createOscillator()
  const g = ctx.createGain()
  g.gain.value = 0.0001
  o.connect(g)
  g.connect(ctx.destination)
  o.start()
  o.stop(ctx.currentTime + 0.02)
}

export function getCtx() {
  return ctx
}

export function getMusicBus() {
  ensureBuses()
  return musicBus
}

export function getSfxBus() {
  ensureBuses()
  return sfxBus
}

export function now() {
  return ctx?.currentTime ?? 0
}

/** One-shot tone into SFX bus (not music). */
export function tone(
  freq: number,
  at: number,
  dur: number,
  type: OscillatorType,
  vol: number,
) {
  if (!ctx || muted) return
  ensureBuses()
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, at)
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(Math.max(vol, 0.0001), at + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  o.connect(g)
  g.connect(sfxBus!)
  o.start(at)
  o.stop(at + dur + 0.03)
}

/** Brief music duck so correct SFX punches through. */
export function duckMusic(amount = 0.35, attack = 0.02, hold = 0.08, release = 0.18) {
  if (!ctx || !musicBus || muted) return
  const t = ctx.currentTime
  const g = musicBus.gain
  const cur = g.value
  g.cancelScheduledValues(t)
  g.setValueAtTime(cur, t)
  g.linearRampToValueAtTime(Math.max(0.15, cur * amount), t + attack)
  g.linearRampToValueAtTime(Math.max(0.15, cur * amount), t + attack + hold)
  g.linearRampToValueAtTime(0.85, t + attack + hold + release)
}
