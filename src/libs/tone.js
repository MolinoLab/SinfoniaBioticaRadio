import * as Tone from 'tone'

export function playTone() {
  const synth = new Tone.Synth().toDestination()
  const now = Tone.now()
  synth.triggerAttackRelease('C4', '8n', now)
  synth.triggerAttackRelease('E4', '8n', now + 0.5)
  synth.triggerAttackRelease('G4', '8n', now + 1)
}
