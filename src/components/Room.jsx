import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { calcularResultado, textoResultado } from '../utils/dice'
import ColorSettingsPanel from './ColorSettingsPanel'
import PlayerDiceSet from './PlayerDiceSet'

const COR_CRITICO = '#aa3bff'
const FUSO_BRASIL = 'America/Sao_Paulo'

function corResultado(vencedor, cores) {
  if (vencedor === 'hope') return cores.corHope
  if (vencedor === 'fear') return cores.corFear
  return COR_CRITICO
}

function formatarHorario(isoString) {
  const data = new Date(isoString)
  const dataFormatada = data.toLocaleDateString('pt-BR', { timeZone: FUSO_BRASIL })
  const horaFormatada = data.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: FUSO_BRASIL,
  })
  return `${dataFormatada} ${horaFormatada}`
}

function linhaParaHistorico(linha) {
  return {
    id: linha.id,
    jogador: linha.jogador,
    cor: linha.cor,
    corHope: linha.cor_hope,
    corFear: linha.cor_fear,
    hope: linha.dado_hope,
    fear: linha.dado_fear,
    vencedor: linha.vencedor,
    total: linha.total,
    horario: formatarHorario(linha.criado_em),
  }
}

function Room({ sala, onAtualizarSala, jogador, onAtualizarJogador }) {
  const canalRef = useRef(null)
  const presenceKeyRef = useRef(crypto.randomUUID())
  const diceRefsRef = useRef(new Map())
  const [rolando, setRolando] = useState(false)
  const [ultimoResultado, setUltimoResultado] = useState(null)
  const [historico, setHistorico] = useState([])
  const [painelAberto, setPainelAberto] = useState(false)
  const [jogadoresOnline, setJogadoresOnline] = useState([])

  useEffect(() => {
    let ativo = true

    async function carregarHistorico() {
      const { data, error } = await supabase
        .from('rolls')
        .select('*')
        .eq('room_id', sala.roomId)
        .order('criado_em', { ascending: false })
        .limit(30)

      if (ativo && !error && data) {
        setHistorico(data.map(linhaParaHistorico))
      }
    }

    carregarHistorico()

    const canal = supabase.channel(`room:${sala.roomId}`, {
      config: { presence: { key: presenceKeyRef.current } },
    })

    canal
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'rolls', filter: `room_id=eq.${sala.roomId}` },
        (payload) => {
          setHistorico((atual) => {
            if (atual.some((item) => item.id === payload.new.id)) return atual
            return [linhaParaHistorico(payload.new), ...atual]
          })
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'rolls', filter: `room_id=eq.${sala.roomId}` },
        (payload) => {
          setHistorico((atual) => atual.filter((item) => item.id !== payload.old.id))
        },
      )
      .on('broadcast', { event: 'rolando' }, ({ payload }) => {
        if (payload.presenceKey === presenceKeyRef.current) return
        diceRefsRef.current.get(payload.presenceKey)?.iniciarGiro()
      })
      .on('broadcast', { event: 'resultado' }, ({ payload }) => {
        if (payload.presenceKey === presenceKeyRef.current) return
        diceRefsRef.current.get(payload.presenceKey)?.finalizarGiro(payload.hope, payload.fear)
      })
      .on('presence', { event: 'sync' }, () => {
        const estado = canal.presenceState()
        const lista = Object.entries(estado).flatMap(([presenceKey, metas]) =>
          metas.map((meta) => ({ presenceKey, ...meta })),
        )
        setJogadoresOnline(lista)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await canal.track({
            nome: jogador.nome,
            cor: jogador.cor,
            corHope: jogador.corHope,
            corFear: jogador.corFear,
            corTextoHope: jogador.corTextoHope,
            corTextoFear: jogador.corTextoFear,
          })
        }
      })

    canalRef.current = canal

    return () => {
      ativo = false
      canalRef.current = null
      supabase.removeChannel(canal)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sala.roomId])

  useEffect(() => {
    canalRef.current?.track({
      nome: jogador.nome,
      cor: jogador.cor,
      corHope: jogador.corHope,
      corFear: jogador.corFear,
      corTextoHope: jogador.corTextoHope,
      corTextoFear: jogador.corTextoFear,
    })
  }, [jogador.nome, jogador.cor, jogador.corHope, jogador.corFear, jogador.corTextoHope, jogador.corTextoFear])

  function registrarRefDados(presenceKey, node) {
    if (node) diceRefsRef.current.set(presenceKey, node)
    else diceRefsRef.current.delete(presenceKey)
  }

  async function resetarHistorico() {
    const confirmado = window.confirm('Apagar todo o histórico desta sala para todos os jogadores?')
    if (!confirmado) return
    const { error } = await supabase.from('rolls').delete().eq('room_id', sala.roomId)
    if (error) {
      console.error('Erro ao resetar histórico:', error)
      return
    }
    setHistorico([])
  }

  async function registrarRolagem(resultado) {
    const { error } = await supabase.from('rolls').insert({
      room_id: sala.roomId,
      jogador: jogador.nome,
      cor: jogador.cor,
      cor_hope: jogador.corHope,
      cor_fear: jogador.corFear,
      dado_hope: resultado.hope,
      dado_fear: resultado.fear,
      resultado: textoResultado(resultado),
      vencedor: resultado.vencedor,
      total: resultado.hope + resultado.fear,
    })
    if (error) console.error('Erro ao registrar rolagem:', error)
  }

  async function rolar() {
    const minhaChave = presenceKeyRef.current
    const meuConjunto = diceRefsRef.current.get(minhaChave)
    if (rolando || !meuConjunto) return

    setRolando(true)
    setUltimoResultado(null)

    canalRef.current?.send({ type: 'broadcast', event: 'rolando', payload: { presenceKey: minhaChave } })

    const { hope, fear } = await meuConjunto.rolarPropria()
    const resultado = calcularResultado(hope, fear)
    setUltimoResultado(resultado)
    setRolando(false)

    canalRef.current?.send({
      type: 'broadcast',
      event: 'resultado',
      payload: { presenceKey: minhaChave, hope, fear },
    })

    registrarRolagem(resultado)
  }

  return (
    <section className="room">
      <header className="room-header">
        <div className="sala-titulo">
          <input
            className="input-nome-sala"
            value={sala.nome}
            onChange={(e) => onAtualizarSala({ nome: e.target.value })}
            placeholder="Nome da mesa"
            maxLength={40}
          />
          <p className="sala-subtitulo">
            <strong>{sala.codigo}</strong>
          </p>
        </div>
        <button
          type="button"
          className="secundario botao-config"
          onClick={() => setPainelAberto((v) => !v)}
          aria-label="Configurar cores"
        >
          ⚙
        </button>
      </header>

      {painelAberto && (
        <ColorSettingsPanel
          jogador={jogador}
          onAtualizarJogador={onAtualizarJogador}
          onFechar={() => setPainelAberto(false)}
        />
      )}

      <div className="mesa-dados">
        {jogadoresOnline.map((jg) => (
          <PlayerDiceSet
            key={jg.presenceKey}
            ref={(node) => registrarRefDados(jg.presenceKey, node)}
            nome={jg.nome}
            cor={jg.cor}
            corHope={jg.corHope}
            corFear={jg.corFear}
            corTextoHope={jg.corTextoHope}
            corTextoFear={jg.corTextoFear}
            destaque={jg.presenceKey === presenceKeyRef.current}
          />
        ))}
      </div>

      <button type="button" className="botao-rolar" onClick={rolar} disabled={rolando}>
        {rolando ? 'Rolando...' : 'Rolar'}
      </button>

      {ultimoResultado && (
        <p className="resultado" style={{ color: corResultado(ultimoResultado.vencedor, jogador) }}>
          {textoResultado(ultimoResultado)}
        </p>
      )}

      <div className="historico">
        <div className="historico-cabecalho">
          <h2>Histórico</h2>
          <button type="button" className="secundario" onClick={resetarHistorico}>
            Resetar
          </button>
        </div>
        <ul>
          {historico.map((item) => (
            <li key={item.id} className="historico-item">
              <span className="historico-horario">{item.horario}</span>
              <span className="historico-jogador" style={{ color: item.cor }}>
                {item.jogador}
              </span>
              <span className="historico-dados">
                {item.hope} / {item.fear}
              </span>
              <span className="historico-resultado" style={{ color: corResultado(item.vencedor, item) }}>
                {textoResultado(item)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default Room
