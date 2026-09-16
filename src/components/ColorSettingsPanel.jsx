import { useState } from 'react'
import {
  ESTILO_PADRAO_D20,
  ESTILO_PADRAO_D20_EXTRA,
  ESTILO_PADRAO_FEAR,
  ESTILO_PADRAO_HOPE,
} from '../utils/estiloPadraoDados'
import { MECANICA_D20, mecanicaDoJogador } from '../utils/mecanicaJogador'
import { TEMA_PADRAO } from '../utils/temasDados'
import ColorSwatchPicker from './ColorSwatchPicker'
import DiceColorModal from './DiceColorModal'

function ColorSettingsPanel({ jogador, mecanica, onAtualizarJogador, onFechar, coresOcupadas = [] }) {
  const [modalAberto, setModalAberto] = useState(null) // 'hope' | 'fear' | null
  const ehD20 = (mecanica ?? mecanicaDoJogador(jogador.nome)) === MECANICA_D20

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
        coresOcupadas={coresOcupadas}
      />

      <div className="home-botoes">
        <button type="button" onClick={() => setModalAberto('hope')}>
          {ehD20 ? 'Dado d20' : 'Dado de Esperança'}
        </button>
        <button type="button" onClick={() => setModalAberto('fear')}>
          {ehD20 ? 'Dado d20 extra' : 'Dado de Medo'}
        </button>
      </div>

      {modalAberto === 'hope' &&
        (ehD20 ? (
          <DiceColorModal
            titulo="Dado d20"
            corFundo={jogador.corD20}
            corBorda={jogador.corBordaD20}
            corTexto={jogador.corTextoD20}
            tema={jogador.temaD20 ?? TEMA_PADRAO}
            padrao={ESTILO_PADRAO_D20}
            onAplicar={({ corFundo, corBorda, corTexto, tema }) =>
              onAtualizarJogador({
                corD20: corFundo,
                corBordaD20: corBorda,
                corTextoD20: corTexto,
                temaD20: tema,
              })
            }
            onFechar={() => setModalAberto(null)}
          />
        ) : (
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
        ))}

      {modalAberto === 'fear' &&
        (ehD20 ? (
          <DiceColorModal
            titulo="Dado d20 extra (vantagem/desvantagem)"
            corFundo={jogador.corD20Extra}
            corBorda={jogador.corBordaD20Extra}
            corTexto={jogador.corTextoD20Extra}
            tema={jogador.temaD20Extra ?? TEMA_PADRAO}
            padrao={ESTILO_PADRAO_D20_EXTRA}
            onAplicar={({ corFundo, corBorda, corTexto, tema }) =>
              onAtualizarJogador({
                corD20Extra: corFundo,
                corBordaD20Extra: corBorda,
                corTextoD20Extra: corTexto,
                temaD20Extra: tema,
              })
            }
            onFechar={() => setModalAberto(null)}
          />
        ) : (
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
        ))}
    </div>
  )
}

export default ColorSettingsPanel
