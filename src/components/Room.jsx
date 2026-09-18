import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  calcularResultado,
  calcularResultadoD20,
  calcularTotal,
  ehVencedorD20,
  rolarDados,
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
import { MARCADORES_PADRAO, marcadoresDoPresence } from '../utils/marcadoresJogador'
import { carregarMarcadoresDoJogador, salvarMarcadoresDoJogador } from '../utils/marcadoresJogadorDb'
import ColorSettingsPanel from './ColorSettingsPanel'
import ModalStatus from './ModalStatus'
import PlayerDiceSet from './PlayerDiceSet'

const COR_CRITICO = '#aa3bff'
const FUSO_BRASIL = 'America/Sao_Paulo'
const DURACAO_RESULTADO_MS = 5000
// Filtro de histórico por data já implementado, só escondido do front por
// enquanto — trocar pra true reativa a UI sem precisar reescrever nada.
const MOSTRAR_FILTRO_DATA = false

// "cores" aqui sempre chega já resolvida (corHope/corFear = principal/
// secundária da mecânica em uso), então não precisa saber d20 vs dualidade.
function corResultado(vencedor, cores) {
  if (vencedor === 'hope' || vencedor === 'd20') return cores.corHope
  if (vencedor === 'fear') return cores.corFear
  return COR_CRITICO
}

function dataDoRegistro(isoString) {
  // O Postgres grava "timestamp" sem timezone usando o horário UTC da sessão,
  // então a string vem sem "Z" — sem isso o navegador a interpretaria como
  // hora local, dobrando o erro de fuso.
  return new Date(isoString.endsWith('Z') ? isoString : `${isoString}Z`)
}

function formatarHorario(data) {
  const dataFormatada = data.toLocaleDateString('pt-BR', { timeZone: FUSO_BRASIL })
  const horaFormatada = data.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: FUSO_BRASIL,
  })
  return `${dataFormatada} ${horaFormatada}`
}

// yyyy-mm-dd no fuso de São Paulo — formato comparável direto com o valor
// de um <input type="date">, pra filtrar o histórico por dia.
function dataISOBrasil(data) {
  return data.toLocaleDateString('sv-SE', { timeZone: FUSO_BRASIL })
}

function linhaParaHistorico(linha) {
  const data = dataDoRegistro(linha.criado_em)
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
    horario: formatarHorario(data),
    dataISO: dataISOBrasil(data),
    modificador: linha.modificador_tipo
      ? { tipo: linha.modificador_tipo, valor: linha.modificador_valor }
      : null,
  }
}

function Room({ sala, jogador, onAtualizarJogador }) {
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

  // Assim que qualquer jogador começa a rolar, some com as mensagens de
  // resultado de todo mundo — evita ficar lendo um resultado antigo
  // enquanto uma rolagem nova já está em andamento.
  function limparResultados() {
    setResultadosPorJogador({})
    timersResultadoRef.current.forEach((timer) => clearTimeout(timer))
    timersResultadoRef.current.clear()
  }

  const [historico, setHistorico] = useState([])
  const [filtroData, setFiltroData] = useState('')
  const [painelAberto, setPainelAberto] = useState(false)
  const [statusAberto, setStatusAberto] = useState(false)
  const [jogadoresOnline, setJogadoresOnline] = useState([])
  const [modoRolagem, setModoRolagem] = useState('normal') // 'normal' | 'vantagem' | 'desvantagem'
  // Só quem tem a tag de DM pode alternar isso — pra todo mundo, fica fixo
  // no padrão (dualidade). O valor escolhido vai no presence pra quem mais
  // estiver na sala ver o dado certo do DM.
  const [mecanicaSelecionada, setMecanicaSelecionada] = useState(() => mecanicaDoJogador(jogador.nome))
  const [conectado, setConectado] = useState(true)
  // Marcadores de personagem (PV, Esperança, Estresse, etc.) — carregados do
  // banco por nome, editáveis livremente e sincronizados via presence, igual
  // ao resto do perfil do jogador.
  const [marcadores, setMarcadores] = useState(MARCADORES_PADRAO)
  // Só começa a salvar depois que o carregamento inicial terminar — senão o
  // efeito de salvar dispara com os valores padrão antes do fetch resolver
  // e sobrescreve o que já estava salvo no banco.
  const marcadoresCarregadosRef = useRef(false)

  useEffect(() => {
    let ativo = true
    marcadoresCarregadosRef.current = false
    carregarMarcadoresDoJogador(jogador.nome).then((valores) => {
      if (!ativo) return
      setMarcadores(valores)
      marcadoresCarregadosRef.current = true
    })
    return () => {
      ativo = false
    }
  }, [jogador.nome])

  useEffect(() => {
    if (!marcadoresCarregadosRef.current) return
    const id = setTimeout(() => salvarMarcadoresDoJogador(jogador.nome, marcadores), 400)
    return () => clearTimeout(id)
  }, [jogador.nome, marcadores])

  // Edição de verdade só acontece no modal (com botão de Salvar) — aqui só
  // trocamos o objeto inteiro de uma vez.
  function salvarMarcadoresCompletos(novosValores) {
    setMarcadores(novosValores)
  }

  // Botões de +/- (Esperança/Estresse/Fadiga) na caixa de dados — ação
  // rápida e direta, mas com cooldown de 5s por marcador (compartilhado
  // entre somar e subtrair) pra não afogar o servidor se várias pessoas
  // ficarem clicando junto.
  const COOLDOWN_AJUSTE_MS = 5000
  const [cooldownsAjuste, setCooldownsAjuste] = useState({})

  function podeAjustarMarcador(campo) {
    return (cooldownsAjuste[campo] ?? 0) <= Date.now()
  }

  function ajustarMarcador(campo, delta) {
    if (!podeAjustarMarcador(campo)) return
    setMarcadores((atual) => ({ ...atual, [campo]: Math.max(0, atual[campo] + delta) }))
    setCooldownsAjuste((atual) => ({ ...atual, [campo]: Date.now() + COOLDOWN_AJUSTE_MS }))
    setTimeout(() => {
      setCooldownsAjuste((atual) => ({ ...atual, [campo]: 0 }))
    }, COOLDOWN_AJUSTE_MS)
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
        limparResultados()
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
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setConectado(true)
          await canal.track({
            nome: jogador.nome,
            cor: jogador.cor,
            mecanica: mecanicaSelecionada,
            ...marcadores,
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
        ...marcadores,
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
    marcadores,
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
    limparResultados()

    canalRef.current?.send({
      type: 'broadcast',
      event: 'rolando',
      payload: { presenceKey: minhaChave, modo: modoRolagem },
    })

    const mecanica = mecanicaSelecionada

    let resultadoBruto
    if (mecanica === MECANICA_D20) {
      resultadoBruto = await meuConjunto.rolarPropria(modoRolagem)
    } else if (jogador.nome === 'Samuel') {
      // Vantagem do Samuel: decide ANTES de girar se o resultado (que seria
      // "com Medo") vira "com Esperança" — 20% de chance, trocando qual
      // dado mostra qual número (o total/soma não muda). Os dados já giram
      // direto pro valor final: nunca revelam o valor "de verdade" primeiro
      // pra depois trocar, senão fica visível o "pulo" do número.
      const { hope: hopeSorteado, fear: fearSorteado } = rolarDados()
      const trocar = fearSorteado > hopeSorteado && Math.random() < 0.2
      const hopeAlvo = trocar ? fearSorteado : hopeSorteado
      const fearAlvo = trocar ? hopeSorteado : fearSorteado
      resultadoBruto = await meuConjunto.rolarPropriaParaValores(hopeAlvo, fearAlvo, modoRolagem)
    } else {
      resultadoBruto = await meuConjunto.rolarPropria(modoRolagem)
    }

    const { modificador } = resultadoBruto
    const { hope, fear } = resultadoBruto
    const resultado = mecanica === MECANICA_D20 ? calcularResultadoD20(hope, fear) : calcularResultado(hope, fear)

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
  const historicoFiltrado = filtroData ? historico.filter((item) => item.dataISO === filtroData) : historico

  return (
    <section className="room">
      <header className="room-header">
        <div className="sala-titulo">
          <h1 className="nome-mesa">Age of Umbra</h1>
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
          aria-label="Configurações"
        >
          ⚙
        </button>
        <button
          type="button"
          className="secundario botao-config"
          onClick={() => setStatusAberto((v) => !v)}
          aria-label="Status da mesa"
          title="Ver status de todo mundo"
        >
          ☰
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

      {painelAberto && (
        <ColorSettingsPanel
          jogador={jogador}
          mecanica={minhaMecanica}
          marcadores={marcadores}
          onAtualizarJogador={onAtualizarJogador}
          onSalvarMarcadores={salvarMarcadoresCompletos}
          onFechar={() => setPainelAberto(false)}
        />
      )}

      <div className="mesa-dados">
        {jogadoresOnline.map((jg) => {
          const mecanicaJg = jg.mecanica ?? mecanicaDoJogador(jg.nome)
          const principal = estiloPrincipal(jg, mecanicaJg)
          const secundaria = estiloSecundario(jg, mecanicaJg)
          const resultadoJg = resultadosPorJogador[jg.presenceKey]
          const souEu = jg.presenceKey === presenceKeyRef.current
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
              destaque={souEu}
              resultadoTexto={resultadoJg ? textoResultado(resultadoJg) : null}
              resultadoCor={
                resultadoJg
                  ? corResultado(resultadoJg.vencedor, { corHope: principal.cor, corFear: secundaria.cor })
                  : null
              }
              marcadores={souEu ? marcadores : marcadoresDoPresence(jg)}
              editavelMarcadores={souEu}
              podeAjustarMarcador={podeAjustarMarcador}
              onAjustarMarcador={ajustarMarcador}
            />
          )
        })}
      </div>

      {statusAberto && (
        <ModalStatus
          jogadores={jogadoresOnline}
          meuPresenceKey={presenceKeyRef.current}
          obterMarcadores={(jg) => (jg.presenceKey === presenceKeyRef.current ? marcadores : marcadoresDoPresence(jg))}
          onFechar={() => setStatusAberto(false)}
        />
      )}

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

        {MOSTRAR_FILTRO_DATA && (
          <div className="historico-filtros">
            <label className="historico-filtro-data">
              Filtrar por data
              <input type="date" value={filtroData} onChange={(e) => setFiltroData(e.target.value)} />
            </label>
            {filtroData && (
              <button type="button" className="secundario" onClick={() => setFiltroData('')}>
                Limpar filtro
              </button>
            )}
          </div>
        )}

        <ul>
          {filtroData && historicoFiltrado.length === 0 && (
            <li className="historico-vazio">Nenhuma rolagem nesse dia.</li>
          )}
          {historicoFiltrado.map((item) => (
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
