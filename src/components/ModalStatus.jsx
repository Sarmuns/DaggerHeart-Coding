import { useRef, useState } from 'react'
import { FichaCompleta } from './FichaJogador'

const POSICAO_INICIAL = { x: 24, y: 96 }

// Só visualização — edição de verdade fica nas configurações (⚙) de cada
// jogador. Aqui é só um retrato em tempo real do status de todo mundo.
function ModalStatus({ jogadores, meuPresenceKey, obterMarcadores, onFechar }) {
  const [posicao, setPosicao] = useState(POSICAO_INICIAL)
  const arrastoRef = useRef(null)

  function mover(e) {
    if (!arrastoRef.current) return
    setPosicao({ x: e.clientX - arrastoRef.current.x, y: e.clientY - arrastoRef.current.y })
  }

  function soltar() {
    arrastoRef.current = null
    window.removeEventListener('pointermove', mover)
    window.removeEventListener('pointerup', soltar)
  }

  function iniciarArrasto(e) {
    arrastoRef.current = { x: e.clientX - posicao.x, y: e.clientY - posicao.y }
    window.addEventListener('pointermove', mover)
    window.addEventListener('pointerup', soltar)
  }

  return (
    <div className="modal-status" style={{ left: posicao.x, top: posicao.y }}>
      <div className="modal-status-header" onPointerDown={iniciarArrasto}>
        <span>Status da mesa</span>
        <button type="button" className="secundario" onClick={onFechar} aria-label="Fechar">
          ✕
        </button>
      </div>
      <div className="modal-status-corpo">
        {jogadores.length === 0 && <p className="modal-status-vazio">Ninguém pra mostrar ainda.</p>}
        {jogadores.map((jg) => (
          <div key={jg.presenceKey} className="modal-status-jogador">
            <strong style={{ color: jg.cor }}>
              {jg.nome}
              {jg.presenceKey === meuPresenceKey ? ' (você)' : ''}
            </strong>
            <FichaCompleta nome={jg.nome} marcadores={obterMarcadores(jg)} editavel={false} onAlterarCampo={() => {}} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default ModalStatus
