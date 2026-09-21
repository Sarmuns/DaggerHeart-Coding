import { supabase } from '../lib/supabase'
import { DEFAULT_STATS } from './playerStats'

// Translation boundary: app-level stats use English field names, but the
// `marcadores_jogador` table/columns already exist in production — keep
// those exact literal names here.
function toDbRow(name, stats) {
  return {
    nome: name,
    pv: stats.hp,
    pv_max: stats.hpMax,
    esperanca: stats.hopeTokens,
    esperanca_max: stats.hopeTokensMax,
    estresse: stats.stress,
    estresse_max: stats.stressMax,
    fadiga: stats.fatigue,
    fadiga_max: stats.fatigueMax,
    armadura: stats.armor,
    armadura_max: stats.armorMax,
    evasao: stats.evasion,
    limiar_maior: stats.majorThreshold,
    limiar_grave: stats.severeThreshold,
    fear: stats.fear,
    fear_max: stats.fearMax,
  }
}

function fromDbRow(row) {
  return {
    hp: row.pv,
    hpMax: row.pv_max,
    hopeTokens: row.esperanca,
    hopeTokensMax: row.esperanca_max,
    stress: row.estresse,
    stressMax: row.estresse_max,
    fatigue: row.fadiga,
    fatigueMax: row.fadiga_max,
    armor: row.armadura,
    armorMax: row.armadura_max,
    evasion: row.evasao,
    majorThreshold: row.limiar_maior,
    severeThreshold: row.limiar_grave,
    fear: row.fear,
    fearMax: row.fear_max,
  }
}

export async function loadPlayerStats(name) {
  if (!name) return DEFAULT_STATS
  const { data, error } = await supabase
    .from('marcadores_jogador')
    .select('*')
    .eq('nome', name)
    .maybeSingle()

  if (error || !data) return DEFAULT_STATS
  return fromDbRow(data)
}

export async function savePlayerStats(name, stats) {
  if (!name) return
  const { error } = await supabase.from('marcadores_jogador').upsert(toDbRow(name, stats))
  if (error) console.error('Error saving player stats:', error)
}
