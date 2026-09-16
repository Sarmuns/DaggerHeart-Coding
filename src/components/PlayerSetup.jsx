import { useState } from 'react'
import { CORES } from '../utils/cores'
import { carregarPreferenciasJogador, salvarPreferenciasJogador } from '../utils/preferenciasJogador'
import ColorSwatchPicker from './ColorSwatchPicker'
import DiceColorModal from './DiceColorModal'
import NomePicklist from './NomePicklist'

const COR_HOPE_PADRAO = '#f5c518'
const COR_FEAR_PADRAO = '#6f5aa8'
const COR_TEXTO_HOPE_PADRAO = '#1a1a1a'
const COR_TEXTO_FEAR_PADRAO = '#ffffff'
const COR_BORDA_HOPE_PADRAO = '#7a5c00'
const COR_BORDA_FEAR_PADRAO = '#2e2447'

function PlayerSetup({ codigoSala, onConfirmar }) {
  const preferencias = carregarPreferenciasJogador()

  const [nome, setNome] = useState(preferencias?.nome ?? '')
  const [cor, setCor] = useState(preferencias?.cor ?? CORES[0].valor)
  const [corHope, setCorHope] = useState(preferencias?.corHope ?? COR_HOPE_PADRAO)
  const [corFear, setCorFear] = useState(preferencias?.corFear ?? COR_FEAR_PADRAO)
  const [corTextoHope, setCorTextoHope] = useState(preferencias?.corTextoHope ?? COR_TEXTO_HOPE_PADRAO)
  const [corTextoFear, setCorTextoFear] = useState(preferencias?.corTextoFear ?? COR_TEXTO_FEAR_PADRAO)
  const [corBordaHope, setCorBordaHope] = useState(preferencias?.corBordaHope ?? COR_BORDA_HOPE_PADRAO)
  const [corBordaFear, setCorBordaFear] = useState(preferencias?.corBordaFear ?? COR_BORDA_FEAR_PADRAO)
  const [modalAberto, setModalAberto] = useState(null) // 'hope' | 'fear' | null
  const [erro, setErro] = useState('')

  function confirmar(e) {
    e.preventDefault()
    if (!nome) {
      setErro('Escolha seu nome.')
      return
    }
    const jogador = { nome, cor, corHope, corFear, corTextoHope, corTextoFear, corBordaHope, corBordaFear }
    salvarPreferenciasJogador(jogador)
    onConfirmar(jogador)
  }

  return (
    <section className="player-setup">
      <h1>Sala {codigoSala}</h1>
      <form onSubmit={confirmar}>
        <NomePicklist label="Seu nome" nomeSelecionado={nome} onSelecionar={setNome} />

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
        <button type="submit">Entrar na sala</button>
      </form>

      {modalAberto === 'hope' && (
        <DiceColorModal
          titulo="Dado de Esperança"
          corFundo={corHope}
          corBorda={corBordaHope}
          corTexto={corTextoHope}
          onAlterarFundo={setCorHope}
          onAlterarBorda={setCorBordaHope}
          onAlterarTexto={setCorTextoHope}
          onFechar={() => setModalAberto(null)}
        />
      )}

      {modalAberto === 'fear' && (
        <DiceColorModal
          titulo="Dado de Medo"
          corFundo={corFear}
          corBorda={corBordaFear}
          corTexto={corTextoFear}
          onAlterarFundo={setCorFear}
          onAlterarBorda={setCorBordaFear}
          onAlterarTexto={setCorTextoFear}
          onFechar={() => setModalAberto(null)}
        />
      )}
    </section>
  )
}

export default PlayerSetup
