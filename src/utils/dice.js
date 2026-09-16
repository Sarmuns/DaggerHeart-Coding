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
