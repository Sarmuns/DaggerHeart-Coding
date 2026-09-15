import ColorInput from './ColorInput'
import ColorSwatchPicker from './ColorSwatchPicker'

function ColorSettingsPanel({ jogador, onAtualizarJogador, onFechar }) {
  return (
    <div className="config-painel">
      <div className="config-painel-header">
        <h2>Suas configurações</h2>
        <button type="button" className="secundario" onClick={onFechar} aria-label="Fechar">
          ✕
        </button>
      </div>

      <label>
        Seu nome
        <input
          value={jogador.nome}
          onChange={(e) => onAtualizarJogador({ nome: e.target.value })}
          maxLength={20}
        />
      </label>

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
        label="Cor do dado de Medo"
        value={jogador.corFear}
        onChange={(corFear) => onAtualizarJogador({ corFear })}
      />
    </div>
  )
}

export default ColorSettingsPanel
