import { NOMES_DM } from './jogadores'

export const MECANICA_DUALIDADE = 'dualidade'
export const MECANICA_D20 = 'd20'

// Jogadores com a tag de DM ganham o d20 como dado padrão, mas podem
// trocar pra 2d12 (dualidade) a qualquer momento pelo toggle na sala.
// Quem é DM se gerencia em utils/jogadores.js.
export function ehDM(nome) {
  return NOMES_DM.includes(nome)
}

// Mecânica padrão de cada jogador (usada antes de entrar na sala, ou como
// fallback pra quem ainda não fez toggle) — DM começa em d20, o resto
// sempre em dualidade.
export function mecanicaDoJogador(nome) {
  return ehDM(nome) ? MECANICA_D20 : MECANICA_DUALIDADE
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
