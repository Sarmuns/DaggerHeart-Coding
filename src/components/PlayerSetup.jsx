import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { CORES } from '../utils/cores'
import { ESTILO_PADRAO_FEAR, ESTILO_PADRAO_HOPE } from '../utils/estiloPadraoDados'
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
  const [modalAberto, setModalAberto] = useState(null) // 'hope' | 'fear' | null
  const [nomesOcupados, setNomesOcupados] = useState([])
  const [erro, setErro] = useState('')
  const [verificando, setVerificando] = useState(false)

  useEffect(() => {
    const canal = supabase.channel(`room:${roomId}`)
    canal
      .on('presence', { event: 'sync' }, () => {
        const estado = canal.presenceState()
        const ocupados = Object.values(estado).map((metas) => metas[metas.length - 1]?.nome).filter(Boolean)
        setNomesOcupados(ocupados)
      })
      .subscribe()

    canalRef.current = canal

    return () => {
      canalRef.current = null
      supabase.removeChannel(canal)
    }
  }, [roomId])

  useEffect(() => {
    if (nomeLembrado) selecionarNome(nomeLembrado)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function aplicarEstiloPadrao() {
    setCor(COR_PADRAO)
    setCorHope(ESTILO_PADRAO_HOPE.corFundo)
    setCorFear(ESTILO_PADRAO_FEAR.corFundo)
    setCorTextoHope(ESTILO_PADRAO_HOPE.corTexto)
    setCorTextoFear(ESTILO_PADRAO_FEAR.corTexto)
    setCorBordaHope(ESTILO_PADRAO_HOPE.corBorda)
    setCorBordaFear(ESTILO_PADRAO_FEAR.corBorda)
    setTemaHope(ESTILO_PADRAO_HOPE.tema)
    setTemaFear(ESTILO_PADRAO_FEAR.tema)
  }

  async function selecionarNome(novoNome) {
    setNome(novoNome)
    setErro('')
    // O estilo é sempre o que está salvo no banco para esse nome (ou o
    // padrão, se ninguém salvou ainda) — nunca o que sobrou na tela de
    // um nome escolhido antes, pra não "vazar" cor de um jogador pro outro.
    const estiloSalvo = await carregarEstiloDoJogador(novoNome)
    if (estiloSalvo) {
      setCor(estiloSalvo.cor)
      setCorHope(estiloSalvo.corHope)
      setCorFear(estiloSalvo.corFear)
      setCorTextoHope(estiloSalvo.corTextoHope)
      setCorTextoFear(estiloSalvo.corTextoFear)
      setCorBordaHope(estiloSalvo.corBordaHope)
      setCorBordaFear(estiloSalvo.corBordaFear)
      setTemaHope(estiloSalvo.temaHope)
      setTemaFear(estiloSalvo.temaFear)
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

        <ColorSwatchPicker label="Sua cor" corSelecionada={cor} onSelecionar={setCor} />

        <div className="home-botoes">
          <button type="button" onClick={() => setModalAberto('hope')}>
            Dado de Esperança
          </button>
          <button type="button" onClick={() => setModalAberto('fear')}>
            Dado de Medo
          </button>
        </div>

        {erro && <p className="erro">{erro}</p>}
        <button type="submit" disabled={verificando}>
          {verificando ? 'Verificando...' : 'Entrar na sala'}
        </button>
      </form>

      {modalAberto === 'hope' && (
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
      )}

      {modalAberto === 'fear' && (
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
      )}
    </section>
  )
}

export default PlayerSetup
