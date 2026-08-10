const C5 = 523.25

export const hz = (semitones: number) => C5 * Math.pow(2, semitones / 12)

let ctx: AudioContext | null = null
let muted = false

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

/** Used by music layer to respect mute without importing cycles carefully */
export function getMutedFlag() {
  return muted
}

export async function bootAudio() {
  if (!ctx) {
    ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  }
  try {
    ;(navigator as unknown as { audioSession?: { type: string } }).audioSession &&
      ((navigator as unknown as { audioSession: { type: string } }).audioSession.type = 'playback')
  } catch {
    /* ignore */
  }
  if (ctx.state !== 'running') await ctx.resume()

  // Warm channel on first gesture (Safari)
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  g.gain.value = 0.0001
  o.connect(g)
  g.connect(ctx.destination)
  o.start()
  o.stop(ctx.currentTime + 0.02)
}

export function tone(
  freq: number,
  at: number,
  dur: number,
  type: OscillatorType,
  vol: number,
) {
  if (!ctx || muted) return
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, at)
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(Math.max(vol, 0.0001), at + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  o.connect(g)
  g.connect(ctx.destination)
  o.start(at)
  o.stop(at + dur + 0.03)
}

export function now() {
  return ctx?.currentTime ?? 0
}

export function getCtx() {
  return ctx
}
