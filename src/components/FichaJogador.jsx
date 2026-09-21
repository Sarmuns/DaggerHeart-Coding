import { useState } from 'react'
import { ehDM } from '../utils/mecanicaJogador'

function paraNumero(valor) {
  const n = Number(valor)
  return Number.isFinite(n) ? n : 0
}

// Marcador simples: só um número (ex. Evasão, Limiares de Dano) — usado no
// modal de status, onde a edição é liberada.
export function MarcadorSimples({ label, valor, editavel, onAlterar }) {
  return (
    <label className="marcador marcador--simples">
      <span className="marcador-label">{label}</span>
      <input
        type="number"
        value={valor}
        disabled={!editavel}
        onFocus={(e) => e.target.select()}
        onChange={(e) => onAlterar(paraNumero(e.target.value))}
      />
    </label>
  )
}

// Marcador em track: valor atual / máximo — usado no modal de status.
export function MarcadorTrack({ label, valor, max, editavel, onAlterarValor, onAlterarMax }) {
  return (
    <div className="marcador marcador--track">
      <span className="marcador-label">{label}</span>
      <div className="marcador-track-valores">
        <input
          type="number"
          value={valor}
          disabled={!editavel}
          onFocus={(e) => e.target.select()}
          onChange={(e) => onAlterarValor(paraNumero(e.target.value))}
        />
        <span className="marcador-track-separador">/</span>
        <input
          type="number"
          value={max}
          disabled={!editavel}
          onFocus={(e) => e.target.select()}
          onChange={(e) => onAlterarMax(paraNumero(e.target.value))}
        />
      </div>
    </div>
  )
}

// Linha "PV / Evasão / Armadura" acima dos dados — só leitura (edição de
// verdade fica no modal de status). Rótulo em cima, valor embaixo, cada um
// no seu próprio bloco, pra não virar uma sopa de texto colado.
export function ResumoLinha({ nome, marcadores }) {
  if (ehDM(nome)) return null

  return (
    <div className="resumo-linha">
      <div className="resumo-bloco">
        <span className="resumo-bloco-label">PV</span>
        <span className="resumo-bloco-valor">
          {marcadores.pv}/{marcadores.pvMax}
        </span>
      </div>
      <div className="resumo-bloco">
        <span className="resumo-bloco-label">Evasão</span>
        <span className="resumo-bloco-valor">{marcadores.evasao}</span>
      </div>
      <div className="resumo-bloco">
        <span className="resumo-bloco-label">Armadura</span>
        <span className="resumo-bloco-valor">
          {marcadores.armadura}/{marcadores.armaduraMax}
        </span>
      </div>
    </div>
  )
}

// Só a fileira de pontinhos, sem interação — usada tanto na caixa de dados
// (só leitura) quanto poderia ser reaproveitada em outro lugar.
function TrackPips({ label, valor, max }) {
  const total = Math.max(max, 0)
  return (
    <div className="track-pips">
      <span className="track-pips-label">{label}</span>
      <div className="track-pips-bolinhas">
        {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
          <span key={n} className={`pip${n <= valor ? ' pip--cheio' : ''}`} />
        ))}
      </div>
    </div>
  )
}

// Pontinhos + controle de "+N / -N" (só quando editável) — o único jeito de
// alterar Esperança/Estresse/Fadiga direto na caixa de dados. Tem cooldown
// de 5s (controlado pelo Room, compartilhado entre + e -) pra não virar
// spam de gravação no banco quando várias pessoas apertam ao mesmo tempo.
function LinhaTrack({ label, valor, max, editavel, podeAjustar, onAjustar }) {
  const [quantidade, setQuantidade] = useState(1)
  const limite = Math.max(max, 1)

  return (
    <div className="track-linha">
      {editavel && (
        <div className="track-remover">
          <button
            type="button"
            className="track-botao"
            disabled={!podeAjustar}
            title={podeAjustar ? `Remover ${label.toLowerCase()}` : 'Espera o cooldown acabar'}
            onClick={() => onAjustar(-quantidade)}
          >
            -
          </button>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            min={1}
            max={limite}
            value={quantidade}
            onFocus={(e) => e.target.select()}
            onClick={(e) => e.target.select()}
            onChange={(e) => setQuantidade(Math.min(Math.max(1, paraNumero(e.target.value)), limite))}
          />
        </div>
      )}
      <TrackPips label={label} valor={valor} max={max} />
      {editavel && (
        <button
          type="button"
          className="track-botao track-botao--somar"
          disabled={!podeAjustar}
          title={podeAjustar ? `Adicionar ${label.toLowerCase()}` : 'Espera o cooldown acabar'}
          onClick={() => onAjustar(quantidade)}
        >
          +
        </button>
      )}
    </div>
  )
}

// Pontinhos abaixo dos dados: Esperança, Estresse e Fadiga pro jogador; só
// Medo pro DM (no Daggerheart físico o Medo já é literalmente uma fileira
// de fichas, então isso é fiel ao jogo de mesa).
export function PipsJogador({ nome, marcadores, editavel, podeAjustar, onAjustar }) {
  if (ehDM(nome)) {
    return (
      <div className="pips-jogador">
        <LinhaTrack
          label="Medo"
          valor={marcadores.fear}
          max={marcadores.fearMax}
          editavel={editavel}
          podeAjustar={podeAjustar?.('fear')}
          onAjustar={(delta) => onAjustar('fear', delta)}
        />
      </div>
    )
  }

  return (
    <div className="pips-jogador">
      <LinhaTrack
        label="Esperança"
        valor={marcadores.esperanca}
        max={marcadores.esperancaMax}
        editavel={editavel}
        podeAjustar={podeAjustar?.('esperanca')}
        onAjustar={(delta) => onAjustar('esperanca', delta)}
      />
      <LinhaTrack
        label="Estresse"
        valor={marcadores.estresse}
        max={marcadores.estresseMax}
        editavel={editavel}
        podeAjustar={podeAjustar?.('estresse')}
        onAjustar={(delta) => onAjustar('estresse', delta)}
      />
      <LinhaTrack
        label="Fadiga"
        valor={marcadores.fadiga}
        max={marcadores.fadigaMax}
        editavel={editavel}
        podeAjustar={podeAjustar?.('fadiga')}
        onAjustar={(delta) => onAjustar('fadiga', delta)}
      />
    </div>
  )
}

// Ficha completa e editável, só dentro do modal de status — junta tudo que
// não está na linha de resumo nem nos pontinhos rápidos. É onde de fato se
// ajustam os valores (com um botão de Salvar explícito por fora, no
// modal), em vez de gravar a cada tecla.
export function FichaCompleta({ nome, marcadores, editavel, onAlterarCampo }) {
  function alterar(campo) {
    return (valor) => onAlterarCampo(campo, valor)
  }

  if (ehDM(nome)) {
    return (
      <div className="ficha-jogador">
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
