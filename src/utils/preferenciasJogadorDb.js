import { supabase } from '../lib/supabase'

function paraLinhaDb(jogador) {
  return {
    nome: jogador.nome,
    cor: jogador.cor,
    cor_hope: jogador.corHope,
    cor_fear: jogador.corFear,
    cor_texto_hope: jogador.corTextoHope,
    cor_texto_fear: jogador.corTextoFear,
    cor_borda_hope: jogador.corBordaHope,
    cor_borda_fear: jogador.corBordaFear,
    tema_hope: jogador.temaHope,
    tema_fear: jogador.temaFear,
    cor_d20: jogador.corD20,
    cor_texto_d20: jogador.corTextoD20,
    cor_borda_d20: jogador.corBordaD20,
    tema_d20: jogador.temaD20,
    cor_d20_extra: jogador.corD20Extra,
    cor_texto_d20_extra: jogador.corTextoD20Extra,
    cor_borda_d20_extra: jogador.corBordaD20Extra,
    tema_d20_extra: jogador.temaD20Extra,
  }
}

function daLinhaDb(linha) {
  return {
    cor: linha.cor,
    corHope: linha.cor_hope,
    corFear: linha.cor_fear,
    corTextoHope: linha.cor_texto_hope,
    corTextoFear: linha.cor_texto_fear,
    corBordaHope: linha.cor_borda_hope,
    corBordaFear: linha.cor_borda_fear,
    temaHope: linha.tema_hope,
    temaFear: linha.tema_fear,
    corD20: linha.cor_d20,
    corTextoD20: linha.cor_texto_d20,
    corBordaD20: linha.cor_borda_d20,
    temaD20: linha.tema_d20,
    corD20Extra: linha.cor_d20_extra,
    corTextoD20Extra: linha.cor_texto_d20_extra,
    corBordaD20Extra: linha.cor_borda_d20_extra,
    temaD20Extra: linha.tema_d20_extra,
  }
}

export async function carregarEstiloDoJogador(nome) {
  if (!nome) return null
  const { data, error } = await supabase
    .from('preferencias_jogador')
    .select('*')
    .eq('nome', nome)
    .maybeSingle()

  if (error || !data) return null
  return daLinhaDb(data)
}

export async function salvarEstiloDoJogador(jogador) {
  if (!jogador?.nome) return
  const { error } = await supabase.from('preferencias_jogador').upsert(paraLinhaDb(jogador))
  if (error) console.error('Erro ao salvar estilo do jogador:', error)
}
