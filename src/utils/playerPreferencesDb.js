import { supabase } from '../lib/supabase'

// Translation boundary: app-level player style uses English field names, but
// the `preferencias_jogador` table/columns already exist in production —
// keep those exact literal names here.
function toDbRow(player) {
  return {
    nome: player.name,
    cor: player.color,
    cor_hope: player.hopeColor,
    cor_fear: player.fearColor,
    cor_texto_hope: player.hopeTextColor,
    cor_texto_fear: player.fearTextColor,
    cor_borda_hope: player.hopeBorderColor,
    cor_borda_fear: player.fearBorderColor,
    tema_hope: player.hopeTheme,
    tema_fear: player.fearTheme,
    cor_d20: player.d20Color,
    cor_texto_d20: player.d20TextColor,
    cor_borda_d20: player.d20BorderColor,
    tema_d20: player.d20Theme,
    cor_d20_extra: player.d20ExtraColor,
    cor_texto_d20_extra: player.d20ExtraTextColor,
    cor_borda_d20_extra: player.d20ExtraBorderColor,
    tema_d20_extra: player.d20ExtraTheme,
  }
}

function fromDbRow(row) {
  return {
    color: row.cor,
    hopeColor: row.cor_hope,
    fearColor: row.cor_fear,
    hopeTextColor: row.cor_texto_hope,
    fearTextColor: row.cor_texto_fear,
    hopeBorderColor: row.cor_borda_hope,
    fearBorderColor: row.cor_borda_fear,
    hopeTheme: row.tema_hope,
    fearTheme: row.tema_fear,
    d20Color: row.cor_d20,
    d20TextColor: row.cor_texto_d20,
    d20BorderColor: row.cor_borda_d20,
    d20Theme: row.tema_d20,
    d20ExtraColor: row.cor_d20_extra,
    d20ExtraTextColor: row.cor_texto_d20_extra,
    d20ExtraBorderColor: row.cor_borda_d20_extra,
    d20ExtraTheme: row.tema_d20_extra,
  }
}

export async function loadPlayerStyle(name) {
  if (!name) return null
  const { data, error } = await supabase
    .from('preferencias_jogador')
    .select('*')
    .eq('nome', name)
    .maybeSingle()

  if (error || !data) return null
  return fromDbRow(data)
}

export async function savePlayerStyle(player) {
  if (!player?.name) return
  const { error } = await supabase.from('preferencias_jogador').upsert(toDbRow(player))
  if (error) console.error('Error saving player style:', error)
}
