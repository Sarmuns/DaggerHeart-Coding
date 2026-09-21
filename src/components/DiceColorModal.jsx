import { useState } from 'react'
import { DICE_THEMES } from '../utils/diceThemes'
import ColorInput from './ColorInput'
import DicePreview from './DicePreview'
import Modal from './Modal'

function DiceColorModal({ title, backgroundColor, borderColor, textColor, theme, defaultStyle, onApply, onClose }) {
  // Draft state: only becomes "real" (broadcast + database) once the player
  // clicks Apply, avoiding a sync on every keystroke.
  const [draftBackground, setDraftBackground] = useState(backgroundColor)
  const [draftBorder, setDraftBorder] = useState(borderColor)
  const [draftText, setDraftText] = useState(textColor)
  const [draftTheme, setDraftTheme] = useState(theme)

  function apply() {
    onApply({
      backgroundColor: draftBackground,
      borderColor: draftBorder,
      textColor: draftText,
      theme: draftTheme,
    })
    onClose()
  }

  function resetToDefault() {
    setDraftBackground(defaultStyle.backgroundColor)
    setDraftBorder(defaultStyle.borderColor)
    setDraftText(defaultStyle.textColor)
    setDraftTheme(defaultStyle.theme)
  }

  return (
    <Modal title={title} onClose={onClose}>
      <DicePreview
        backgroundColor={draftBackground}
        borderColor={draftBorder}
        textColor={draftText}
        theme={draftTheme}
      />

      <label className="theme-select">
        Tema / efeito
        <select value={draftTheme} onChange={(e) => setDraftTheme(e.target.value)}>
          {DICE_THEMES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.name}
            </option>
          ))}
        </select>
      </label>

      <ColorInput label="Cor do dado" value={draftBackground} onChange={setDraftBackground} />
      <ColorInput label="Cor das bordas" value={draftBorder} onChange={setDraftBorder} />
      <ColorInput label="Cor dos números" value={draftText} onChange={setDraftText} />

      <div className="modal-actions">
        <button type="button" className="secundario" onClick={resetToDefault}>
          Resetar para padrão
        </button>
        <button type="button" onClick={apply}>
          Aplicar
        </button>
      </div>
    </Modal>
  )
}

export default DiceColorModal
