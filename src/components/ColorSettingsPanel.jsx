import { useState } from 'react'
import { TEMA_PADRAO } from '../utils/temasDados'
import ColorSwatchPicker from './ColorSwatchPicker'
import DiceColorModal from './DiceColorModal'
import NomePicklist from './NomePicklist'

function ColorSettingsPanel({ jogador, onAtualizarJogador, onFechar, nomesOcupados = [] }) {
  const [modalAberto, setModalAberto] = useState(null) // 'hope' | 'fear' | null

  return (
    <div className="config-painel">
      <div className="config-painel-header">
        <h2>Suas configurações</h2>
        <button type="button" className="secundario" onClick={onFechar} aria-label="Fechar">
          ✕
        </button>
      </div>

      <NomePicklist
        label="Seu nome"
        nomeSelecionado={jogador.nome}
        onSelecionar={(nome) => onAtualizarJogador({ nome })}
        nomesOcupados={nomesOcupados}
      />

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
          onAlterarFundo={(corHope) => onAtualizarJogador({ corHope })}
          onAlterarBorda={(corBordaHope) => onAtualizarJogador({ corBordaHope })}
          onAlterarTexto={(corTextoHope) => onAtualizarJogador({ corTextoHope })}
          onAlterarTema={(temaHope) => onAtualizarJogador({ temaHope })}
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
          onAlterarFundo={(corFear) => onAtualizarJogador({ corFear })}
          onAlterarBorda={(corBordaFear) => onAtualizarJogador({ corBordaFear })}
          onAlterarTexto={(corTextoFear) => onAtualizarJogador({ corTextoFear })}
          onAlterarTema={(temaFear) => onAtualizarJogador({ temaFear })}
          onFechar={() => setModalAberto(null)}
        />
      )}
    </div>
  )
}

export default ColorSettingsPanel
