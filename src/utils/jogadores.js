// ÚNICO lugar pra gerenciar quem joga, quem é DM e a cor de cada um.
// Pra adicionar/remover jogador, trocar a tag de DM ou a cor, mexe só aqui.
export const JOGADORES = [
  { nome: 'Adriano', cor: 'green' },
  { nome: 'Gabriel', dm: true, cor: 'blue' },
  { nome: 'Rafa', cor: 'red' },
  { nome: 'Ranny', cor: 'yellow' },
  { nome: 'Samuel', cor: 'grey' },
  { nome: 'Vini', cor: 'purple' },
]

// Ordem alfabética automática — não precisa manter o array acima em ordem.
export const NOMES_JOGADORES = JOGADORES.map((j) => j.nome).sort((a, b) => a.localeCompare(b, 'pt-BR'))
export const NOMES_DM = JOGADORES.filter((j) => j.dm).map((j) => j.nome)

const COR_PADRAO = 'grey'

export function corDoJogador(nome) {
  return JOGADORES.find((j) => j.nome === nome)?.cor ?? COR_PADRAO
}
