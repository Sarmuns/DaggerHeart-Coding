import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  ESTILO_PADRAO_D20,
  ESTILO_PADRAO_D20_EXTRA,
  ESTILO_PADRAO_FEAR,
  ESTILO_PADRAO_HOPE,
} from '../utils/estiloPadraoDados'
import { corDoJogador } from '../utils/jogadores'
import { carregarPreferenciasJogador, salvarPreferenciasJogador } from '../utils/preferenciasJogador'
import { carregarEstiloDoJogador, salvarEstiloDoJogador } from '../utils/preferenciasJogadorDb'
import NomePicklist from './NomePicklist'

function PlayerSetup({ codigoSala, roomId, onConfirmar }) {
  const nomeLembrado = carregarPreferenciasJogador()?.nome ?? ''
  const canalRef = useRef(null)

  const [nome, setNome] = useState('')
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
  const [nomesOcupados, setNomesOcupados] = useState([])
  const [erro, setErro] = useState('')
  const [verificando, setVerificando] = useState(false)

  useEffect(() => {
    const canal = supabase.channel(`room:${roomId}`)
    canal
      .on('presence', { event: 'sync' }, () => {
        const estado = canal.presenceState()
        const metasAtuais = Object.values(estado).map((metas) => metas[metas.length - 1]).filter(Boolean)
        setNomesOcupados(metasAtuais.map((m) => m.nome).filter(Boolean))
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
      cor: corDoJogador(nome),
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

        {erro && <p className="erro">{erro}</p>}
        <button type="submit" disabled={verificando}>
          {verificando ? 'Verificando...' : 'Entrar na sala'}
        </button>
      </form>
    </section>
  )
}

export default PlayerSetup
