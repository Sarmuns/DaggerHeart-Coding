import ColorInput from './ColorInput'

function DiceColorModal({ titulo, corFundo, corBorda, corTexto, onAlterarFundo, onAlterarBorda, onAlterarTexto, onFechar }) {
  return (
    <div className="modal-fundo" onClick={onFechar}>
      <div className="modal-caixa" onClick={(e) => e.stopPropagation()}>
        <div className="modal-cabecalho">
          <h2>{titulo}</h2>
          <button type="button" className="secundario" onClick={onFechar} aria-label="Fechar">
            ✕
          </button>
        </div>
        <ColorInput label="Cor do dado" value={corFundo} onChange={onAlterarFundo} />
        <ColorInput label="Cor das bordas" value={corBorda} onChange={onAlterarBorda} />
        <ColorInput label="Cor dos números" value={corTexto} onChange={onAlterarTexto} />
      </div>
    </div>
  )
}

export default DiceColorModal
