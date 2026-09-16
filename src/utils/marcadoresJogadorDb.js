import { supabase } from '../lib/supabase'
import { MARCADORES_PADRAO } from './marcadoresJogador'

function paraLinhaDb(nome, marcadores) {
  return {
    nome,
    pv: marcadores.pv,
    pv_max: marcadores.pvMax,
    esperanca: marcadores.esperanca,
    esperanca_max: marcadores.esperancaMax,
    estresse: marcadores.estresse,
    estresse_max: marcadores.estresseMax,
    fadiga: marcadores.fadiga,
    fadiga_max: marcadores.fadigaMax,
    armadura: marcadores.armadura,
    armadura_max: marcadores.armaduraMax,
    evasao: marcadores.evasao,
    limiar_maior: marcadores.limiarMaior,
    limiar_grave: marcadores.limiarGrave,
    fear: marcadores.fear,
    fear_max: marcadores.fearMax,
  }
}

function daLinhaDb(linha) {
  return {
    pv: linha.pv,
    pvMax: linha.pv_max,
    esperanca: linha.esperanca,
    esperancaMax: linha.esperanca_max,
    estresse: linha.estresse,
    estresseMax: linha.estresse_max,
    fadiga: linha.fadiga,
    fadigaMax: linha.fadiga_max,
    armadura: linha.armadura,
    armaduraMax: linha.armadura_max,
    evasao: linha.evasao,
    limiarMaior: linha.limiar_maior,
    limiarGrave: linha.limiar_grave,
    fear: linha.fear,
    fearMax: linha.fear_max,
  }
}

export async function carregarMarcadoresDoJogador(nome) {
  if (!nome) return MARCADORES_PADRAO
  const { data, error } = await supabase
    .from('marcadores_jogador')
    .select('*')
    .eq('nome', nome)
    .maybeSingle()

  if (error || !data) return MARCADORES_PADRAO
  return daLinhaDb(data)
}

export async function salvarMarcadoresDoJogador(nome, marcadores) {
  if (!nome) return
  const { error } = await supabase.from('marcadores_jogador').upsert(paraLinhaDb(nome, marcadores))
  if (error) console.error('Erro ao salvar marcadores do jogador:', error)
}
