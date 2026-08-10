import { useEffect, useState } from 'react'
import { TIMING } from '../engine/scoring'

interface Particle {
  id: number
  x: number
  y: number
  dx: number
  dy: number
  color: string
  size: number
}

const COLORS = ['#3B5BFF', '#FFD230', '#12A75E', '#FF6B2C', '#E0323C', '#8B5CF6', '#00D4FF']

export function ParticleBurst({
  x,
  y,
  active,
  mega = false,
}: {
  x: number
  y: number
  active: boolean
  mega?: boolean
}) {
  const [particles, setParticles] = useState<Particle[]>([])
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (!active || reduce) {
      setParticles([])
      return
    }
    const count = mega ? 24 : 16
    const next: Particle[] = Array.from({ length: count }, (_, i) => {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3
      const speed = (mega ? 90 : 60) + Math.random() * (mega ? 120 : 90)
      return {
        id: i,
        x,
        y,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        color: COLORS[i % COLORS.length]!,
        size: (mega ? 6 : 5) + Math.random() * 6,
      }
    })
    setParticles(next)
    const t = window.setTimeout(() => setParticles([]), TIMING.PARTICLE_LIFE)
    return () => clearTimeout(t)
  }, [active, x, y, reduce, mega])

  if (!particles.length) return null

  return (
    <div className="particles" aria-hidden>
      {particles.map((p) => (
        <span
          key={p.id}
          className="particle"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            background: p.color,
            ['--dx' as string]: `${p.dx}px`,
            ['--dy' as string]: `${p.dy}px`,
          }}
        />
      ))}
    </div>
  )
}
