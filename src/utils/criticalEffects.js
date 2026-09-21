// Visual effects randomly picked when someone rolls a Critical (Hope ==
// Fear, or a nat 20 on the d20 system). To add a new effect: add the
// matching `case` in CriticalEffect.jsx + the CSS in App.css, and list the
// id here.
export const CRITICAL_EFFECTS = ['sparks', 'shake', 'crack', 'seal', 'coins']

export function pickCriticalEffect() {
  return CRITICAL_EFFECTS[Math.floor(Math.random() * CRITICAL_EFFECTS.length)]
}

export function isCritical(winner) {
  return winner === 'critico' || winner === 'd20-critico'
}
