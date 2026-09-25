import { supabase } from '../lib/supabase'

// Fear tokens são da mesa, não de um jogador — qualquer um ajusta, e cada
// ajuste vira uma linha em `fear_log` (quem, quanto, resultado). O valor
// atual é o `valor` da linha mais recente da sala; as linhas também entram
// no histórico ao lado das rolagens.
export async function loadFearLog(roomId, limit = 30) {
  const { data, error } = await supabase
    .from('fear_log')
    .select('*')
    .eq('room_id', roomId)
    .order('criado_em', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error loading fear log:', error)
    return []
  }
  return data ?? []
}

export async function logFearChange(roomId, jogador, delta, valor) {
  const { error } = await supabase.from('fear_log').insert({ room_id: roomId, jogador, delta, valor })
  if (error) console.error('Error logging fear change:', error)
  return !error
}
