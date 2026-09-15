import { useState } from 'react'
import { gerarCodigoSala } from '../utils/codigo'

function Home({ onEntrarSala }) {
  const [modo, setModo] = useState(null) // 'criar' | 'entrar' | null
  const [codigo, setCodigo] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')

  function iniciarCriarSala() {
    setCodigo(gerarCodigoSala())
    setSenha('')
    setErro('')
    setModo('criar')
  }

  function iniciarEntrarSala() {
    setCodigo('')
    setSenha('')
    setErro('')
    setModo('entrar')
  }

  function confirmar(e) {
    e.preventDefault()
    if (!codigo.trim() || !senha.trim()) {
      setErro('Preencha código e senha.')
      return
    }
    onEntrarSala({ codigo: codigo.trim().toUpperCase(), senha })
  }

  if (!modo) {
    return (
      <section className="home">
        <h1>Duality Dice</h1>
        <p>Rolagem de Esperança e Medo do Daggerheart, em tempo real.</p>
        <div className="home-botoes">
          <button type="button" onClick={iniciarCriarSala}>
            Criar sala
          </button>
          <button type="button" onClick={iniciarEntrarSala}>
            Entrar em sala
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="home">
      <h1>{modo === 'criar' ? 'Criar sala' : 'Entrar em sala'}</h1>
      <form className="form-sala" onSubmit={confirmar}>
        <label>
          Código da sala
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            readOnly={modo === 'criar'}
            maxLength={8}
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </label>
        {erro && <p className="erro">{erro}</p>}
        <div className="home-botoes">
          <button type="submit">
            {modo === 'criar' ? 'Criar e entrar' : 'Entrar'}
          </button>
          <button type="button" className="secundario" onClick={() => setModo(null)}>
            Voltar
          </button>
        </div>
      </form>
    </section>
  )
}

export default Home
