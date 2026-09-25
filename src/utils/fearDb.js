import { supabase } from '../lib/supabase'

// Fear tokens agora são da mesa, não de um jogador só — qualquer um pode
// ajustar, e cada ajuste vira uma linha em `fear_log` (quem, quanto,
// resultado). O valor atual é sempre o `valor` da linha mais recente da sala.
export async function loadFear(roomId) {
  const { data, error } = await supabase
    .from('fear_log')
    .select('valor')
    .eq('room_id', roomId)
    .order('criado_em', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return 0
  return data.valor
}

export async function logFearChange(roomId, jogador, delta, valor) {
  const { error } = await supabase.from('fear_log').insert({
    room_id: roomId,
    jogador,
    delta,
    valor,
  })
  if (error) console.error('Error logging fear change:', error)
}
