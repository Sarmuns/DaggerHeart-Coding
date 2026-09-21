import { DM_NAMES } from './players'

export const DICE_SYSTEM_DUALITY = 'dualidade'
export const DICE_SYSTEM_D20 = 'd20'

// Players tagged as DM get d20 as their default dice system, but can switch
// to 2d12 (duality) at any time via the toggle in the room. Who is DM is
// managed in utils/players.js.
export function isDM(name) {
  return DM_NAMES.includes(name)
}

// Default dice system for each player (used before joining a room, or as a
// fallback for anyone who hasn't toggled yet) — DM starts on d20, everyone
// else always starts on duality.
export function defaultDiceSystemFor(name) {
  return isDM(name) ? DICE_SYSTEM_D20 : DICE_SYSTEM_DUALITY
}

// Maps the style fields (coming from the player/presence object) to the
// "primary" and "secondary" slots of PlayerDiceSet, according to the dice
// system. The only place that decides which fields feed each die in the set.
export function primaryStyle(data, diceSystem) {
  if (diceSystem === DICE_SYSTEM_D20) {
    return { color: data.d20Color, border: data.d20BorderColor, text: data.d20TextColor, theme: data.d20Theme }
  }
  return { color: data.hopeColor, border: data.hopeBorderColor, text: data.hopeTextColor, theme: data.hopeTheme }
}

export function secondaryStyle(data, diceSystem) {
  if (diceSystem === DICE_SYSTEM_D20) {
    return {
      color: data.d20ExtraColor,
      border: data.d20ExtraBorderColor,
      text: data.d20ExtraTextColor,
      theme: data.d20ExtraTheme,
    }
  }
  return { color: data.fearColor, border: data.fearBorderColor, text: data.fearTextColor, theme: data.fearTheme }
}
