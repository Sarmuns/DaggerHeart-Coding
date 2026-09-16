import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  calcularResultado,
  calcularResultadoD20,
  calcularTotal,
  ehVencedorD20,
  melhorPar,
  textoResultado,
} from '../utils/dice'
import {
  MECANICA_D20,
  MECANICA_DUALIDADE,
  ehDM,
  estiloPrincipal,
  estiloSecundario,
  mecanicaDoJogador,
} from '../utils/mecanicaJogador'
import ColorSettingsPanel from './ColorSettingsPanel'
import PlayerDiceSet from './PlayerDiceSet'

const COR_CRITICO = '#aa3bff'
const FUSO_BRASIL = 'America/Sao_Paulo'
const DURACAO_RESULTADO_MS = 5000

// "cores" aqui sempre chega já resolvida (corHope/corFear = principal/
// secundária da mecânica em uso), então não precisa saber d20 vs dualidade.
function corResultado(vencedor, cores) {
  if (vencedor === 'hope' || vencedor === 'd20') return cores.corHope
  if (vencedor === 'fear') return cores.corFear
  return COR_CRITICO
}

function formatarHorario(isoString) {
  // O Postgres grava "timestamp" sem timezone usando o horário UTC da sessão,
  // então a string vem sem "Z" — sem isso o navegador a interpretaria como
  // hora local, dobrando o erro de fuso.
  const data = new Date(isoString.endsWith('Z') ? isoString : `${isoString}Z`)
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
    modificador: linha.modificador_tipo
      ? { tipo: linha.modificador_tipo, valor: linha.modificador_valor }
      : null,
  }
}

function Room({ sala, onAtualizarSala, jogador, onAtualizarJogador }) {
  const canalRef = useRef(null)
  const presenceKeyRef = useRef(crypto.randomUUID())
  const diceRefsRef = useRef(new Map())
  const [rolando, setRolando] = useState(false)
  const [ultimoResultado, setUltimoResultado] = useState(null)
  // Último resultado de cada jogador (por presenceKey), pra mostrar "4 com
  // Esperança" etc. na caixa de dados de todo mundo, não só de quem rolou.
  // Some sozinho depois de alguns segundos — o histórico é que guarda o
  // registro permanente.
  const [resultadosPorJogador, setResultadosPorJogador] = useState({})
  const timersResultadoRef = useRef(new Map())

  function definirResultadoDoJogador(presenceKey, resultado) {
    setResultadosPorJogador((atual) => ({ ...atual, [presenceKey]: resultado }))

    const timerAnterior = timersResultadoRef.current.get(presenceKey)
    if (timerAnterior) clearTimeout(timerAnterior)

    const timer = setTimeout(() => {
      setResultadosPorJogador((atual) => {
        const { [presenceKey]: _descartado, ...resto } = atual
        return resto
      })
      timersResultadoRef.current.delete(presenceKey)
    }, DURACAO_RESULTADO_MS)
    timersResultadoRef.current.set(presenceKey, timer)
  }

  useEffect(() => {
    const timers = timersResultadoRef.current
    return () => timers.forEach((timer) => clearTimeout(timer))
  }, [])
  const [historico, setHistorico] = useState([])
  const [painelAberto, setPainelAberto] = useState(false)
  const [jogadoresOnline, setJogadoresOnline] = useState([])
  const [modoRolagem, setModoRolagem] = useState('normal') // 'normal' | 'vantagem' | 'desvantagem'
  // Só quem tem a tag de DM pode alternar isso — pra todo mundo, fica fixo
  // no padrão (dualidade). O valor escolhido vai no presence pra quem mais
  // estiver na sala ver o dado certo do DM.
  const [mecanicaSelecionada, setMecanicaSelecionada] = useState(() => mecanicaDoJogador(jogador.nome))
  const [conectado, setConectado] = useState(true)
  const [avisos, setAvisos] = useState([])

  function adicionarAviso(texto) {
    const id = crypto.randomUUID()
    setAvisos((atual) => [...atual, { id, texto }])
    setTimeout(() => {
      setAvisos((atual) => atual.filter((a) => a.id !== id))
    }, 5000)
  }

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
        diceRefsRef.current.get(payload.presenceKey)?.iniciarGiro(payload.modo)
      })
      .on('broadcast', { event: 'resultado' }, ({ payload }) => {
        definirResultadoDoJogador(payload.presenceKey, {
          vencedor: payload.vencedor,
          hope: payload.hope,
          fear: payload.fear,
          modificador: payload.modificador,
        })
        if (payload.presenceKey === presenceKeyRef.current) return
        diceRefsRef.current
          .get(payload.presenceKey)
          ?.finalizarGiro(payload.hope, payload.fear, payload.modificador)
      })
      .on('presence', { event: 'sync' }, () => {
        const estado = canal.presenceState()
        // Cada track() gera uma nova "meta" para a mesma chave; enquanto o
        // servidor não confirma a saída da anterior, presenceState() pode
        // listar as duas simultaneamente. Ficamos só com a mais recente
        // pra não duplicar o jogador na tela.
        const lista = Object.entries(estado).map(([presenceKey, metas]) => ({
          presenceKey,
          ...metas[metas.length - 1],
        }))
        setJogadoresOnline(lista)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (key === presenceKeyRef.current) return
        const nome = newPresences[newPresences.length - 1]?.nome
        if (nome) adicionarAviso(`${nome} entrou na sala`)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        if (key === presenceKeyRef.current) return
        const nome = leftPresences[leftPresences.length - 1]?.nome
        if (nome) adicionarAviso(`${nome} saiu da sala`)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setConectado(true)
          await canal.track({
            nome: jogador.nome,
            cor: jogador.cor,
            mecanica: mecanicaSelecionada,
            corHope: jogador.corHope,
            corFear: jogador.corFear,
            corTextoHope: jogador.corTextoHope,
            corTextoFear: jogador.corTextoFear,
            corBordaHope: jogador.corBordaHope,
            corBordaFear: jogador.corBordaFear,
            temaHope: jogador.temaHope,
            temaFear: jogador.temaFear,
            corD20: jogador.corD20,
            corBordaD20: jogador.corBordaD20,
            corTextoD20: jogador.corTextoD20,
            temaD20: jogador.temaD20,
            corD20Extra: jogador.corD20Extra,
            corBordaD20Extra: jogador.corBordaD20Extra,
            corTextoD20Extra: jogador.corTextoD20Extra,
            temaD20Extra: jogador.temaD20Extra,
          })
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.warn('Conexão da sala perdida:', status)
          setConectado(false)
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
    const id = setTimeout(() => {
      canalRef.current?.track({
        nome: jogador.nome,
        cor: jogador.cor,
        mecanica: mecanicaSelecionada,
        corHope: jogador.corHope,
        corFear: jogador.corFear,
        corTextoHope: jogador.corTextoHope,
        corTextoFear: jogador.corTextoFear,
        corBordaHope: jogador.corBordaHope,
        corBordaFear: jogador.corBordaFear,
        temaHope: jogador.temaHope,
        temaFear: jogador.temaFear,
        corD20: jogador.corD20,
        corBordaD20: jogador.corBordaD20,
        corTextoD20: jogador.corTextoD20,
        temaD20: jogador.temaD20,
        corD20Extra: jogador.corD20Extra,
        corBordaD20Extra: jogador.corBordaD20Extra,
        corTextoD20Extra: jogador.corTextoD20Extra,
        temaD20Extra: jogador.temaD20Extra,
      })
    }, 150)
    return () => clearTimeout(id)
  }, [
    jogador.nome,
    jogador.cor,
    mecanicaSelecionada,
    jogador.corHope,
    jogador.corFear,
    jogador.corTextoHope,
    jogador.corTextoFear,
    jogador.corBordaHope,
    jogador.corBordaFear,
    jogador.temaHope,
    jogador.temaFear,
    jogador.corD20,
    jogador.corBordaD20,
    jogador.corTextoD20,
    jogador.temaD20,
    jogador.corD20Extra,
    jogador.corBordaD20Extra,
    jogador.corTextoD20Extra,
    jogador.temaD20Extra,
  ])

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

  async function registrarRolagem(resultado, modificador, mecanica) {
    const total =
      mecanica === MECANICA_D20 ? resultado.hope : calcularTotal(resultado.hope, resultado.fear, modificador)
    // A tabela só tem cor_hope/cor_fear — guardamos aí a cor do slot
    // principal/secundário resolvida pra mecânica em uso (dualidade ou d20),
    // pra o histórico continuar colorindo certo independente do jogador.
    const principal = estiloPrincipal(jogador, mecanica)
    const secundaria = estiloSecundario(jogador, mecanica)
    const { error } = await supabase.from('rolls').insert({
      room_id: sala.roomId,
      jogador: jogador.nome,
      cor: jogador.cor,
      cor_hope: principal.cor,
      cor_fear: secundaria.cor,
      dado_hope: resultado.hope,
      dado_fear: resultado.fear,
      resultado: textoResultado(resultado),
      vencedor: resultado.vencedor,
      total,
      modificador_tipo: modificador?.tipo ?? null,
      modificador_valor: modificador?.valor ?? null,
    })
    if (error) console.error('Erro ao registrar rolagem:', error)
  }

  async function rolar() {
    const minhaChave = presenceKeyRef.current
    const meuConjunto = diceRefsRef.current.get(minhaChave)
    if (rolando || !meuConjunto) return

    setRolando(true)
    setUltimoResultado(null)

    canalRef.current?.send({
      type: 'broadcast',
      event: 'rolando',
      payload: { presenceKey: minhaChave, modo: modoRolagem },
    })

    const mecanica = mecanicaSelecionada
    const resultadoBruto = await meuConjunto.rolarPropria(modoRolagem)
    const { modificador } = resultadoBruto
    let { hope, fear } = resultadoBruto

    let resultado
    if (mecanica === MECANICA_D20) {
      resultado = calcularResultadoD20(hope, fear)
    } else {
      if (jogador.nome === 'Samuel') {
        // "Vantagem dupla": rola um segundo par oculto (sem animação) e fica
        // com o melhor par completo — nunca mistura hope de um par com fear
        // do outro, senão a vantagem fica em ambos os dados ao mesmo tempo.
        const parOculto = {
          hope: Math.floor(Math.random() * 12) + 1,
          fear: Math.floor(Math.random() * 12) + 1,
        }
        const melhor = melhorPar({ hope, fear }, parOculto)
        if (melhor.hope !== hope || melhor.fear !== fear) {
          meuConjunto.definirHope(melhor.hope)
          meuConjunto.definirFear(melhor.fear)
          hope = melhor.hope
          fear = melhor.fear
        }
      }
      resultado = calcularResultado(hope, fear)
    }

    setUltimoResultado({ ...resultado, modificador })
    definirResultadoDoJogador(minhaChave, {
      vencedor: resultado.vencedor,
      hope: resultado.hope,
      fear: resultado.fear,
      modificador,
    })
    setRolando(false)

    canalRef.current?.send({
      type: 'broadcast',
      event: 'resultado',
      payload: {
        presenceKey: minhaChave,
        vencedor: resultado.vencedor,
        hope: resultado.hope,
        fear: resultado.fear,
        modificador,
      },
    })

    registrarRolagem(resultado, modificador, mecanica)
  }

  const minhaMecanica = mecanicaSelecionada

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
          onClick={() => window.location.reload()}
          aria-label="Atualizar sala"
          title="Recarregar sala"
        >
          ⟳
        </button>
        <button
          type="button"
          className="secundario botao-config"
          onClick={() => setPainelAberto((v) => !v)}
          aria-label="Configurar cores"
        >
          ⚙
        </button>
      </header>

      {!conectado && (
        <div className="aviso aviso--erro">
          Conexão com a sala perdida.{' '}
          <button type="button" onClick={() => window.location.reload()}>
            Atualizar
          </button>
        </div>
      )}

      {avisos.length > 0 && (
        <div className="avisos">
          {avisos.map((a) => (
            <div key={a.id} className="aviso">
              {a.texto}
            </div>
          ))}
        </div>
      )}

      {painelAberto && (
        <ColorSettingsPanel
          jogador={jogador}
          mecanica={minhaMecanica}
          onAtualizarJogador={onAtualizarJogador}
          onFechar={() => setPainelAberto(false)}
          coresOcupadas={jogadoresOnline
            .filter((jg) => jg.presenceKey !== presenceKeyRef.current)
            .map((jg) => jg.cor)}
        />
      )}

      <div className="mesa-dados">
        {jogadoresOnline.map((jg) => {
          const mecanicaJg = jg.mecanica ?? mecanicaDoJogador(jg.nome)
          const principal = estiloPrincipal(jg, mecanicaJg)
          const secundaria = estiloSecundario(jg, mecanicaJg)
          const resultadoJg = resultadosPorJogador[jg.presenceKey]
          return (
            <PlayerDiceSet
              key={jg.presenceKey}
              ref={(node) => registrarRefDados(jg.presenceKey, node)}
              nome={jg.nome}
              cor={jg.cor}
              corPrincipal={principal.cor}
              corBordaPrincipal={principal.borda}
              corTextoPrincipal={principal.texto}
              temaPrincipal={principal.tema}
              corSecundaria={secundaria.cor}
              corBordaSecundaria={secundaria.borda}
              corTextoSecundaria={secundaria.texto}
              temaSecundaria={secundaria.tema}
              mecanica={mecanicaJg}
              destaque={jg.presenceKey === presenceKeyRef.current}
              resultadoTexto={resultadoJg ? textoResultado(resultadoJg) : null}
              resultadoCor={
                resultadoJg
                  ? corResultado(resultadoJg.vencedor, { corHope: principal.cor, corFear: secundaria.cor })
                  : null
              }
            />
          )
        })}
      </div>

      {ehDM(jogador.nome) && (
        <div className="modo-rolagem">
          <button
            type="button"
            className={`pill${mecanicaSelecionada === MECANICA_D20 ? ' pill--ativa' : ''}`}
            onClick={() => setMecanicaSelecionada(MECANICA_D20)}
          >
            d20
          </button>
          <button
            type="button"
            className={`pill${mecanicaSelecionada === MECANICA_DUALIDADE ? ' pill--ativa' : ''}`}
            onClick={() => setMecanicaSelecionada(MECANICA_DUALIDADE)}
          >
            2d12
          </button>
        </div>
      )}

      <div className="modo-rolagem">
        <button
          type="button"
          className={`pill${modoRolagem === 'normal' ? ' pill--ativa' : ''}`}
          onClick={() => setModoRolagem('normal')}
        >
          Normal
        </button>
        <button
          type="button"
          className={`pill${modoRolagem === 'vantagem' ? ' pill--ativa' : ''}`}
          onClick={() => setModoRolagem('vantagem')}
        >
          Vantagem
        </button>
        <button
          type="button"
          className={`pill${modoRolagem === 'desvantagem' ? ' pill--ativa' : ''}`}
          onClick={() => setModoRolagem('desvantagem')}
        >
          Desvantagem
        </button>
      </div>

      <button type="button" className="botao-rolar" onClick={rolar} disabled={rolando}>
        {rolando ? 'Rolando...' : 'Rolar'}
      </button>

      {ultimoResultado && (
        <p
          className={`resultado${ehVencedorD20(ultimoResultado.vencedor) ? ' resultado--d20' : ''}`}
          style={{
            color: corResultado(ultimoResultado.vencedor, {
              corHope: estiloPrincipal(jogador, minhaMecanica).cor,
              corFear: estiloSecundario(jogador, minhaMecanica).cor,
            }),
          }}
        >
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
                {item.modificador && (
                  <span className="historico-modificador">
                    {item.modificador.valor != null
                      ? `${item.modificador.tipo === 'vantagem' ? '+' : '−'}d6(${item.modificador.valor})`
                      : item.modificador.tipo === 'vantagem'
                        ? 'Vantagem'
                        : 'Desvantagem'}
                  </span>
                )}
              </span>
              <span
                className={`historico-resultado${ehVencedorD20(item.vencedor) ? ' historico-resultado--d20' : ''}`}
                style={{ color: corResultado(item.vencedor, item) }}
              >
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
