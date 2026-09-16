import { TEMAS_DADOS } from '../utils/temasDados'
import ColorInput from './ColorInput'
import DicePreview from './DicePreview'

function DiceColorModal({
  titulo,
  corFundo,
  corBorda,
  corTexto,
  tema,
  onAlterarFundo,
  onAlterarBorda,
  onAlterarTexto,
  onAlterarTema,
  onFechar,
}) {
  return (
    <div className="modal-fundo" onClick={onFechar}>
      <div className="modal-caixa" onClick={(e) => e.stopPropagation()}>
        <div className="modal-cabecalho">
          <h2>{titulo}</h2>
          <button type="button" className="secundario" onClick={onFechar} aria-label="Fechar">
            ✕
          </button>
        </div>

        <DicePreview corFundo={corFundo} corBorda={corBorda} corTexto={corTexto} tema={tema} />

        <label className="select-tema">
          Tema / efeito
          <select value={tema} onChange={(e) => onAlterarTema(e.target.value)}>
            {TEMAS_DADOS.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.nome}
              </option>
            ))}
          </select>
        </label>

        <ColorInput label="Cor do dado" value={corFundo} onChange={onAlterarFundo} />
        <ColorInput label="Cor das bordas" value={corBorda} onChange={onAlterarBorda} />
        <ColorInput label="Cor dos números" value={corTexto} onChange={onAlterarTexto} />
      </div>
    </div>
  )
}

export default DiceColorModal
