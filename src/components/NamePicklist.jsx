import { PLAYER_NAMES } from '../utils/players'

function NamePicklist({ label, selectedName, onSelect, takenNames = [] }) {
  return (
    <div className="name-picklist">
      <p className="color-label">{label}</p>
      <div className="colors">
        {PLAYER_NAMES.map((name) => {
          const taken = name !== selectedName && takenNames.includes(name)
          return (
            <button
              key={name}
              type="button"
              disabled={taken}
              title={taken ? `${name} já está na sala` : undefined}
              className={`name-option${selectedName === name ? ' selected' : ''}${taken ? ' name-option--taken' : ''}`}
              onClick={() => onSelect(name)}
            >
              {name}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default NamePicklist
