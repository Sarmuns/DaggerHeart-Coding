import { useRef, useState } from 'react'
import { FichaCompleta } from './FichaJogador'

const POSICAO_INICIAL = { x: 24, y: 96 }

// Edição de verdade só acontece aqui, num rascunho local — nada vai pro
// banco/presence até apertar "Salvar". Assim um input mudando de novo em
// novo (ou a setinha do <input type="number">) não gera uma gravação por
// tecla, só uma por clique em Salvar.
function ModalStatus({ jogadores, meuPresenceKey, meusMarcadores, obterMarcadores, onSalvar, onFechar }) {
  const [posicao, setPosicao] = useState(POSICAO_INICIAL)
  const [rascunho, setRascunho] = useState(meusMarcadores)
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

  function alterarRascunho(campo, valor) {
    setRascunho((atual) => ({ ...atual, [campo]: valor }))
  }

  function salvar() {
    onSalvar(rascunho)
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
        {jogadores.map((jg) => {
          const souEu = jg.presenceKey === meuPresenceKey
          return (
            <div key={jg.presenceKey} className="modal-status-jogador">
              <strong style={{ color: jg.cor }}>{jg.nome}</strong>
              <FichaCompleta
                nome={jg.nome}
                marcadores={souEu ? rascunho : obterMarcadores(jg)}
                editavel={souEu}
                onAlterarCampo={alterarRascunho}
              />
              {souEu && (
                <button type="button" className="botao-salvar-status" onClick={salvar}>
                  Salvar
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ModalStatus
