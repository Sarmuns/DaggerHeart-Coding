export function rolarDados() {
  return {
    hope: Math.floor(Math.random() * 12) + 1,
    fear: Math.floor(Math.random() * 12) + 1,
  }
}

export function calcularResultado(hope, fear) {
  if (hope === fear) {
    return { vencedor: 'critico', hope, fear }
  }
  return { vencedor: hope > fear ? 'hope' : 'fear', hope, fear }
}

// Rank de um par pra comparação de "vantagem dupla": crítico > esperança >
// medo; dentro do mesmo rank, o par com maior soma vence.
function rankPar(hope, fear) {
  const rank = hope === fear ? 2 : hope > fear ? 1 : 0
  return [rank, hope + fear]
}

// Compara dois pares completos (hope+fear) e devolve o melhor, sem misturar
// o hope de um com o fear do outro — evita "vantagem" nos dois dados ao
// mesmo tempo, que deixaria o resultado quase sempre garantido.
export function melhorPar(parA, parB) {
  const [rankA, totalA] = rankPar(parA.hope, parA.fear)
  const [rankB, totalB] = rankPar(parB.hope, parB.fear)
  if (rankA !== rankB) return rankA > rankB ? parA : parB
  return totalA >= totalB ? parA : parB
}

export function calcularTotal(hope, fear, modificador) {
  const base = hope + fear
  if (!modificador) return base
  return modificador.tipo === 'vantagem' ? base + modificador.valor : base - modificador.valor
}

// mecânica d20 (estilo D&D): vantagem/desvantagem rolam 2d20 e ficam com o
// maior/menor — "hope" guarda o valor mantido, "fear" o descartado (ou o
// próprio valor, se não houve segunda rolagem).
export function calcularResultadoD20(valorMantido, valorDescartado = valorMantido) {
  return {
    vencedor: valorMantido === 20 ? 'd20-critico' : 'd20',
    hope: valorMantido,
    fear: valorDescartado,
  }
}

export function ehVencedorD20(vencedor) {
  return vencedor === 'd20' || vencedor === 'd20-critico'
}

export function textoResultado({ vencedor, hope, fear, modificador }) {
  if (ehVencedorD20(vencedor)) {
    return vencedor === 'd20-critico' ? `Crítico! (${hope})` : `${hope}`
  }
  const total = calcularTotal(hope, fear, modificador)
  if (vencedor === 'critico') return `Crítico! (${total})`
  if (vencedor === 'hope') return `${total} com Esperança`
  return `${total} com Medo`
}
