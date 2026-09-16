import { ehDM } from '../utils/mecanicaJogador'

function paraNumero(valor) {
  const n = Number(valor)
  return Number.isFinite(n) ? n : 0
}

// Marcador simples: só um número (ex. Evasão, Limiares de Dano).
export function MarcadorSimples({ label, valor, editavel, onAlterar }) {
  return (
    <label className="marcador marcador--simples">
      <span className="marcador-label">{label}</span>
      <input
        type="number"
        value={valor}
        disabled={!editavel}
        onChange={(e) => onAlterar(paraNumero(e.target.value))}
      />
    </label>
  )
}

// Marcador em track: valor atual / máximo (PV, Esperança, Estresse, Fadiga,
// Armadura, Medo) — ambos editáveis livremente, sem limitar o valor atual
// ao máximo (a mesa decide se estourar o track significa algo).
export function MarcadorTrack({ label, valor, max, editavel, onAlterarValor, onAlterarMax }) {
  return (
    <div className="marcador marcador--track">
      <span className="marcador-label">{label}</span>
      <div className="marcador-track-valores">
        <input
          type="number"
          value={valor}
          disabled={!editavel}
          onChange={(e) => onAlterarValor(paraNumero(e.target.value))}
        />
        <span className="marcador-track-separador">/</span>
        <input
          type="number"
          value={max}
          disabled={!editavel}
          onChange={(e) => onAlterarMax(paraNumero(e.target.value))}
        />
      </div>
    </div>
  )
}

// Resumo compacto, mostrado junto da caixa de dados de cada jogador: só o
// essencial pra bater o olho (PV, Evasão, Armadura). Pro DM, os marcadores
// normais não existem — o resumo dele é só o track de Medo.
export function FichaResumo({ nome, marcadores, editavel, onAlterarCampo }) {
  function alterar(campo) {
    return (valor) => onAlterarCampo(campo, valor)
  }

  if (ehDM(nome)) {
    return (
      <div className="ficha-jogador ficha-jogador--dm">
        <MarcadorTrack
          label="Medo"
          valor={marcadores.fear}
          max={marcadores.fearMax}
          editavel={editavel}
          onAlterarValor={alterar('fear')}
          onAlterarMax={alterar('fearMax')}
        />
      </div>
    )
  }

  return (
    <div className="ficha-jogador">
      <MarcadorTrack
        label="PV"
        valor={marcadores.pv}
        max={marcadores.pvMax}
        editavel={editavel}
        onAlterarValor={alterar('pv')}
        onAlterarMax={alterar('pvMax')}
      />
      <MarcadorSimples label="Evasão" valor={marcadores.evasao} editavel={editavel} onAlterar={alterar('evasao')} />
      <MarcadorTrack
        label="Armadura"
        valor={marcadores.armadura}
        max={marcadores.armaduraMax}
        editavel={editavel}
        onAlterarValor={alterar('armadura')}
        onAlterarMax={alterar('armaduraMax')}
      />
    </div>
  )
}

// Os demais marcadores (fora do resumo compacto), mostrados só dentro do
// modal de status. Pro DM não sobra nada aqui — o Medo já está no resumo.
export function FichaCompleta({ nome, marcadores, editavel, onAlterarCampo }) {
  if (ehDM(nome)) return null

  function alterar(campo) {
    return (valor) => onAlterarCampo(campo, valor)
  }

  return (
    <div className="ficha-jogador">
      <MarcadorTrack
        label="Esperança"
        valor={marcadores.esperanca}
        max={marcadores.esperancaMax}
        editavel={editavel}
        onAlterarValor={alterar('esperanca')}
        onAlterarMax={alterar('esperancaMax')}
      />
      <MarcadorTrack
        label="Estresse"
        valor={marcadores.estresse}
        max={marcadores.estresseMax}
        editavel={editavel}
        onAlterarValor={alterar('estresse')}
        onAlterarMax={alterar('estresseMax')}
      />
      <MarcadorTrack
        label="Fadiga"
        valor={marcadores.fadiga}
        max={marcadores.fadigaMax}
        editavel={editavel}
        onAlterarValor={alterar('fadiga')}
        onAlterarMax={alterar('fadigaMax')}
      />
      <MarcadorSimples
        label="Limiar Maior"
        valor={marcadores.limiarMaior}
        editavel={editavel}
        onAlterar={alterar('limiarMaior')}
      />
      <MarcadorSimples
        label="Limiar Grave"
        valor={marcadores.limiarGrave}
        editavel={editavel}
        onAlterar={alterar('limiarGrave')}
      />
    </div>
  )
}
