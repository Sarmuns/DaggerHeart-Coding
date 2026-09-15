import { useState } from 'react'
import bcrypt from 'bcryptjs'
import { supabase } from '../lib/supabase'
import { gerarCodigoSala } from '../utils/codigo'

const CODIGO_JA_EXISTE = '23505'

async function criarSalaComCodigoUnico(senhaHash, tentativas = 5) {
  for (let i = 0; i < tentativas; i++) {
    const codigo = gerarCodigoSala()
    const { data, error } = await supabase
      .from('rooms')
      .insert({ codigo, senha_hash: senhaHash })
      .select('id, codigo')
      .single()

    if (!error) return data
    if (error.code !== CODIGO_JA_EXISTE) throw error
  }
  throw new Error('Não foi possível gerar um código de sala único. Tente novamente.')
}

function Home({ onEntrarSala }) {
  const [modo, setModo] = useState(null) // 'criar' | 'entrar' | null
  const [senha, setSenha] = useState('')
  const [codigoEntrar, setCodigoEntrar] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  function iniciarCriarSala() {
    setSenha('')
    setErro('')
    setModo('criar')
  }

  function iniciarEntrarSala() {
    setCodigoEntrar('')
    setSenha('')
    setErro('')
    setModo('entrar')
  }

  async function confirmarCriar(e) {
    e.preventDefault()
    if (!senha.trim()) {
      setErro('Defina uma senha para a sala.')
      return
    }
    setErro('')
    setCarregando(true)
    try {
      const senhaHash = await bcrypt.hash(senha, 10)
      const sala = await criarSalaComCodigoUnico(senhaHash)
      onEntrarSala({ codigo: sala.codigo, roomId: sala.id })
    } catch {
      setErro('Não foi possível criar a sala. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  async function confirmarEntrar(e) {
    e.preventDefault()
    if (!codigoEntrar.trim() || !senha.trim()) {
      setErro('Preencha código e senha.')
      return
    }
    setErro('')
    setCarregando(true)
    try {
      const codigo = codigoEntrar.trim().toUpperCase()
      const { data, error } = await supabase
        .from('rooms')
        .select('id, codigo, senha_hash')
        .eq('codigo', codigo)
        .maybeSingle()

      if (error) throw error
      if (!data) {
        setErro('Sala não encontrada.')
        return
      }

      const senhaCorreta = await bcrypt.compare(senha, data.senha_hash)
      if (!senhaCorreta) {
        setErro('Senha incorreta.')
        return
      }

      onEntrarSala({ codigo: data.codigo, roomId: data.id })
    } catch {
      setErro('Erro ao entrar na sala. Tente novamente.')
    } finally {
      setCarregando(false)
    }
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
      <form className="form-sala" onSubmit={modo === 'criar' ? confirmarCriar : confirmarEntrar}>
        {modo === 'entrar' && (
          <label>
            Código da sala
            <input
              value={codigoEntrar}
              onChange={(e) => setCodigoEntrar(e.target.value)}
              maxLength={8}
            />
          </label>
        )}
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
          <button type="submit" disabled={carregando}>
            {carregando ? 'Aguarde...' : modo === 'criar' ? 'Criar e entrar' : 'Entrar'}
          </button>
          <button
            type="button"
            className="secundario"
            onClick={() => setModo(null)}
            disabled={carregando}
          >
            Voltar
          </button>
        </div>
      </form>
    </section>
  )
}

export default Home
