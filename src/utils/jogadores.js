// ÚNICO lugar pra gerenciar quem joga e quem é DM.
// Pra adicionar/remover jogador ou trocar a tag de DM, mexe só aqui.
export const JOGADORES = [
  { nome: 'Rafa' },
  { nome: 'Gabriel', dm: true },
  { nome: 'Adriano' },
  { nome: 'Samuel' },
  { nome: 'Vini' },
]

export const NOMES_JOGADORES = JOGADORES.map((j) => j.nome)
export const NOMES_DM = JOGADORES.filter((j) => j.dm).map((j) => j.nome)
