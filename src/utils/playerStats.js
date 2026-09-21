// Daggerheart character stats. HP, Hope, Stress and Armor are marked
// "tracks" (current value / max); Evasion and the Damage Thresholds are
// fixed numbers (no tracking). Fatigue is an extra house-rule track, outside
// the official SRD. Fear is the GM's resource — it isn't per character, it
// only exists for the player tagged as DM.
export const DEFAULT_STATS = {
  hp: 10,
  hpMax: 10,
  hopeTokens: 2,
  hopeTokensMax: 6,
  stress: 0,
  stressMax: 6,
  fatigue: 0,
  fatigueMax: 6,
  armor: 0,
  armorMax: 6,
  evasion: 10,
  majorThreshold: 7,
  severeThreshold: 14,
  fear: 0,
  fearMax: 12,
}

// Presence only carries what was tracked — never assume a field exists
// (an old player still loading from the database, etc.).
export function statsFromPresence(presenceEntry) {
  const stats = {}
  for (const field of Object.keys(DEFAULT_STATS)) {
    stats[field] = presenceEntry[field] ?? DEFAULT_STATS[field]
  }
  return stats
}
