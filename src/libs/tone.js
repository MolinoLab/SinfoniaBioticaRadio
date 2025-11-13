import * as Tone from 'tone'

export function playTone() {
  const synth = new Tone.Synth().toDestination()
  const now = Tone.now()
  //synth.triggerAttackRelease(midiNumber, duration, now, velocity)
  synth.triggerAttackRelease('C4', '8n', now)
  synth.triggerAttackRelease('E4', '8n', now + 0.5)
  synth.triggerAttackRelease('G4', '8n', now + 1)
}

export function playInfluxMidi(midiNumber, duration, velocity) {
  const synth = new Tone.Synth().toDestination()
  const now = Tone.now()
  synth.triggerAttackRelease(midiNumber, duration, now, velocity)
}

// Initialize PolySynth for multi-voice playback
const polySynth = new Tone.PolySynth(Tone.Synth).toDestination()
polySynth.set({
  envelope: {
    attack: 0.05,
    decay: 0.1,
    sustain: 0.3,
    release: 0.2,
  },
})

// Field mapping configuration for known sensor types
// Each field has expected min/max range and base frequency (Hz)
const FIELD_CONFIG = {
  temperatura: { min: 0, max: 50, baseFreq: 261.63 }, // C4
  humedad: { min: 0, max: 100, baseFreq: 329.63 }, // E4
  presion: { min: 90000, max: 105000, baseFreq: 392.0 }, // G4
  gas: { min: 0, max: 100000, baseFreq: 440.0 }, // A4
  altitud: { min: 0, max: 2000, baseFreq: 493.88 }, // B4
  infrarrojo: { min: 0, max: 1000, baseFreq: 523.25 }, // C5
  visible_ir: { min: 0, max: 1000, baseFreq: 587.33 }, // D5
}

// Fields to exclude from sonification (metadata)
const EXCLUDED_FIELDS = ['measurement', 'timestamp', '_time', '_measurement']

/**
 * Normalize a value to 0-1 range based on min/max bounds
 * @param {number} value - The value to normalize
 * @param {number} min - Minimum expected value
 * @param {number} max - Maximum expected value
 * @returns {number} Normalized value clamped between 0 and 1
 */
function normalizeValue(value, min, max) {
  const normalized = (value - min) / (max - min)
  return Math.max(0, Math.min(1, normalized)) // Clamp to [0, 1]
}

/**
 * Map a normalized value (0-1) to a frequency range
 * @param {number} normalized - Normalized value (0-1)
 * @param {number} baseFreq - Base frequency in Hz
 * @param {number} octaves - Number of octaves to span (default: 1)
 * @returns {number} Frequency in Hz
 */
function valueToFrequency(normalized, baseFreq, octaves = 1) {
  // Use exponential scaling for musical perception
  return baseFreq * Math.pow(2, normalized * octaves)
}

/**
 * Play InfluxDB fields as tones
 * @param {Object} fields - Dictionary of field names with its corresponding values
 *
 * Example:
 * playInfluxFields({
 *   "temperatura": 24.94,
 *   "humedad": 49.919,
 *   "presion": 93236,
 *   "gas": 63300
 * })
 */
export function playInfluxFields(fields) {
  if (!fields || typeof fields !== 'object') {
    return
  }

  const frequencies = []

  // Process each field in the data
  Object.entries(fields).forEach(([fieldName, value]) => {
    // Skip metadata fields
    if (EXCLUDED_FIELDS.includes(fieldName)) {
      return
    }

    // Skip non-numeric values
    if (typeof value !== 'number' || isNaN(value)) {
      return
    }

    // Get field configuration or use defaults for unknown fields
    const config = FIELD_CONFIG[fieldName] || {
      min: 0,
      max: 100,
      baseFreq: 220.0, // A3 as default
    }

    // Normalize value and map to frequency
    const normalized = normalizeValue(value, config.min, config.max)
    const frequency = valueToFrequency(normalized, config.baseFreq, 1)

    frequencies.push(frequency)
  })

  // Play all frequencies as a chord if we have any
  if (frequencies.length > 0) {
    polySynth.triggerAttackRelease(frequencies, '16n')
  }
}
