// Key kept as-is (existing browsers already have a cached value under it).
const STORAGE_KEY = 'daggerheart:jogador'

export function loadPlayerPreferences() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function savePlayerPreferences(preferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
  } catch {
    // localStorage unavailable (private mode, old browser, etc.)
  }
}
