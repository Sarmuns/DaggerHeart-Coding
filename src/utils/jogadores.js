// ÚNICO lugar pra gerenciar quem joga, quem é DM e a cor de cada um.
// Pra adicionar/remover jogador, trocar a tag de DM ou a cor, mexe só aqui.
export const JOGADORES = [
  { nome: 'Rafa', cor: 'red' },
  { nome: 'Gabriel', dm: true, cor: 'blue' },
  { nome: 'Adriano', cor: 'green' },
  { nome: 'Samuel', cor: 'grey' },
  { nome: 'Vini', cor: 'purple' },
  { nome: 'Ranny', cor: 'yellow' },
]

export const NOMES_JOGADORES = JOGADORES.map((j) => j.nome)
export const NOMES_DM = JOGADORES.filter((j) => j.dm).map((j) => j.nome)

const COR_PADRAO = 'grey'

export function corDoJogador(nome) {
  return JOGADORES.find((j) => j.nome === nome)?.cor ?? COR_PADRAO
}
