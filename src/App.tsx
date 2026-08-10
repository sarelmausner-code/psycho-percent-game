import { Component, useEffect, type ErrorInfo, type ReactNode } from 'react'
import { Home } from './screens/Home'
import { Map } from './screens/Map'
import { Play } from './screens/Play'
import { StageEnd } from './screens/StageEnd'
import { useGameStore } from './store/gameStore'

class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App crash', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'Heebo, sans-serif', direction: 'rtl' }}>
          <h2>משהו נשבר 😅</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: '#c00' }}>
            {this.state.error.message}
          </pre>
          <button
            type="button"
            onClick={() => {
              this.setState({ error: null })
              useGameStore.getState().goHome()
            }}
            style={{
              marginTop: 12,
              padding: '12px 20px',
              background: '#3B5BFF',
              color: '#fff',
              border: 0,
              borderRadius: 12,
              fontWeight: 700,
            }}
          >
            חזרה הביתה
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function Router() {
  const screen = useGameStore((s) => s.screen)
  const ready = useGameStore((s) => s.ready)
  const hydrate = useGameStore((s) => s.hydrate)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  if (!ready) {
    return (
      <div className="app-shell">
        <div className="screen home" style={{ justifyContent: 'center', textAlign: 'center' }}>
          <p className="hint">טוען…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      {screen === 'home' && <Home />}
      {screen === 'map' && <Map />}
      {screen === 'play' && <Play />}
      {screen === 'end' && <StageEnd />}
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router />
    </ErrorBoundary>
  )
}
