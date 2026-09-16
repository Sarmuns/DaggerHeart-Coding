import { useState } from 'react'
import { TEMAS_DADOS } from '../utils/temasDados'
import ColorInput from './ColorInput'
import DicePreview from './DicePreview'

function DiceColorModal({ titulo, corFundo, corBorda, corTexto, tema, padrao, onAplicar, onFechar }) {
  // Estado de rascunho: só vira "de verdade" (broadcast + banco) quando o
  // jogador clica em Aplicar, evitando sincronizar cada tecla digitada.
  const [rascunhoFundo, setRascunhoFundo] = useState(corFundo)
  const [rascunhoBorda, setRascunhoBorda] = useState(corBorda)
  const [rascunhoTexto, setRascunhoTexto] = useState(corTexto)
  const [rascunhoTema, setRascunhoTema] = useState(tema)

  function aplicar() {
    onAplicar({
      corFundo: rascunhoFundo,
      corBorda: rascunhoBorda,
      corTexto: rascunhoTexto,
      tema: rascunhoTema,
    })
    onFechar()
  }

  function resetarParaPadrao() {
    setRascunhoFundo(padrao.corFundo)
    setRascunhoBorda(padrao.corBorda)
    setRascunhoTexto(padrao.corTexto)
    setRascunhoTema(padrao.tema)
  }

  return (
    <div className="modal-fundo" onClick={onFechar}>
      <div className="modal-caixa" onClick={(e) => e.stopPropagation()}>
        <div className="modal-cabecalho">
          <h2>{titulo}</h2>
          <button type="button" className="secundario" onClick={onFechar} aria-label="Fechar">
            ✕
          </button>
        </div>

        <DicePreview
          corFundo={rascunhoFundo}
          corBorda={rascunhoBorda}
          corTexto={rascunhoTexto}
          tema={rascunhoTema}
        />

        <label className="select-tema">
          Tema / efeito
          <select value={rascunhoTema} onChange={(e) => setRascunhoTema(e.target.value)}>
            {TEMAS_DADOS.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.nome}
              </option>
            ))}
          </select>
        </label>

        <ColorInput label="Cor do dado" value={rascunhoFundo} onChange={setRascunhoFundo} />
        <ColorInput label="Cor das bordas" value={rascunhoBorda} onChange={setRascunhoBorda} />
        <ColorInput label="Cor dos números" value={rascunhoTexto} onChange={setRascunhoTexto} />

        <div className="modal-botoes">
          <button type="button" className="secundario" onClick={resetarParaPadrao}>
            Resetar para padrão
          </button>
          <button type="button" onClick={aplicar}>
            Aplicar
          </button>
        </div>
      </div>
    </div>
  )
}

export default DiceColorModal
