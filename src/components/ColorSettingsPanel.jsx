import ColorInput from './ColorInput'
import ColorSwatchPicker from './ColorSwatchPicker'
import NomePicklist from './NomePicklist'

function ColorSettingsPanel({ jogador, onAtualizarJogador, onFechar }) {
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
      />

      <ColorSwatchPicker
        label="Sua cor"
        corSelecionada={jogador.cor}
        onSelecionar={(cor) => onAtualizarJogador({ cor })}
      />

      <ColorInput
        label="Cor do dado de Esperança"
        value={jogador.corHope}
        onChange={(corHope) => onAtualizarJogador({ corHope })}
      />
      <ColorInput
        label="Cor dos números (Esperança)"
        value={jogador.corTextoHope}
        onChange={(corTextoHope) => onAtualizarJogador({ corTextoHope })}
      />
      <ColorInput
        label="Cor do dado de Medo"
        value={jogador.corFear}
        onChange={(corFear) => onAtualizarJogador({ corFear })}
      />
      <ColorInput
        label="Cor dos números (Medo)"
        value={jogador.corTextoFear}
        onChange={(corTextoFear) => onAtualizarJogador({ corTextoFear })}
      />
    </div>
  )
}

export default ColorSettingsPanel
