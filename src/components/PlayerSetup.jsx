import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { CORES, primeiraCorLivre } from '../utils/cores'
import {
  ESTILO_PADRAO_D20,
  ESTILO_PADRAO_D20_EXTRA,
  ESTILO_PADRAO_FEAR,
  ESTILO_PADRAO_HOPE,
} from '../utils/estiloPadraoDados'
import { MECANICA_D20, mecanicaDoJogador } from '../utils/mecanicaJogador'
import { carregarPreferenciasJogador, salvarPreferenciasJogador } from '../utils/preferenciasJogador'
import { carregarEstiloDoJogador, salvarEstiloDoJogador } from '../utils/preferenciasJogadorDb'
import ColorSwatchPicker from './ColorSwatchPicker'
import DiceColorModal from './DiceColorModal'
import NomePicklist from './NomePicklist'

const COR_PADRAO = CORES[0].valor

function PlayerSetup({ codigoSala, roomId, onConfirmar }) {
  const nomeLembrado = carregarPreferenciasJogador()?.nome ?? ''
  const canalRef = useRef(null)

  const [nome, setNome] = useState('')
  const [cor, setCor] = useState(COR_PADRAO)
  const [corHope, setCorHope] = useState(ESTILO_PADRAO_HOPE.corFundo)
  const [corFear, setCorFear] = useState(ESTILO_PADRAO_FEAR.corFundo)
  const [corTextoHope, setCorTextoHope] = useState(ESTILO_PADRAO_HOPE.corTexto)
  const [corTextoFear, setCorTextoFear] = useState(ESTILO_PADRAO_FEAR.corTexto)
  const [corBordaHope, setCorBordaHope] = useState(ESTILO_PADRAO_HOPE.corBorda)
  const [corBordaFear, setCorBordaFear] = useState(ESTILO_PADRAO_FEAR.corBorda)
  const [temaHope, setTemaHope] = useState(ESTILO_PADRAO_HOPE.tema)
  const [temaFear, setTemaFear] = useState(ESTILO_PADRAO_FEAR.tema)
  const [corD20, setCorD20] = useState(ESTILO_PADRAO_D20.corFundo)
  const [corTextoD20, setCorTextoD20] = useState(ESTILO_PADRAO_D20.corTexto)
  const [corBordaD20, setCorBordaD20] = useState(ESTILO_PADRAO_D20.corBorda)
  const [temaD20, setTemaD20] = useState(ESTILO_PADRAO_D20.tema)
  const [corD20Extra, setCorD20Extra] = useState(ESTILO_PADRAO_D20_EXTRA.corFundo)
  const [corTextoD20Extra, setCorTextoD20Extra] = useState(ESTILO_PADRAO_D20_EXTRA.corTexto)
  const [corBordaD20Extra, setCorBordaD20Extra] = useState(ESTILO_PADRAO_D20_EXTRA.corBorda)
  const [temaD20Extra, setTemaD20Extra] = useState(ESTILO_PADRAO_D20_EXTRA.tema)
  const [modalAberto, setModalAberto] = useState(null) // 'hope' | 'fear' | null
  const [nomesOcupados, setNomesOcupados] = useState([])
  const [coresOcupadas, setCoresOcupadas] = useState([])
  const [erro, setErro] = useState('')
  const [verificando, setVerificando] = useState(false)

  const ehD20 = mecanicaDoJogador(nome) === MECANICA_D20

  useEffect(() => {
    const canal = supabase.channel(`room:${roomId}`)
    canal
      .on('presence', { event: 'sync' }, () => {
        const estado = canal.presenceState()
        const metasAtuais = Object.values(estado).map((metas) => metas[metas.length - 1]).filter(Boolean)
        setNomesOcupados(metasAtuais.map((m) => m.nome).filter(Boolean))
        setCoresOcupadas(metasAtuais.map((m) => m.cor).filter(Boolean))
      })
      .subscribe()

    canalRef.current = canal

    return () => {
      canalRef.current = null
      supabase.removeChannel(canal)
    }
  }, [roomId])

  // Se a cor atual (padrão ou vinda do estilo salvo) já estiver em uso por
  // outro jogador na sala, troca sozinho pra primeira livre da paleta.
  useEffect(() => {
    if (coresOcupadas.includes(cor)) {
      setCor(primeiraCorLivre(coresOcupadas))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coresOcupadas])

  useEffect(() => {
    if (nomeLembrado) selecionarNome(nomeLembrado)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function aplicarEstiloPadrao() {
    setCor(primeiraCorLivre(coresOcupadas, COR_PADRAO))
    setCorHope(ESTILO_PADRAO_HOPE.corFundo)
    setCorFear(ESTILO_PADRAO_FEAR.corFundo)
    setCorTextoHope(ESTILO_PADRAO_HOPE.corTexto)
    setCorTextoFear(ESTILO_PADRAO_FEAR.corTexto)
    setCorBordaHope(ESTILO_PADRAO_HOPE.corBorda)
    setCorBordaFear(ESTILO_PADRAO_FEAR.corBorda)
    setTemaHope(ESTILO_PADRAO_HOPE.tema)
    setTemaFear(ESTILO_PADRAO_FEAR.tema)
    setCorD20(ESTILO_PADRAO_D20.corFundo)
    setCorTextoD20(ESTILO_PADRAO_D20.corTexto)
    setCorBordaD20(ESTILO_PADRAO_D20.corBorda)
    setTemaD20(ESTILO_PADRAO_D20.tema)
    setCorD20Extra(ESTILO_PADRAO_D20_EXTRA.corFundo)
    setCorTextoD20Extra(ESTILO_PADRAO_D20_EXTRA.corTexto)
    setCorBordaD20Extra(ESTILO_PADRAO_D20_EXTRA.corBorda)
    setTemaD20Extra(ESTILO_PADRAO_D20_EXTRA.tema)
  }

  async function selecionarNome(novoNome) {
    setNome(novoNome)
    setErro('')
    // O estilo é sempre o que está salvo no banco para esse nome (ou o
    // padrão, se ninguém salvou ainda) — nunca o que sobrou na tela de
    // um nome escolhido antes, pra não "vazar" cor de um jogador pro outro.
    const estiloSalvo = await carregarEstiloDoJogador(novoNome)
    if (estiloSalvo) {
      setCor(primeiraCorLivre(coresOcupadas, estiloSalvo.cor))
      setCorHope(estiloSalvo.corHope)
      setCorFear(estiloSalvo.corFear)
      setCorTextoHope(estiloSalvo.corTextoHope)
      setCorTextoFear(estiloSalvo.corTextoFear)
      setCorBordaHope(estiloSalvo.corBordaHope)
      setCorBordaFear(estiloSalvo.corBordaFear)
      setTemaHope(estiloSalvo.temaHope)
      setTemaFear(estiloSalvo.temaFear)
      setCorD20(estiloSalvo.corD20 ?? ESTILO_PADRAO_D20.corFundo)
      setCorTextoD20(estiloSalvo.corTextoD20 ?? ESTILO_PADRAO_D20.corTexto)
      setCorBordaD20(estiloSalvo.corBordaD20 ?? ESTILO_PADRAO_D20.corBorda)
      setTemaD20(estiloSalvo.temaD20 ?? ESTILO_PADRAO_D20.tema)
      setCorD20Extra(estiloSalvo.corD20Extra ?? ESTILO_PADRAO_D20_EXTRA.corFundo)
      setCorTextoD20Extra(estiloSalvo.corTextoD20Extra ?? ESTILO_PADRAO_D20_EXTRA.corTexto)
      setCorBordaD20Extra(estiloSalvo.corBordaD20Extra ?? ESTILO_PADRAO_D20_EXTRA.corBorda)
      setTemaD20Extra(estiloSalvo.temaD20Extra ?? ESTILO_PADRAO_D20_EXTRA.tema)
    } else {
      aplicarEstiloPadrao()
    }
  }

  async function confirmar(e) {
    e.preventDefault()
    if (!nome) {
      setErro('Escolha seu nome.')
      return
    }

    setVerificando(true)
    const estadoAtual = canalRef.current?.presenceState() ?? {}
    const aindaOcupado = Object.values(estadoAtual).some(
      (metas) => metas[metas.length - 1]?.nome === nome,
    )
    setVerificando(false)

    if (aindaOcupado) {
      setErro(`${nome} já está na sala. Escolha outro nome.`)
      return
    }

    const jogador = {
      nome,
      cor,
      corHope,
      corFear,
      corTextoHope,
      corTextoFear,
      corBordaHope,
      corBordaFear,
      temaHope,
      temaFear,
      corD20,
      corTextoD20,
      corBordaD20,
      temaD20,
      corD20Extra,
      corTextoD20Extra,
      corBordaD20Extra,
      temaD20Extra,
    }
    salvarPreferenciasJogador(jogador)
    salvarEstiloDoJogador(jogador)
    onConfirmar(jogador)
  }

  return (
    <section className="player-setup">
      <h1>Sala {codigoSala}</h1>
      <form onSubmit={confirmar}>
        <NomePicklist
          label="Seu nome"
          nomeSelecionado={nome}
          onSelecionar={selecionarNome}
          nomesOcupados={nomesOcupados}
        />

        <ColorSwatchPicker
          label="Sua cor"
          corSelecionada={cor}
          onSelecionar={setCor}
          coresOcupadas={coresOcupadas}
        />

        <div className="home-botoes">
          <button type="button" onClick={() => setModalAberto('hope')}>
            {ehD20 ? 'Dado d20' : 'Dado de Esperança'}
          </button>
          <button type="button" onClick={() => setModalAberto('fear')}>
            {ehD20 ? 'Dado d20 extra' : 'Dado de Medo'}
          </button>
        </div>

        {erro && <p className="erro">{erro}</p>}
        <button type="submit" disabled={verificando}>
          {verificando ? 'Verificando...' : 'Entrar na sala'}
        </button>
      </form>

      {modalAberto === 'hope' &&
        (ehD20 ? (
          <DiceColorModal
            titulo="Dado d20"
            corFundo={corD20}
            corBorda={corBordaD20}
            corTexto={corTextoD20}
            tema={temaD20}
            padrao={ESTILO_PADRAO_D20}
            onAplicar={({ corFundo, corBorda, corTexto, tema }) => {
              setCorD20(corFundo)
              setCorBordaD20(corBorda)
              setCorTextoD20(corTexto)
              setTemaD20(tema)
            }}
            onFechar={() => setModalAberto(null)}
          />
        ) : (
          <DiceColorModal
            titulo="Dado de Esperança"
            corFundo={corHope}
            corBorda={corBordaHope}
            corTexto={corTextoHope}
            tema={temaHope}
            padrao={ESTILO_PADRAO_HOPE}
            onAplicar={({ corFundo, corBorda, corTexto, tema }) => {
              setCorHope(corFundo)
              setCorBordaHope(corBorda)
              setCorTextoHope(corTexto)
              setTemaHope(tema)
            }}
            onFechar={() => setModalAberto(null)}
          />
        ))}

      {modalAberto === 'fear' &&
        (ehD20 ? (
          <DiceColorModal
            titulo="Dado d20 extra (vantagem/desvantagem)"
            corFundo={corD20Extra}
            corBorda={corBordaD20Extra}
            corTexto={corTextoD20Extra}
            tema={temaD20Extra}
            padrao={ESTILO_PADRAO_D20_EXTRA}
            onAplicar={({ corFundo, corBorda, corTexto, tema }) => {
              setCorD20Extra(corFundo)
              setCorBordaD20Extra(corBorda)
              setCorTextoD20Extra(corTexto)
              setTemaD20Extra(tema)
            }}
            onFechar={() => setModalAberto(null)}
          />
        ) : (
          <DiceColorModal
            titulo="Dado de Medo"
            corFundo={corFear}
            corBorda={corBordaFear}
            corTexto={corTextoFear}
            tema={temaFear}
            padrao={ESTILO_PADRAO_FEAR}
            onAplicar={({ corFundo, corBorda, corTexto, tema }) => {
              setCorFear(corFundo)
              setCorBordaFear(corBorda)
              setCorTextoFear(corTexto)
              setTemaFear(tema)
            }}
            onFechar={() => setModalAberto(null)}
          />
        ))}
    </section>
  )
}

export default PlayerSetup
