import { useEffect, useState } from 'react'
import bcrypt from 'bcryptjs'
import { supabase } from '../lib/supabase'

const TEST_ROOM_CODE = 'TESTE'

async function ensureTestRoom() {
  const { data: existing } = await supabase
    .from('rooms')
    .select('id, codigo, criada_em')
    .eq('codigo', TEST_ROOM_CODE)
    .maybeSingle()

  if (existing) return existing

  const passwordHash = await bcrypt.hash(crypto.randomUUID(), 10)
  const { data, error } = await supabase
    .from('rooms')
    .insert({ codigo: TEST_ROOM_CODE, senha_hash: passwordHash })
    .select('id, codigo, criada_em')
    .single()

  if (!error) return data

  // another client may have created the room in the meantime
  const { data: retry } = await supabase
    .from('rooms')
    .select('id, codigo, criada_em')
    .eq('codigo', TEST_ROOM_CODE)
    .maybeSingle()
  return retry
}

function Home({ onJoinRoom }) {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadRooms() {
      try {
        await ensureTestRoom()
        const { data, error } = await supabase
          .from('rooms')
          .select('id, codigo, criada_em')
          .order('criada_em', { ascending: true })

        if (!active) return
        if (error) throw error
        setRooms(data ?? [])
      } catch {
        if (active) setError('Não foi possível carregar as salas.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadRooms()
    return () => {
      active = false
    }
  }, [])

  function handleJoinRoom(room) {
    onJoinRoom({ code: room.codigo, roomId: room.id })
  }

  return (
    <section className="home">
      <h1>Duality Dice</h1>
      <p>Rolagem de Esperança e Medo do Daggerheart, em tempo real.</p>

      <div className="room-list">
        <h2>Salas disponíveis</h2>
        {loading && <p>Carregando salas...</p>}
        {error && <p className="error">{error}</p>}
        {!loading && !error && (
          <ul>
            {rooms.map((room) => (
              <li key={room.id} className="room-item">
                <span className="room-item-code">{room.codigo}</span>
                <button type="button" onClick={() => handleJoinRoom(room)}>
                  Entrar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="home-actions">
        <button type="button" disabled title="Em breve">
          Criar sala
        </button>
      </div>
    </section>
  )
}

export default Home
