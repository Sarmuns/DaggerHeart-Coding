import { useState } from 'react'

const HEX_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

function normalizarHex(valor) {
  let v = valor.trim()
  if (v && !v.startsWith('#')) v = `#${v}`
  return v
}

function ColorInput({ label, value, onChange }) {
  const [texto, setTexto] = useState(value)
  const [erro, setErro] = useState(false)

  function aplicarTexto(v) {
    setTexto(v)
    const normalizado = normalizarHex(v)
    if (HEX_REGEX.test(normalizado)) {
      setErro(false)
      onChange(normalizado)
    } else {
      setErro(true)
    }
  }

  function aplicarPicker(v) {
    setTexto(v)
    setErro(false)
    onChange(v)
  }

  return (
    <label className="color-input">
      {label}
      <div className="color-input-controles">
        <input
          type="color"
          value={HEX_REGEX.test(normalizarHex(texto)) ? normalizarHex(texto) : value}
          onChange={(e) => aplicarPicker(e.target.value)}
        />
        <input
          type="text"
          className={erro ? 'campo-erro' : ''}
          value={texto}
          onChange={(e) => aplicarTexto(e.target.value)}
          placeholder="#rrggbb"
          maxLength={7}
        />
      </div>
      {erro && <span className="erro">Hex inválido</span>}
    </label>
  )
}

export default ColorInput
