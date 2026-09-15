import { useEffect, useState } from 'react'
import bcrypt from 'bcryptjs'
import { supabase } from '../lib/supabase'

const CODIGO_SALA_TESTE = 'TESTE'

async function garantirSalaTeste() {
  const { data: existente } = await supabase
    .from('rooms')
    .select('id, codigo, criada_em')
    .eq('codigo', CODIGO_SALA_TESTE)
    .maybeSingle()

  if (existente) return existente

  const senhaHash = await bcrypt.hash(crypto.randomUUID(), 10)
  const { data, error } = await supabase
    .from('rooms')
    .insert({ codigo: CODIGO_SALA_TESTE, senha_hash: senhaHash })
    .select('id, codigo, criada_em')
    .single()

  if (!error) return data

  // outro cliente pode ter criado a sala nesse meio tempo
  const { data: retry } = await supabase
    .from('rooms')
    .select('id, codigo, criada_em')
    .eq('codigo', CODIGO_SALA_TESTE)
    .maybeSingle()
  return retry
}

function Home({ onEntrarSala }) {
  const [salas, setSalas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true

    async function carregar() {
      try {
        await garantirSalaTeste()
        const { data, error } = await supabase
          .from('rooms')
          .select('id, codigo, criada_em')
          .order('criada_em', { ascending: true })

        if (!ativo) return
        if (error) throw error
        setSalas(data ?? [])
      } catch {
        if (ativo) setErro('Não foi possível carregar as salas.')
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    carregar()
    return () => {
      ativo = false
    }
  }, [])

  function entrarNaSala(sala) {
    onEntrarSala({ codigo: sala.codigo, roomId: sala.id })
  }

  return (
    <section className="home">
      <h1>Duality Dice</h1>
      <p>Rolagem de Esperança e Medo do Daggerheart, em tempo real.</p>

      <div className="lista-salas">
        <h2>Salas disponíveis</h2>
        {carregando && <p>Carregando salas...</p>}
        {erro && <p className="erro">{erro}</p>}
        {!carregando && !erro && (
          <ul>
            {salas.map((sala) => (
              <li key={sala.id} className="sala-item">
                <span className="sala-item-codigo">{sala.codigo}</span>
                <button type="button" onClick={() => entrarNaSala(sala)}>
                  Entrar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="home-botoes">
        <button type="button" disabled title="Em breve">
          Criar sala
        </button>
      </div>
    </section>
  )
}

export default Home
