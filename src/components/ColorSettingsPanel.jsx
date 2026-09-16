import { useState } from 'react'
import { ESTILO_PADRAO_FEAR, ESTILO_PADRAO_HOPE } from '../utils/estiloPadraoDados'
import { TEMA_PADRAO } from '../utils/temasDados'
import ColorSwatchPicker from './ColorSwatchPicker'
import DiceColorModal from './DiceColorModal'

function ColorSettingsPanel({ jogador, onAtualizarJogador, onFechar }) {
  const [modalAberto, setModalAberto] = useState(null) // 'hope' | 'fear' | null

  return (
    <div className="config-painel">
      <div className="config-painel-header">
        <h2>Suas configurações</h2>
        <button type="button" className="secundario" onClick={onFechar} aria-label="Fechar">
          ✕
        </button>
      </div>

      <p className="config-painel-nome">
        Jogando como <strong>{jogador.nome}</strong>
      </p>

      <ColorSwatchPicker
        label="Sua cor"
        corSelecionada={jogador.cor}
        onSelecionar={(cor) => onAtualizarJogador({ cor })}
      />

      <div className="home-botoes">
        <button type="button" onClick={() => setModalAberto('hope')}>
          Dado de Esperança
        </button>
        <button type="button" onClick={() => setModalAberto('fear')}>
          Dado de Medo
        </button>
      </div>

      {modalAberto === 'hope' && (
        <DiceColorModal
          titulo="Dado de Esperança"
          corFundo={jogador.corHope}
          corBorda={jogador.corBordaHope}
          corTexto={jogador.corTextoHope}
          tema={jogador.temaHope ?? TEMA_PADRAO}
          padrao={ESTILO_PADRAO_HOPE}
          onAplicar={({ corFundo, corBorda, corTexto, tema }) =>
            onAtualizarJogador({
              corHope: corFundo,
              corBordaHope: corBorda,
              corTextoHope: corTexto,
              temaHope: tema,
            })
          }
          onFechar={() => setModalAberto(null)}
        />
      )}

      {modalAberto === 'fear' && (
        <DiceColorModal
          titulo="Dado de Medo"
          corFundo={jogador.corFear}
          corBorda={jogador.corBordaFear}
          corTexto={jogador.corTextoFear}
          tema={jogador.temaFear ?? TEMA_PADRAO}
          padrao={ESTILO_PADRAO_FEAR}
          onAplicar={({ corFundo, corBorda, corTexto, tema }) =>
            onAtualizarJogador({
              corFear: corFundo,
              corBordaFear: corBorda,
              corTextoFear: corTexto,
              temaFear: tema,
            })
          }
          onFechar={() => setModalAberto(null)}
        />
      )}
    </div>
  )
}

export default ColorSettingsPanel
