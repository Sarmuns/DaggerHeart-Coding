import { useState } from 'react'
import Home from './components/Home'
import PlayerSetup from './components/PlayerSetup'
import Room from './components/Room'
import './App.css'

function App() {
  const [sala, setSala] = useState(null) // { codigo, senha, nome }
  const [jogador, setJogador] = useState(null) // { nome, cor }

  function entrarSala(dados) {
    setSala({ nome: '', ...dados })
  }

  function atualizarSala(campos) {
    setSala((atual) => ({ ...atual, ...campos }))
  }

  function atualizarJogador(campos) {
    setJogador((atual) => ({ ...atual, ...campos }))
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
