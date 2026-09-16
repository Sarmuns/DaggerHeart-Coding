import { ehDM } from '../utils/mecanicaJogador'

function paraNumero(valor) {
  const n = Number(valor)
  return Number.isFinite(n) ? n : 0
}

// Marcador simples: só um número (ex. Evasão, Limiares de Dano).
function MarcadorSimples({ label, valor, editavel, onAlterar }) {
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
function MarcadorTrack({ label, valor, max, editavel, onAlterarValor, onAlterarMax }) {
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

// Ficha compacta de personagem por jogador. Pro jogador com tag de DM, os
// marcadores normais somem (pra ele e pra todo mundo) e no lugar aparece só
// o track de Medo — o recurso do mestre, não de personagem.
function FichaJogador({ nome, marcadores, editavel, onAlterarCampo }) {
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
      <MarcadorTrack
        label="Armadura"
        valor={marcadores.armadura}
        max={marcadores.armaduraMax}
        editavel={editavel}
        onAlterarValor={alterar('armadura')}
        onAlterarMax={alterar('armaduraMax')}
      />
      <MarcadorSimples label="Evasão" valor={marcadores.evasao} editavel={editavel} onAlterar={alterar('evasao')} />
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

export default FichaJogador
