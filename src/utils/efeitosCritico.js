// Efeitos visuais sorteados quando alguém tira Crítico (Esperança == Medo,
// ou nat 20 na mecânica d20). Pra adicionar um novo efeito: cria o `case`
// correspondente em EfeitoCritico.jsx + o CSS em App.css, e inclui o id aqui.
export const EFEITOS_CRITICO = ['faiscas', 'tremor', 'fenda', 'selo', 'moedas']

export function sortearEfeitoCritico() {
  return EFEITOS_CRITICO[Math.floor(Math.random() * EFEITOS_CRITICO.length)]
}

export function ehCritico(vencedor) {
  return vencedor === 'critico' || vencedor === 'd20-critico'
}
