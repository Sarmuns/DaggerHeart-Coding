// Single place to manage who plays, who is the DM, and everyone's color.
// To add/remove a player, change the DM tag or color, edit only here.
export const PLAYERS = [
  { name: 'Adriano', color: 'green' },
  { name: 'Gabriel', color: 'blue' },
  { name: 'Rafa', color: 'red' },
  { name: 'Ranny', color: 'yellow' },
  { name: 'Samuel', color: 'purple' },
  { name: 'Vini', color: 'grey' },
]

// Alphabetical order is automatic — no need to keep the array above sorted.
export const PLAYER_NAMES = PLAYERS.map((p) => p.name).sort((a, b) => a.localeCompare(b, 'pt-BR'))
export const DM_NAMES = PLAYERS.filter((p) => p.isDM).map((p) => p.name)

const DEFAULT_COLOR = 'grey'

export function colorForPlayer(name) {
  return PLAYERS.find((p) => p.name === name)?.color ?? DEFAULT_COLOR
}
