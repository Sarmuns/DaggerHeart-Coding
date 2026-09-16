import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { CORES } from '../utils/cores'
import { carregarPreferenciasJogador, salvarPreferenciasJogador } from '../utils/preferenciasJogador'
import { carregarEstiloDoJogador, salvarEstiloDoJogador } from '../utils/preferenciasJogadorDb'
import { TEMA_PADRAO } from '../utils/temasDados'
import ColorSwatchPicker from './ColorSwatchPicker'
import DiceColorModal from './DiceColorModal'
import NomePicklist from './NomePicklist'

const COR_HOPE_PADRAO = '#f5c518'
const COR_FEAR_PADRAO = '#6f5aa8'
const COR_TEXTO_HOPE_PADRAO = '#1a1a1a'
const COR_TEXTO_FEAR_PADRAO = '#ffffff'
const COR_BORDA_HOPE_PADRAO = '#7a5c00'
const COR_BORDA_FEAR_PADRAO = '#2e2447'

function PlayerSetup({ codigoSala, roomId, onConfirmar }) {
  const preferencias = carregarPreferenciasJogador()
  const canalRef = useRef(null)

  const [nome, setNome] = useState(preferencias?.nome ?? '')
  const [cor, setCor] = useState(preferencias?.cor ?? CORES[0].valor)
  const [corHope, setCorHope] = useState(preferencias?.corHope ?? COR_HOPE_PADRAO)
  const [corFear, setCorFear] = useState(preferencias?.corFear ?? COR_FEAR_PADRAO)
  const [corTextoHope, setCorTextoHope] = useState(preferencias?.corTextoHope ?? COR_TEXTO_HOPE_PADRAO)
  const [corTextoFear, setCorTextoFear] = useState(preferencias?.corTextoFear ?? COR_TEXTO_FEAR_PADRAO)
  const [corBordaHope, setCorBordaHope] = useState(preferencias?.corBordaHope ?? COR_BORDA_HOPE_PADRAO)
  const [corBordaFear, setCorBordaFear] = useState(preferencias?.corBordaFear ?? COR_BORDA_FEAR_PADRAO)
  const [temaHope, setTemaHope] = useState(preferencias?.temaHope ?? TEMA_PADRAO)
  const [temaFear, setTemaFear] = useState(preferencias?.temaFear ?? TEMA_PADRAO)
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

  async function selecionarNome(novoNome) {
    setNome(novoNome)
    setErro('')
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
          onAlterarFundo={setCorHope}
          onAlterarBorda={setCorBordaHope}
          onAlterarTexto={setCorTextoHope}
          onAlterarTema={setTemaHope}
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
          onAlterarFundo={setCorFear}
          onAlterarBorda={setCorBordaFear}
          onAlterarTexto={setCorTextoFear}
          onAlterarTema={setTemaFear}
          onFechar={() => setModalAberto(null)}
        />
      )}
    </section>
  )
}

export default PlayerSetup
