import { ehDM } from '../utils/mecanicaJogador'

function paraNumero(valor) {
  const n = Number(valor)
  return Number.isFinite(n) ? n : 0
}

function NumeroInline({ valor, editavel, onAlterar }) {
  return (
    <input
      type="number"
      className="numero-inline"
      value={valor}
      disabled={!editavel}
      onChange={(e) => onAlterar(paraNumero(e.target.value))}
    />
  )
}

// Marcador simples: só um número (ex. Evasão, Limiares de Dano) — usado no
// modal de status.
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

// Marcador em track: valor atual / máximo — usado no modal de status, pra
// ajustar o máximo (os pontinhos embaixo dos dados só mexem no atual).
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

// Linha compacta acima dos dados: PV, Evasão e Armadura "escritos" numa
// linha só. O DM não tem personagem, então essa linha some pra ele — o
// Medo dele vira só os pontinhos abaixo dos dados (ver PipsJogador).
export function ResumoLinha({ nome, marcadores, editavel, onAlterarCampo }) {
  if (ehDM(nome)) return null

  function alterar(campo) {
    return (valor) => onAlterarCampo(campo, valor)
  }

  return (
    <div className="resumo-linha">
      <span className="resumo-item">
        PV <NumeroInline valor={marcadores.pv} editavel={editavel} onAlterar={alterar('pv')} />
        <span className="resumo-barra">/</span>
        <NumeroInline valor={marcadores.pvMax} editavel={editavel} onAlterar={alterar('pvMax')} />
      </span>
      <span className="resumo-ponto">·</span>
      <span className="resumo-item">
        Evasão <NumeroInline valor={marcadores.evasao} editavel={editavel} onAlterar={alterar('evasao')} />
      </span>
      <span className="resumo-ponto">·</span>
      <span className="resumo-item">
        Armadura <NumeroInline valor={marcadores.armadura} editavel={editavel} onAlterar={alterar('armadura')} />
        <span className="resumo-barra">/</span>
        <NumeroInline valor={marcadores.armaduraMax} editavel={editavel} onAlterar={alterar('armaduraMax')} />
      </span>
    </div>
  )
}

// Uma fileira de pontinhos: clicar num pino marca até ele; clicar de novo
// no último pino marcado desmarca — jeito rápido de bater o marcador sem
// digitar número, igual ficha física.
function TrackPips({ label, valor, max, editavel, onAlterarValor }) {
  const total = Math.max(max, 0)
  return (
    <div className="track-pips">
      <span className="track-pips-label">{label}</span>
      <div className="track-pips-bolinhas">
        {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            className={`pip${n <= valor ? ' pip--cheio' : ''}`}
            disabled={!editavel}
            onClick={() => onAlterarValor(n === valor ? n - 1 : n)}
            aria-label={`${label} ${n} de ${max}`}
          />
        ))}
      </div>
    </div>
  )
}

// Pontinhos abaixo dos dados: Esperança, Estresse e Fadiga pro jogador; só
// Medo pro DM (no Daggerheart físico o Medo já é literalmente uma fileira
// de fichas, então isso é fiel ao jogo de mesa).
export function PipsJogador({ nome, marcadores, editavel, onAlterarCampo }) {
  function alterar(campo) {
    return (valor) => onAlterarCampo(campo, valor)
  }

  if (ehDM(nome)) {
    return (
      <div className="pips-jogador">
        <TrackPips
          label="Medo"
          valor={marcadores.fear}
          max={marcadores.fearMax}
          editavel={editavel}
          onAlterarValor={alterar('fear')}
        />
      </div>
    )
  }

  return (
    <div className="pips-jogador">
      <TrackPips
        label="Esperança"
        valor={marcadores.esperanca}
        max={marcadores.esperancaMax}
        editavel={editavel}
        onAlterarValor={alterar('esperanca')}
      />
      <TrackPips
        label="Estresse"
        valor={marcadores.estresse}
        max={marcadores.estresseMax}
        editavel={editavel}
        onAlterarValor={alterar('estresse')}
      />
      <TrackPips
        label="Fadiga"
        valor={marcadores.fadiga}
        max={marcadores.fadigaMax}
        editavel={editavel}
        onAlterarValor={alterar('fadiga')}
      />
    </div>
  )
}

// Os marcadores restantes (fora do resumo e dos pontinhos), mostrados só
// dentro do modal de status — é onde se ajusta o máximo de cada track e os
// Limiares de Dano. Pro DM não sobra nada aqui.
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
