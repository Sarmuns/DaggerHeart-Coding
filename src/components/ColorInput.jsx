import { useState } from 'react'

const HEX_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

function normalizeHex(value) {
  let v = value.trim()
  if (v && !v.startsWith('#')) v = `#${v}`
  return v
}

function ColorInput({ label, value, onChange }) {
  const [text, setText] = useState(value)
  const [hasError, setHasError] = useState(false)

  function applyText(v) {
    setText(v)
    const normalized = normalizeHex(v)
    if (HEX_REGEX.test(normalized)) {
      setHasError(false)
      onChange(normalized)
    } else {
      setHasError(true)
    }
  }

  function applyPicker(v) {
    setText(v)
    setHasError(false)
    onChange(v)
  }

  return (
    <label className="color-input">
      {label}
      <div className="color-input-controls">
        <input
          type="color"
          value={HEX_REGEX.test(normalizeHex(text)) ? normalizeHex(text) : value}
          onChange={(e) => applyPicker(e.target.value)}
        />
        <input
          type="text"
          className={hasError ? 'field-error' : ''}
          value={text}
          onChange={(e) => applyText(e.target.value)}
          placeholder="#rrggbb"
          maxLength={7}
        />
      </div>
      {hasError && <span className="error">Hex inválido</span>}
    </label>
  )
}

export default ColorInput
