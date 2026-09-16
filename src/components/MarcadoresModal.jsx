import { useState } from 'react'
import { ehDM } from '../utils/mecanicaJogador'
import { MARCADORES_PADRAO } from '../utils/marcadoresJogador'

function paraNumero(valor) {
  const n = Number(valor)
  return Number.isFinite(n) ? n : 0
}

function CaixaTrack({ label, valor, max, onAlterarValor, onAlterarMax }) {
  return (
    <div className="marcador-caixa">
      <span className="marcador-caixa-label">{label}</span>
      <div className="marcador-caixa-valores">
        <input type="number" value={valor} onChange={(e) => onAlterarValor(paraNumero(e.target.value))} />
        <span className="marcador-caixa-divisor">/</span>
        <input type="number" value={max} onChange={(e) => onAlterarMax(paraNumero(e.target.value))} />
      </div>
    </div>
  )
}

function CaixaSimples({ label, valor, onAlterar }) {
  return (
    <div className="marcador-caixa">
      <span className="marcador-caixa-label">{label}</span>
      <div className="marcador-caixa-valores">
        <input type="number" value={valor} onChange={(e) => onAlterar(paraNumero(e.target.value))} />
      </div>
    </div>
  )
}

// Mesmo layout de modal dos dados (DiceColorModal) — só que sem preview de
// dado, é só os números. Rascunho local: nada vai pro banco/presence até
// clicar em Aplicar.
function MarcadoresModal({ nome, marcadores, onAplicar, onFechar }) {
  const [rascunho, setRascunho] = useState(marcadores)

  function alterar(campo) {
    return (valor) => setRascunho((atual) => ({ ...atual, [campo]: valor }))
  }

  function aplicar() {
    onAplicar(rascunho)
    onFechar()
  }

  function resetarParaPadrao() {
    setRascunho(MARCADORES_PADRAO)
  }

  return (
    <div className="modal-fundo" onClick={onFechar}>
      <div className="modal-caixa" onClick={(e) => e.stopPropagation()}>
        <div className="modal-cabecalho">
          <h2>Marcadores do personagem</h2>
          <button type="button" className="secundario" onClick={onFechar} aria-label="Fechar">
            ✕
          </button>
        </div>

        <div className="marcadores-grid">
          {ehDM(nome) ? (
            <CaixaTrack
              label="Medo"
              valor={rascunho.fear}
              max={rascunho.fearMax}
              onAlterarValor={alterar('fear')}
              onAlterarMax={alterar('fearMax')}
            />
          ) : (
            <>
              <CaixaTrack
                label="PV"
                valor={rascunho.pv}
                max={rascunho.pvMax}
                onAlterarValor={alterar('pv')}
                onAlterarMax={alterar('pvMax')}
              />
              <CaixaSimples label="Evasão" valor={rascunho.evasao} onAlterar={alterar('evasao')} />
              <CaixaTrack
                label="Armadura"
                valor={rascunho.armadura}
                max={rascunho.armaduraMax}
                onAlterarValor={alterar('armadura')}
                onAlterarMax={alterar('armaduraMax')}
              />
              <CaixaTrack
                label="Esperança"
                valor={rascunho.esperanca}
                max={rascunho.esperancaMax}
                onAlterarValor={alterar('esperanca')}
                onAlterarMax={alterar('esperancaMax')}
              />
              <CaixaTrack
                label="Estresse"
                valor={rascunho.estresse}
                max={rascunho.estresseMax}
                onAlterarValor={alterar('estresse')}
                onAlterarMax={alterar('estresseMax')}
              />
              <CaixaTrack
                label="Fadiga"
                valor={rascunho.fadiga}
                max={rascunho.fadigaMax}
                onAlterarValor={alterar('fadiga')}
                onAlterarMax={alterar('fadigaMax')}
              />
              <CaixaSimples label="Limiar Maior" valor={rascunho.limiarMaior} onAlterar={alterar('limiarMaior')} />
              <CaixaSimples label="Limiar Grave" valor={rascunho.limiarGrave} onAlterar={alterar('limiarGrave')} />
            </>
          )}
        </div>

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

export default MarcadoresModal
