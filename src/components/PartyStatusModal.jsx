import { useRef, useState } from 'react'
import Icon from './Icon'
import { FullStatSheet } from './PlayerSheet'

const INITIAL_POSITION = { x: 24, y: 96 }

// Read-only — real editing lives in each player's settings (⚙). This is
// just a live snapshot of everyone's status.
function PartyStatusModal({ players, myPresenceKey, getStats, onClose }) {
  const [position, setPosition] = useState(INITIAL_POSITION)
  const dragRef = useRef(null)

  function onPointerMove(e) {
    if (!dragRef.current) return
    setPosition({ x: e.clientX - dragRef.current.x, y: e.clientY - dragRef.current.y })
  }

  function stopDrag() {
    dragRef.current = null
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', stopDrag)
  }

  function startDrag(e) {
    dragRef.current = { x: e.clientX - position.x, y: e.clientY - position.y }
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', stopDrag)
  }

  return (
    <div className="status-modal" style={{ left: position.x, top: position.y }}>
      <div className="status-modal-header" onPointerDown={startDrag}>
        <span>Status da mesa</span>
        <button type="button" className="secundario modal-close" onClick={onClose} aria-label="Fechar">
          <Icon name="close" />
        </button>
      </div>
      <div className="status-modal-body">
        {players.length === 0 && <p className="status-modal-empty">Ninguém pra mostrar ainda.</p>}
        {players.map((p) => (
          <div key={p.presenceKey} className="status-modal-player">
            <strong style={{ color: p.color }}>
              {p.name}
              {p.presenceKey === myPresenceKey ? ' (você)' : ''}
            </strong>
            <FullStatSheet name={p.name} stats={getStats(p)} editable={false} onChangeField={() => {}} compact />
          </div>
        ))}
      </div>
    </div>
  )
}

export default PartyStatusModal
