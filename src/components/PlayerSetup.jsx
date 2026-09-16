import { useState } from 'react'
import { CORES } from '../utils/cores'
import { carregarPreferenciasJogador, salvarPreferenciasJogador } from '../utils/preferenciasJogador'
import ColorInput from './ColorInput'
import ColorSwatchPicker from './ColorSwatchPicker'
import NomePicklist from './NomePicklist'

const COR_HOPE_PADRAO = '#f5c518'
const COR_FEAR_PADRAO = '#6f5aa8'
const COR_TEXTO_HOPE_PADRAO = '#1a1a1a'
const COR_TEXTO_FEAR_PADRAO = '#ffffff'

function PlayerSetup({ codigoSala, onConfirmar }) {
  const preferencias = carregarPreferenciasJogador()

  const [nome, setNome] = useState(preferencias?.nome ?? '')
  const [cor, setCor] = useState(preferencias?.cor ?? CORES[0].valor)
  const [corHope, setCorHope] = useState(preferencias?.corHope ?? COR_HOPE_PADRAO)
  const [corFear, setCorFear] = useState(preferencias?.corFear ?? COR_FEAR_PADRAO)
  const [corTextoHope, setCorTextoHope] = useState(preferencias?.corTextoHope ?? COR_TEXTO_HOPE_PADRAO)
  const [corTextoFear, setCorTextoFear] = useState(preferencias?.corTextoFear ?? COR_TEXTO_FEAR_PADRAO)
  const [erro, setErro] = useState('')

  function confirmar(e) {
    e.preventDefault()
    if (!nome) {
      setErro('Escolha seu nome.')
      return
    }
    const jogador = { nome, cor, corHope, corFear, corTextoHope, corTextoFear }
    salvarPreferenciasJogador(jogador)
    onConfirmar(jogador)
  }

  return (
    <section className="player-setup">
      <h1>Sala {codigoSala}</h1>
      <form onSubmit={confirmar}>
        <NomePicklist label="Seu nome" nomeSelecionado={nome} onSelecionar={setNome} />

        <ColorSwatchPicker label="Sua cor" corSelecionada={cor} onSelecionar={setCor} />

        <ColorInput label="Cor do dado de Esperança" value={corHope} onChange={setCorHope} />
        <ColorInput label="Cor dos números (Esperança)" value={corTextoHope} onChange={setCorTextoHope} />
        <ColorInput label="Cor do dado de Medo" value={corFear} onChange={setCorFear} />
        <ColorInput label="Cor dos números (Medo)" value={corTextoFear} onChange={setCorTextoFear} />

        {erro && <p className="erro">{erro}</p>}
        <button type="submit">Entrar na sala</button>
      </form>
    </section>
  )
}

export default PlayerSetup
