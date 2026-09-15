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

export function textoResultado({ vencedor, hope, fear }) {
  const total = hope + fear
  if (vencedor === 'critico') return `Crítico! (${total})`
  if (vencedor === 'hope') return `${total} com Esperança`
  return `${total} com Medo`
}
