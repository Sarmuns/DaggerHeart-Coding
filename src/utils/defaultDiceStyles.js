import { DEFAULT_THEME } from './diceThemes'

export const DEFAULT_HOPE_STYLE = {
  backgroundColor: '#f5c518',
  borderColor: '#7a5c00',
  textColor: '#1a1a1a',
  theme: DEFAULT_THEME,
}

export const DEFAULT_FEAR_STYLE = {
  backgroundColor: '#6f5aa8',
  borderColor: '#2e2447',
  textColor: '#ffffff',
  theme: DEFAULT_THEME,
}

// The d20 style is independent from Hope/Fear — players on the duality
// system never use this, but the field already exists so anyone switching
// to d20 doesn't have to set it up from scratch.
export const DEFAULT_D20_STYLE = {
  backgroundColor: '#3b3b3b',
  borderColor: '#1a1a1a',
  textColor: '#ffffff',
  theme: DEFAULT_THEME,
}

export const DEFAULT_D20_EXTRA_STYLE = {
  backgroundColor: '#8a8a8a',
  borderColor: '#4a4a4a',
  textColor: '#1a1a1a',
  theme: DEFAULT_THEME,
}
