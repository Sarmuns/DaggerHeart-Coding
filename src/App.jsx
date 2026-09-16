import { useState } from 'react'
import Home from './components/Home'
import PlayerSetup from './components/PlayerSetup'
import Room from './components/Room'
import { salvarPreferenciasJogador } from './utils/preferenciasJogador'
import './App.css'

function App() {
  const [sala, setSala] = useState(null) // { codigo, senha, nome }
  const [jogador, setJogador] = useState(null) // { nome, cor, corHope, corFear, corTextoHope, corTextoFear }

  function entrarSala(dados) {
    setSala({ nome: '', ...dados })
  }

  function atualizarSala(campos) {
    setSala((atual) => ({ ...atual, ...campos }))
  }

  function atualizarJogador(campos) {
    setJogador((atual) => {
      const novoJogador = { ...atual, ...campos }
      salvarPreferenciasJogador(novoJogador)
      return novoJogador
    })
  }

  if (!sala) {
    return <Home onEntrarSala={entrarSala} />
  }

  if (!jogador) {
    return <PlayerSetup codigoSala={sala.codigo} onConfirmar={setJogador} />
  }

  return (
    <Room
      sala={sala}
      onAtualizarSala={atualizarSala}
      jogador={jogador}
      onAtualizarJogador={atualizarJogador}
    />
  )
}

export default App
