// Synthesized SFX via Web Audio API — no audio assets to fetch or ship.
// ponytail: no mute toggle yet, add if players ask to silence it.
let ctx = null

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone(audioCtx, freq, startOffset, duration, type, peakGain) {
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.type = type
  osc.frequency.value = freq
  const start = audioCtx.currentTime + startOffset
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(peakGain, start + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration)
  osc.connect(gain).connect(audioCtx.destination)
  osc.start(start)
  osc.stop(start + duration + 0.02)
}

// Rising three-note chime for a Critical.
export function playCriticalSound() {
  const audioCtx = getCtx()
  tone(audioCtx, 523.25, 0, 0.15, 'triangle', 0.25)
  tone(audioCtx, 659.25, 0.08, 0.15, 'triangle', 0.25)
  tone(audioCtx, 783.99, 0.16, 0.35, 'triangle', 0.3)
}
