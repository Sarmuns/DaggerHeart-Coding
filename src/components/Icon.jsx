// Ícones em SVG inline, desenhados sobre uma grade de 24px com traços
// retos e cantos vivos pra combinar com a UI pixel art. Substituem os
// glifos de texto (⟳ ⚙ ☰) e o emoji 🎲, que mudavam de forma conforme a
// fonte do sistema e não aceitavam cor do tema.
const PATHS = {
  // Seta circular de recarregar
  refresh: (
    <>
      <path d="M20 12a8 8 0 1 1-2.34-5.66" />
      <polyline points="20 4 20 9 15 9" />
    </>
  ),
  // Engrenagem quadrada (configurações)
  gear: (
    <>
      <path d="M10 3h4v2.6l2.2 1.3 2.2-1.3 2 3.5-2.2 1.3v2.6l2.2 1.3-2 3.5-2.2-1.3-2.2 1.3V21h-4v-2.6l-2.2-1.3-2.2 1.3-2-3.5 2.2-1.3v-2.6L3.6 9.1l2-3.5 2.2 1.3L10 5.6z" />
      <rect x="9.5" y="9.5" width="5" height="5" />
    </>
  ),
  // Três barras (status da mesa)
  list: (
    <>
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </>
  ),
  // X reto (fechar), em vez do glifo unicode ✕ — mesmo peso de traço dos
  // outros ícones.
  close: (
    <>
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </>
  ),
  // Check (usado no botão de "Anotar na Ficha")
  check: (
    <>
      <polyline points="4 13 9.5 18.5 20 6" />
    </>
  ),
  // Dado: quadrado com pips nos cantos e no centro
  die: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" />
      <rect x="7.5" y="7.5" width="2" height="2" fill="currentColor" />
      <rect x="14.5" y="7.5" width="2" height="2" fill="currentColor" />
      <rect x="11" y="11" width="2" height="2" fill="currentColor" />
      <rect x="7.5" y="14.5" width="2" height="2" fill="currentColor" />
      <rect x="14.5" y="14.5" width="2" height="2" fill="currentColor" />
    </>
  ),
  // Chama (Fear tokens da mesa)
  flame: (
    <>
      <path d="M12 2c1 3-3 4-3 8a3 3 0 0 0 6 0c1.5 1.5 2 3 2 5a5 5 0 0 1-10 0c0-4 2-5 3-9 .5 1 .8 2 1 3z" />
    </>
  ),
}

function Icon({ name, size }) {
  return (
    <svg
      // Classe extra por nome (icon-glyph--gear etc.) só pra dar o gancho
      // de hover específico de cada ícone lá no CSS.
      className={`icon-glyph icon-glyph--${name}`}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      style={size ? { width: size, height: size } : undefined}
    >
      {PATHS[name]}
    </svg>
  )
}

export default Icon
