import { useEffect, useMemo, useRef } from 'react'

// Duration of each effect — needs to match the longest CSS animation for
// each one (App.css), otherwise Room unmounts the component before it ends.
const DURATION_MS = {
  sparks: 1400,
  shake: 650,
  crack: 700,
  seal: 1500,
  coins: 2800,
}

function generateSparks(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: `spark-${i}`,
    angle: (360 / n) * i + (Math.random() * 20 - 10),
    distance: 95 + Math.random() * 65,
    delay: Math.random() * 100,
  }))
}

function generateCoins(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: `coin-${i}`,
    left: 4 + Math.random() * 92,
    delay: Math.random() * 2200,
    duration: 900 + Math.random() * 500,
  }))
}

function CriticalEffect({ type, onEnd, boxRef }) {
  // Keeps the latest version of onEnd in a ref so it doesn't need to be in
  // the effect's deps below — Room re-renders for other reasons (presence
  // sync, etc.) and recreates this function every time, which used to reset
  // the timer before it completed.
  const onEndRef = useRef(onEnd)
  onEndRef.current = onEnd

  useEffect(() => {
    const duration = DURATION_MS[type] ?? 1200
    const id = setTimeout(() => onEndRef.current(), duration)
    return () => clearTimeout(id)
  }, [type])

  // Every critical shakes the box of whoever rolled — that shake always
  // happens, on top of the specific visual effect picked. "Shake" gets a
  // stronger/longer class; the others get a light shake.
  useEffect(() => {
    const el = boxRef?.current
    if (!el) return
    const className = type === 'shake' ? 'box-shake-strong' : 'box-shake-light'
    const duration = type === 'shake' ? 500 : 350
    el.classList.add(className)
    const id = setTimeout(() => el.classList.remove(className), duration)
    return () => {
      clearTimeout(id)
      el.classList.remove(className)
    }
  }, [type, boxRef])

  const sparks = useMemo(() => generateSparks(22), [])
  const coins = useMemo(() => generateCoins(16), [])

  if (type === 'sparks') {
    return (
      <div className="critical-effect critical-effect-sparks" aria-hidden="true">
        <span className="sparks-flash" />
        {sparks.map((p) => (
          <span
            key={p.id}
            className="spark"
            style={{ '--angle': `${p.angle}deg`, '--distance': `${p.distance}px`, animationDelay: `${p.delay}ms` }}
          />
        ))}
      </div>
    )
  }

  if (type === 'shake') {
    return <div className="critical-effect critical-effect-shake-flash" aria-hidden="true" />
  }

  if (type === 'crack') {
    return (
      <div className="critical-effect critical-effect-crack" aria-hidden="true">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="crack-bolt">
          <polyline points="60,0 45,30 58,32 30,70 40,45 25,42 50,0" />
        </svg>
      </div>
    )
  }

  if (type === 'seal') {
    return (
      <div className="critical-effect critical-effect-seal" aria-hidden="true">
        <span className="seal-text">CRÍTICO!</span>
      </div>
    )
  }

  if (type === 'coins') {
    return (
      <div className="critical-effect critical-effect-coins" aria-hidden="true">
        {coins.map((c) => (
          <span
            key={c.id}
            className="coin"
            style={{ left: `${c.left}%`, animationDelay: `${c.delay}ms`, animationDuration: `${c.duration}ms` }}
          />
        ))}
      </div>
    )
  }

  return null
}

export default CriticalEffect
