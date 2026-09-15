import { useState } from 'react'
import { CORES } from '../utils/cores'
import ColorInput from './ColorInput'
import ColorSwatchPicker from './ColorSwatchPicker'

const COR_HOPE_PADRAO = '#f5c518'
const COR_FEAR_PADRAO = '#6f5aa8'

function PlayerSetup({ codigoSala, onConfirmar }) {
  const [nome, setNome] = useState('')
  const [cor, setCor] = useState(CORES[0].valor)
  const [corHope, setCorHope] = useState(COR_HOPE_PADRAO)
  const [corFear, setCorFear] = useState(COR_FEAR_PADRAO)
  const [erro, setErro] = useState('')

  function confirmar(e) {
    e.preventDefault()
    if (!nome.trim()) {
      setErro('Digite seu nome.')
      return
    }
    onConfirmar({ nome: nome.trim(), cor, corHope, corFear })
  }

  return (
    <section className="player-setup">
      <h1>Sala {codigoSala}</h1>
      <form onSubmit={confirmar}>
        <label>
          Seu nome
          <input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={20} />
        </label>

        <ColorSwatchPicker label="Sua cor" corSelecionada={cor} onSelecionar={setCor} />

        <ColorInput label="Cor do dado de Esperança" value={corHope} onChange={setCorHope} />
        <ColorInput label="Cor do dado de Medo" value={corFear} onChange={setCorFear} />

        {erro && <p className="erro">{erro}</p>}
        <button type="submit">Entrar na sala</button>
      </form>
    </section>
  )
}

export default PlayerSetup
