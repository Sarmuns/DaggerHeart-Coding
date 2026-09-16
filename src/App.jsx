import { useRef, useState } from 'react'
import Home from './components/Home'
import PlayerSetup from './components/PlayerSetup'
import Room from './components/Room'
import { salvarPreferenciasJogador } from './utils/preferenciasJogador'
import { carregarEstiloDoJogador, salvarEstiloDoJogador } from './utils/preferenciasJogadorDb'
import './App.css'

function App() {
  const [sala, setSala] = useState(null) // { codigo, senha, nome }
  const [jogador, setJogador] = useState(null) // { nome, cor, corHope, corFear, corTextoHope, corTextoFear }
  const salvarEstiloTimeoutRef = useRef(null)

  function entrarSala(dados) {
    setSala({ nome: '', ...dados })
  }

  function atualizarSala(campos) {
    setSala((atual) => ({ ...atual, ...campos }))
  }

  function agendarSalvarEstilo(jogadorAtualizado) {
    clearTimeout(salvarEstiloTimeoutRef.current)
    salvarEstiloTimeoutRef.current = setTimeout(() => {
      salvarEstiloDoJogador(jogadorAtualizado)
    }, 300)
  }

  async function atualizarJogador(campos) {
    if (campos.nome && campos.nome !== jogador?.nome) {
      const estiloSalvo = await carregarEstiloDoJogador(campos.nome)
      setJogador((atual) => {
        const novoJogador = { ...atual, ...campos, ...(estiloSalvo ?? {}) }
        salvarPreferenciasJogador(novoJogador)
        agendarSalvarEstilo(novoJogador)
        return novoJogador
      })
      return
    }

    setJogador((atual) => {
      const novoJogador = { ...atual, ...campos }
      salvarPreferenciasJogador(novoJogador)
      agendarSalvarEstilo(novoJogador)
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
    <Room
      sala={sala}
      onAtualizarSala={atualizarSala}
      jogador={jogador}
      onAtualizarJogador={atualizarJogador}
    />
  )
}

export default App
