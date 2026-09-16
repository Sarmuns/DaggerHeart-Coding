import { useState } from 'react'
import Home from './components/Home'
import PlayerSetup from './components/PlayerSetup'
import Room from './components/Room'
import { salvarPreferenciasJogador } from './utils/preferenciasJogador'
import { salvarEstiloDoJogador } from './utils/preferenciasJogadorDb'
import './App.css'

function App() {
  const [sala, setSala] = useState(null) // { codigo, senha, roomId }
  const [jogador, setJogador] = useState(null) // { nome, cor, corHope, corFear, corTextoHope, corTextoFear }

  function entrarSala(dados) {
    setSala(dados)
  }

  function atualizarJogador(campos) {
    setJogador((atual) => {
      const novoJogador = { ...atual, ...campos }
      salvarPreferenciasJogador(novoJogador)
      salvarEstiloDoJogador(novoJogador)
      return novoJogador
    })
  }

  if (!sala) {
    return <Home onEntrarSala={entrarSala} />
  }

  if (!jogador) {
    return <PlayerSetup codigoSala={sala.codigo} roomId={sala.roomId} onConfirmar={setJogador} />
  }

  return (
    <Room sala={sala} jogador={jogador} onAtualizarJogador={atualizarJogador} />
  )
}

export default App
