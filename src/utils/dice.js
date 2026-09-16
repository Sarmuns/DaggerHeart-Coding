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

export function textoResultado({ vencedor, hope, fear, modificador }) {
  const total = calcularTotal(hope, fear, modificador)
  if (vencedor === 'critico') return `Crítico! (${total})`
  if (vencedor === 'hope') return `${total} com Esperança`
  return `${total} com Medo`
}
