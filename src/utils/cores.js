export const CORES = [
  { nome: 'Vermelho', valor: '#e5484d' },
  { nome: 'Verde', valor: '#30a46c' },
  { nome: 'Amarelo', valor: '#f5c518' },
  { nome: 'Azul', valor: '#3b82f6' },
  { nome: 'Laranja', valor: '#f76b15' },
  { nome: 'Roxo', valor: '#aa3bff' },
  { nome: 'Rosa', valor: '#ec4899' },
  { nome: 'Ciano', valor: '#06b6d4' },
]

export function primeiraCorLivre(coresOcupadas, preferida) {
  if (preferida && !coresOcupadas.includes(preferida)) return preferida
  const livre = CORES.find((c) => !coresOcupadas.includes(c.valor))
  return livre ? livre.valor : CORES[0].valor
}
