const CHARACTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateRoomCode(length = 5) {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)]
  }
  return code
}
