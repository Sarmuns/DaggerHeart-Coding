export function rollDice() {
  return {
    hope: Math.floor(Math.random() * 12) + 1,
    fear: Math.floor(Math.random() * 12) + 1,
  }
}

// "winner" values are persisted as-is in the `rolls.vencedor` DB column —
// keep them exactly as 'hope' | 'fear' | 'critico' | 'd20' | 'd20-critico'
// so historical rows stay readable.
export function calculateResult(hope, fear) {
  if (hope === fear) {
    return { winner: 'critico', hope, fear }
  }
  return { winner: hope > fear ? 'hope' : 'fear', hope, fear }
}

export function calculateTotal(hope, fear, modifier) {
  const base = hope + fear
  if (!modifier) return base
  return modifier.type === 'vantagem' ? base + modifier.value : base - modifier.value
}

// d20 system (D&D-style): advantage/disadvantage roll 2d20 and keep the
// higher/lower — "hope" holds the kept value, "fear" the discarded one (or
// the same value, if there was no second roll).
export function calculateD20Result(keptValue, discardedValue = keptValue) {
  return {
    winner: keptValue === 20 ? 'd20-critico' : 'd20',
    hope: keptValue,
    fear: discardedValue,
  }
}

export function isD20Winner(winner) {
  return winner === 'd20' || winner === 'd20-critico'
}

export function resultText({ winner, hope, fear, modifier }) {
  if (isD20Winner(winner)) {
    return winner === 'd20-critico' ? `Crítico! (${hope})` : `${hope}`
  }
  const total = calculateTotal(hope, fear, modifier)
  if (winner === 'critico') return `Crítico! (${total})`
  if (winner === 'hope') return `${total} com Esperança`
  return `${total} com Medo`
}
