// Reusable pill-shaped toggle button + group, used for the dice-system and
// roll-mode switches in Room.
export function Pill({ active, onClick, children }) {
  return (
    <button type="button" className={`pill${active ? ' pill--active' : ''}`} onClick={onClick}>
      {children}
    </button>
  )
}

export function PillGroup({ children }) {
  return <div className="pill-group">{children}</div>
}
