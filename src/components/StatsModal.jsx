import { useState } from 'react'
import { DEFAULT_STATS } from '../utils/playerStats'
import Modal from './Modal'
import { FullStatSheet } from './PlayerSheet'

// Same field components as the status modal (PlayerSheet), just laid out in
// a bigger grid. Local draft: nothing goes to the database/presence until
// clicking Apply.
function StatsModal({ name, stats, onApply, onClose }) {
  const [draft, setDraft] = useState(stats)

  function changeField(field, value) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  function apply() {
    onApply(draft)
    onClose()
  }

  function resetToDefault() {
    setDraft(DEFAULT_STATS)
  }

  return (
    <Modal title="Marcadores do personagem" onClose={onClose}>
      <FullStatSheet name={name} stats={draft} editable onChangeField={changeField} />

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

export default StatsModal
