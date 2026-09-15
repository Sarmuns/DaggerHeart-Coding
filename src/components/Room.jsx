import { DiceRoller } from '@gnuton/css-dice-roller'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { calcularResultado, textoResultado } from '../utils/dice'
import ColorSettingsPanel from './ColorSettingsPanel'

const STAGGER_FEAR_MS = 60
const VELOCIDADE_ROLAGEM_S = 2
const ESCALA_DADO = 92
const COR_CRITICO = '#aa3bff'

function corResultado(vencedor, cores) {
  if (vencedor === 'hope') return cores.corHope
  if (vencedor === 'fear') return cores.corFear
  return COR_CRITICO
}

function prefereMenosMovimento() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function linhaParaHistorico(linha) {
  const { vencedor } = calcularResultado(linha.dado_hope, linha.dado_fear)
  return {
    id: linha.id,
    jogador: linha.jogador,
    cor: linha.cor,
    corHope: linha.cor_hope,
    corFear: linha.cor_fear,
    hope: linha.dado_hope,
    fear: linha.dado_fear,
    vencedor,
  }
}

function Room({ sala, onAtualizarSala, jogador, onAtualizarJogador }) {
  const palcoHopeRef = useRef(null)
  const palcoFearRef = useRef(null)
  const rollerHopeRef = useRef(null)
  const rollerFearRef = useRef(null)
  const dieHopeRef = useRef(null)
  const dieFearRef = useRef(null)
  const canalRef = useRef(null)
  const presenceKeyRef = useRef(crypto.randomUUID())
  const [girandoHope, setGirandoHope] = useState(false)
  const [girandoFear, setGirandoFear] = useState(false)
  const [rolando, setRolando] = useState(false)
  const [ultimoResultado, setUltimoResultado] = useState(null)
  const [historico, setHistorico] = useState([])
  const [painelAberto, setPainelAberto] = useState(false)
  const [jogadoresOnline, setJogadoresOnline] = useState([])

  useEffect(() => {
    const rollerHope = new DiceRoller(palcoHopeRef.current, ESCALA_DADO)
    const [dieHope] = rollerHope.addDie('d12')
    rollerHope.updateSettings({ baseColor: jogador.corHope, speed: VELOCIDADE_ROLAGEM_S })
    rollerHopeRef.current = rollerHope
    dieHopeRef.current = dieHope

    const rollerFear = new DiceRoller(palcoFearRef.current, ESCALA_DADO)
    const [dieFear] = rollerFear.addDie('d12')
    rollerFear.updateSettings({ baseColor: jogador.corFear, speed: VELOCIDADE_ROLAGEM_S })
    rollerFearRef.current = rollerFear
    dieFearRef.current = dieFear

    return () => {
      rollerHope.clear()
      rollerFear.clear()
      rollerHopeRef.current = null
      rollerFearRef.current = null
      dieHopeRef.current = null
      dieFearRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    rollerHopeRef.current?.updateSettings({ baseColor: jogador.corHope })
  }, [jogador.corHope])

  useEffect(() => {
    rollerFearRef.current?.updateSettings({ baseColor: jogador.corFear })
  }, [jogador.corFear])

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
      .on('presence', { event: 'sync' }, () => {
        const estado = canal.presenceState()
        setJogadoresOnline(Object.values(estado).flat())
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await canal.track({ nome: jogador.nome, cor: jogador.cor })
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
    canalRef.current?.track({ nome: jogador.nome, cor: jogador.cor })
  }, [jogador.nome, jogador.cor])

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
    })
    if (error) console.error('Erro ao registrar rolagem:', error)
  }

  function finalizarRolagem(hope, fear) {
    const resultado = calcularResultado(hope, fear)
    setUltimoResultado(resultado)
    setRolando(false)
    registrarRolagem(resultado)
  }

  async function rolar() {
    if (rolando || !dieHopeRef.current || !dieFearRef.current) return
    setRolando(true)
    setUltimoResultado(null)

    const reduzido = prefereMenosMovimento()
    rollerHopeRef.current.updateSettings({ animation: reduzido ? 'none' : 'float' })
    rollerFearRef.current.updateSettings({ animation: reduzido ? 'none' : 'float' })

    if (reduzido) {
      const hope = await dieHopeRef.current.roll()
      const fear = await dieFearRef.current.roll()
      finalizarRolagem(hope, fear)
      return
    }

    setGirandoHope(true)
    setGirandoFear(true)

    const hopePromise = dieHopeRef.current.roll().then((hope) => {
      setGirandoHope(false)
      return hope
    })

    await new Promise((resolver) => setTimeout(resolver, STAGGER_FEAR_MS))

    const fearPromise = dieFearRef.current.roll().then((fear) => {
      setGirandoFear(false)
      return fear
    })

    const [hope, fear] = await Promise.all([hopePromise, fearPromise])
    finalizarRolagem(hope, fear)
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
        <div className="jogadores-online">
          {jogadoresOnline.map((j) => (
            <span
              key={`${j.nome}-${j.cor}`}
              className="jogador-tag"
              style={{ borderColor: j.cor, color: j.cor }}
            >
              {j.nome}
            </span>
          ))}
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

      <div className="dados">
        <div className="dado-estagio">
          <span className="dado-label" style={{ color: jogador.corHope }}>
            Esperança
          </span>
          <div
            ref={palcoHopeRef}
            className={`dado-palco${girandoHope ? ' dado-palco--rolando' : ''}`}
          />
        </div>
        <div className="dado-estagio">
          <span className="dado-label" style={{ color: jogador.corFear }}>
            Medo
          </span>
          <div
            ref={palcoFearRef}
            className={`dado-palco${girandoFear ? ' dado-palco--rolando' : ''}`}
          />
        </div>
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
