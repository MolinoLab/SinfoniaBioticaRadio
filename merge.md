# Análisis de diferencias y plan de integración

## 📊 Resumen ejecutivo

**Estado actual (después del pull):**
- ✅ Usa `streamIterateRows` con streaming eficiente (mejor que `streamFields`)
- ❌ Reproduce notas inmediatamente sin respetar timestamps históricos
- ❌ `playInfluxMidi` tiene código hardcodeado y no usa los parámetros correctamente
- ❌ Botón solo funciona durante streaming, no durante reproducción
- ❌ Valores por defecto: `environment` y `-720h`

**Cambios propuestos (changes.md):**
- ✅ Implementa timeline MIDI completo con acumulación de datos
- ✅ Respeta timestamps históricos de InfluxDB
- ✅ Botón mejorado que funciona durante streaming y reproducción
- ✅ Valores por defecto: `midi` y `-24h`
- ✅ Oscilador sinusoidal para sonido más suave
- ⚠️ Usa `streamFields` (menos eficiente que `streamIterateRows`)

---

## 🔍 Comparación detallada por archivo

### 1. `src/hooks/useStreaming.ts`

#### **Versión actual (GitHub):**
```typescript
// Usa streamIterateRows (más eficiente)
import { streamFields, streamIterateRows } from '../libs/radio'
import { playInfluxFields, playInfluxMidi } from '../libs/tone'

const startMidiStreaming = async () => {
  await startStream(
    setIsMidiStreaming,
    stopMidiSignalRef,
    (rowsFieldValues, row) => {
      // Reproduce inmediatamente
      const values = Object.values(rowsFieldValues)
      if (values.length >= 3) {
        const midiNote = values[0]
        const duration = values[1]
        const velocity = values[2]
        playInfluxMidi(midiNote, duration, velocity)
      }
    },
    'MIDI'
  )
}
```

**Características:**
- ✅ Usa `streamIterateRows` (streaming eficiente, bajo consumo de memoria)
- ❌ Reproduce notas inmediatamente sin respetar timestamps
- ❌ No acumula datos antes de reproducir
- ❌ No calcula tiempos relativos

#### **Versión propuesta (changes.md):**
```typescript
// Usa streamFields (menos eficiente)
import { streamFields } from '../libs/radio'
import { playInfluxFields, scheduleMidiNotes, cancelScheduledMidiNotes } from '../libs/tone'

const [isMidiPlaying, setIsMidiPlaying] = useState(false)
const midiPlaybackTimeoutRef = useRef<number | null>(null)

const startMidiStreaming = async () => {
  const midiData: Array<{ timestamp: string | Date; values: number[] }> = []
  
  await startStream(
    setIsMidiStreaming,
    stopMidiSignalRef,
    (rowsFieldValues, row) => {
      // Acumula datos
      const values = Object.values(rowsFieldValues)
      if (values.length >= 3) {
        midiData.push({
          timestamp: row._time,
          values: values,
        })
      }
    },
    'MIDI'
  )
  
  // Procesa timeline después de acumular
  if (midiData.length > 0) {
    setIsMidiPlaying(true)
    await scheduleMidiTimeline(midiData)
  }
}
```

**Características:**
- ✅ Acumula datos antes de reproducir
- ✅ Calcula tiempos relativos basados en `_time`
- ✅ Respeta timestamps históricos
- ✅ Estado `isMidiPlaying` para rastrear reproducción
- ❌ Usa `streamFields` (menos eficiente)

#### **Análisis:**
- **Funcionalidad:** La versión propuesta es **superior** porque implementa el timeline MIDI completo
- **Eficiencia:** La versión actual es **superior** porque usa `streamIterateRows`
- **Solución:** Combinar lo mejor de ambas: usar `streamIterateRows` + acumulación de datos

---

### 2. `src/libs/tone.js`

#### **Versión actual (GitHub):**
```javascript
export function playInfluxMidi(midiNumber, duration, velocity) {
  // PROBLEMA: Código hardcodeado, no usa los parámetros
  const now = Tone.now()
  const lookAhead = 0.1
  
  polySynth.triggerAttackRelease('C4', '8n', now + lookAhead)
  polySynth.triggerAttackRelease('E4', '8n', now + lookAhead + 0.5)
  // ... más notas hardcodeadas
  
  // Los parámetros midiNumber, duration, velocity NO se usan
}

// PolySynth con maxPolyphony: 12
const polySynth = new Tone.PolySynth(Tone.Synth, { maxPolyphony: 12 }).toDestination()
polySynth.set({
  envelope: {
    attack: 0.05,
    decay: 0.1,
    sustain: 0.3,
    release: 0.2,
  },
})
```

**Características:**
- ✅ PolySynth configurado correctamente
- ✅ maxPolyphony: 12 para múltiples notas
- ❌ `playInfluxMidi` tiene código hardcodeado
- ❌ No usa los parámetros recibidos
- ❌ No hay función para programar notas con tiempos relativos

#### **Versión propuesta (changes.md):**
```javascript
// Nueva función para timeline
export async function scheduleMidiNotes(notes) {
  await Tone.start()
  
  if (!timelineSynth) {
    const synthOptions = {
      oscillator: {
        type: 'sine' // Sinusoidal para sonido suave
      },
      envelope: {
        attack: 0.1,
        decay: 0.2,
        sustain: 0.5,
        release: 0.3,
      },
    }
    
    timelineSynth = new Tone.PolySynth(Tone.Synth).toDestination()
    timelineSynth.set(synthOptions)
  }
  
  const baseTime = Tone.now()
  for (const note of notes) {
    const absoluteTime = baseTime + note.relativeTime
    timelineSynth.triggerAttackRelease(note.midiNote, note.duration, absoluteTime, note.velocity)
  }
}

export function cancelScheduledMidiNotes() {
  if (timelineSynth) {
    timelineSynth.releaseAll()
  }
}
```

**Características:**
- ✅ Función `scheduleMidiNotes` para programar notas con tiempos relativos
- ✅ Función `cancelScheduledMidiNotes` para detener reproducción
- ✅ Oscilador sinusoidal para sonido más suave
- ✅ Usa parámetros correctamente
- ⚠️ Crea un synth separado (`timelineSynth`) en lugar de reutilizar `polySynth`

#### **Análisis:**
- **Funcionalidad:** La versión propuesta es **superior** porque implementa programación de notas con tiempos relativos
- **Arquitectura:** La versión actual tiene `polySynth` global, la propuesta crea `timelineSynth` separado
- **Solución:** Mantener `polySynth` global pero agregar las funciones nuevas y usar oscilador sinusoidal

---

### 3. `src/components/RadioPlayer.tsx`

#### **Versión actual (GitHub):**
```typescript
<button
  onClick={isMidiStreaming ? stopMidiStreaming : startMidiStreaming}
  disabled={!isMidiStreaming && selectedFields.length === 0}
>
  {isMidiStreaming ? '⏹️ Stop midi' : '▶️ Stream midi radio'}
</button>
```

**Características:**
- ✅ Funciona durante streaming
- ❌ No funciona durante reproducción del timeline
- ❌ No puede detener la reproducción una vez iniciada

#### **Versión propuesta (changes.md):**
```typescript
<button
  onClick={isMidiStreaming || isMidiPlaying ? stopMidiStreaming : startMidiStreaming}
  disabled={!isMidiStreaming && !isMidiPlaying && selectedFields.length === 0}
>
  {isMidiStreaming || isMidiPlaying ? '⏹️ Stop midi' : '▶️ Stream midi radio'}
</button>
```

**Características:**
- ✅ Funciona durante streaming
- ✅ Funciona durante reproducción del timeline
- ✅ Puede detener la reproducción

#### **Análisis:**
- **Funcionalidad:** La versión propuesta es **claramente superior**
- **Solución:** Aplicar cambios directamente

---

### 4. `src/libs/radio.js`

#### **Versión actual (GitHub):**
```javascript
// Nueva función más eficiente
export const streamIterateRows = async (influxClient, fields, options = {}) => {
  const {
    start = '-1h',
    measurement = 'environment',
    // ...
  } = options
  
  // Usa queryIterateRows para streaming eficiente
  for await (const { values, tableMeta } of influxClient.queryIterateRows(sampleQuery)) {
    // Procesa fila por fila sin cargar todo en memoria
    const row = tableMeta.toObject(values)
    if (onRow) {
      onRow(rowsFieldValues, row)
    }
  }
}
```

**Características:**
- ✅ `streamIterateRows` usa `queryIterateRows` (streaming eficiente)
- ✅ No carga todos los datos en memoria
- ✅ Valores por defecto: `-1h` y `environment`
- ⚠️ Tiene delay entre filas (`delayMs`)

#### **Versión propuesta (changes.md):**
```javascript
// Función antigua menos eficiente
export const streamFields = async (influxClient, fields, options = {}) => {
  const {
    start = '-24h',
    measurement = 'midi',
    // ...
  } = options
  
  // Usa queryStream (carga más datos en memoria)
  await influxClient.queryStream(sampleQuery, (row) => {
    if (onRow) {
      onRow(rowsFieldValues, row)
    }
  })
}
```

**Características:**
- ✅ Valores por defecto: `-24h` y `midi` (mejores para el caso de uso)
- ❌ Usa `queryStream` (menos eficiente)
- ❌ Carga más datos en memoria

#### **Análisis:**
- **Eficiencia:** La versión actual es **superior** (usa `streamIterateRows`)
- **Valores por defecto:** La versión propuesta es **superior** (`midi` y `-24h`)
- **Solución:** Mantener `streamIterateRows` pero actualizar valores por defecto

---

### 5. `src/contexts/useFieldSelection.ts`

#### **Versión actual (GitHub):**
```typescript
const [startAgo, setStartAgo] = useState('-720h')
const [measurement, setMeasurement] = useState()
```

#### **Versión propuesta (changes.md):**
```typescript
const [startAgo, setStartAgo] = useState('-24h')
const [measurement, setMeasurement] = useState('midi')
```

#### **Análisis:**
- **Valores por defecto:** La versión propuesta es **superior** para el caso de uso MIDI
- **Solución:** Aplicar cambios directamente

---

### 6. `src/components/TimeRangeConfig.tsx`

#### **Versión actual (GitHub):**
```typescript
placeholder='environment'
placeholder='-720h'
<div>The measurement name to query from InfluxDB. Default: environment</div>
```

#### **Versión propuesta (changes.md):**
```typescript
placeholder='midi'
placeholder='-24h'
<div>The measurement name to query from InfluxDB. Default: midi</div>
```

#### **Análisis:**
- **Consistencia:** La versión propuesta es **superior** (consistente con valores por defecto)
- **Solución:** Aplicar cambios directamente

---

## 🎯 Plan de integración recomendado

### **Estrategia: Combinar lo mejor de ambas versiones**

#### **1. `src/hooks/useStreaming.ts`**
- ✅ **Mantener:** Uso de `streamIterateRows` (más eficiente)
- ✅ **Agregar:** Acumulación de datos antes de reproducir
- ✅ **Agregar:** Función `scheduleMidiTimeline` para procesar timeline
- ✅ **Agregar:** Estado `isMidiPlaying` y `midiPlaybackTimeoutRef`
- ✅ **Agregar:** Lógica mejorada en `stopMidiStreaming`

#### **2. `src/libs/tone.js`**
- ✅ **Mantener:** `polySynth` global existente
- ✅ **Agregar:** Función `scheduleMidiNotes` para programar notas con tiempos relativos
- ✅ **Agregar:** Función `cancelScheduledMidiNotes` para detener reproducción
- ✅ **Mejorar:** `playInfluxMidi` para que use los parámetros correctamente (opcional, ya que se usará `scheduleMidiNotes`)
- ✅ **Agregar:** Opción de oscilador sinusoidal en el synth del timeline

#### **3. `src/components/RadioPlayer.tsx`**
- ✅ **Aplicar:** Cambios para usar `isMidiPlaying` además de `isMidiStreaming`

#### **4. `src/libs/radio.js`**
- ✅ **Mantener:** `streamIterateRows` (función eficiente)
- ✅ **Actualizar:** Valores por defecto a `-24h` y `midi` en `streamIterateRows`

#### **5. `src/contexts/useFieldSelection.ts`**
- ✅ **Aplicar:** Cambios de valores por defecto a `-24h` y `'midi'`

#### **6. `src/components/TimeRangeConfig.tsx`**
- ✅ **Aplicar:** Cambios de placeholders y texto de ayuda

---

## 📋 Resumen de decisiones

### **¿Cuál versión es mejor?**

**Respuesta:** Necesitamos **combinar ambas versiones** porque:

1. **Versión actual (GitHub) es mejor en:**
   - ✅ Eficiencia de streaming (`streamIterateRows`)
   - ✅ Arquitectura de synth (`polySynth` global)

2. **Versión propuesta (changes.md) es mejor en:**
   - ✅ Funcionalidad de timeline MIDI completo
   - ✅ Respeta timestamps históricos
   - ✅ Botón mejorado para detener reproducción
   - ✅ Valores por defecto más apropiados (`midi` y `-24h`)
   - ✅ Oscilador sinusoidal para sonido suave

### **Plan de acción:**

1. **Mantener** la eficiencia de `streamIterateRows` de GitHub
2. **Agregar** la funcionalidad de timeline MIDI de changes.md
3. **Actualizar** valores por defecto según changes.md
4. **Mejorar** el botón según changes.md
5. **Agregar** funciones de programación de notas según changes.md

---

## ✅ Checklist de integración

- [ ] Modificar `useStreaming.ts` para usar `streamIterateRows` + acumulación
- [ ] Agregar función `scheduleMidiTimeline` en `useStreaming.ts`
- [ ] Agregar estado `isMidiPlaying` y `midiPlaybackTimeoutRef`
- [ ] Mejorar función `stopMidiStreaming` para detener reproducción
- [ ] Agregar función `scheduleMidiNotes` en `tone.js`
- [ ] Agregar función `cancelScheduledMidiNotes` en `tone.js`
- [ ] Configurar oscilador sinusoidal en synth del timeline
- [ ] Actualizar `RadioPlayer.tsx` para usar `isMidiPlaying`
- [ ] Actualizar valores por defecto en `useFieldSelection.ts`
- [ ] Actualizar valores por defecto en `streamIterateRows` (radio.js)
- [ ] Actualizar placeholders en `TimeRangeConfig.tsx`
- [ ] Probar funcionalidad completa del timeline MIDI
- [ ] Verificar que el botón Stop funciona correctamente

---

**Conclusión:** La mejor solución es integrar la funcionalidad de timeline MIDI de changes.md con la eficiencia de streaming de la versión actual de GitHub. Esto nos dará lo mejor de ambos mundos: funcionalidad completa + eficiencia.

