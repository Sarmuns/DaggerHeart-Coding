export const MECANICA_DUALIDADE = 'dualidade'
export const MECANICA_D20 = 'd20'

// Único lugar que precisa mudar pra migrar alguém entre 2d12 (dualidade)
// e 1d20 — hoje é fixo por nome, depois vira um toggle na UI.
const MECANICA_POR_NOME = {
  Gabriel: MECANICA_D20,
}

export function mecanicaDoJogador(nome) {
  return MECANICA_POR_NOME[nome] ?? MECANICA_DUALIDADE
}

// Mapeia os campos de estilo (que vêm do jogador/presence) pro slot
// "principal" e "secundário" do PlayerDiceSet, de acordo com a mecânica.
// Único lugar que decide quais campos alimentam cada dado do conjunto.
export function estiloPrincipal(dados, mecanica) {
  if (mecanica === MECANICA_D20) {
    return { cor: dados.corD20, borda: dados.corBordaD20, texto: dados.corTextoD20, tema: dados.temaD20 }
  }
  return { cor: dados.corHope, borda: dados.corBordaHope, texto: dados.corTextoHope, tema: dados.temaHope }
}

export function estiloSecundario(dados, mecanica) {
  if (mecanica === MECANICA_D20) {
    return {
      cor: dados.corD20Extra,
      borda: dados.corBordaD20Extra,
      texto: dados.corTextoD20Extra,
      tema: dados.temaD20Extra,
    }
  }
  return { cor: dados.corFear, borda: dados.corBordaFear, texto: dados.corTextoFear, tema: dados.temaFear }
}
