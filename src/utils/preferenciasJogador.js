const CHAVE = 'daggerheart:jogador'

export function carregarPreferenciasJogador() {
  try {
    const bruto = localStorage.getItem(CHAVE)
    return bruto ? JSON.parse(bruto) : null
  } catch {
    return null
  }
}

export function salvarPreferenciasJogador(preferencias) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(preferencias))
  } catch {
    // localStorage indisponível (modo privado, navegador antigo, etc.)
  }
}
