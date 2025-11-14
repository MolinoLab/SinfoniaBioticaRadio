# Plan 1: Timeline MIDI Streaming

## Descripción

Modificar la funcionalidad de "stream midi radio" para que en lugar de reproducir todas las notas inmediatamente al recibirlas de la base de datos, acumule todos los datos primero y luego genere un timeline basado en el campo `_time` de InfluxDB. La reproducción debe comenzar desde la primera nota y mantener los silencios reales entre notas según los timestamps, creando una melodía que dure el tiempo total que corresponde según los datos históricos.

## Archivos a modificar

### `src/hooks/useStreaming.ts`
- **Función `startMidiStreaming`**: Cambiar la lógica para acumular todas las filas en un array antes de reproducir, en lugar de llamar a `playInfluxMidi` inmediatamente en el callback `onRow`.
- **Nueva función `scheduleMidiTimeline`**: Crear función que reciba el array acumulado de datos, calcule los tiempos relativos basados en `_time`, y programe las notas usando Tone.js con los tiempos correctos.

### `src/libs/tone.js`
- **Nueva función `scheduleMidiNotes`**: Crear función que reciba un array de objetos con `{ timestamp, midiNote, duration, velocity }` y programe cada nota usando `Tone.Transport` o `Tone.now()` con tiempos relativos calculados desde el primer timestamp.
- **Modificar `playInfluxMidi`**: Opcionalmente, hacer que acepte un parámetro de tiempo programado además del tiempo inmediato.

## Algoritmo paso a paso

### Fase 1: Acumulación de datos
1. En `startMidiStreaming`, en lugar de llamar a `playInfluxMidi` en el callback `onRow`, acumular cada fila en un array `midiData`.
2. Cada elemento del array debe contener: `{ timestamp: row._time, values: Object.values(rowsFieldValues) }`.
3. Continuar acumulando hasta que `streamFields` complete o se detenga.

### Fase 2: Procesamiento del timeline
1. Una vez completada la acumulación, procesar el array `midiData`.
2. Convertir el primer timestamp a tiempo base (t0 = 0).
3. Para cada elemento subsiguiente, calcular el tiempo relativo: `relativeTime = (timestamp - firstTimestamp) / 1000` (convertir de milisegundos a segundos si es necesario).
4. Extraer los primeros 3 valores de cada fila como: `midiNote = values[0]`, `duration = values[1]`, `velocity = values[2]`.
5. Validar que haya al menos 3 valores antes de procesar cada nota.

### Fase 3: Programación de notas con Tone.js
1. Iniciar `Tone.Transport` si no está iniciado, o usar `Tone.now()` como referencia temporal.
2. Para cada nota en el timeline:
   - Calcular el tiempo absoluto: `absoluteTime = Tone.now() + relativeTime`.
   - Programar la nota usando `synth.triggerAttackRelease(midiNote, duration, absoluteTime, velocity)`.
3. Si se usa `Tone.Transport`, iniciar el transporte después de programar todas las notas.
4. Si se usa `Tone.now()`, las notas se programarán automáticamente según sus tiempos calculados.

### Fase 4: Manejo de detención
1. Mantener referencia a las notas programadas para poder cancelarlas si el usuario detiene el streaming.
2. Al detener, cancelar todas las notas programadas pendientes y detener `Tone.Transport` si se está usando.

## Consideraciones técnicas

- El campo `_time` de InfluxDB viene en formato ISO 8601 o timestamp. Necesitar conversión a milisegundos JavaScript si es necesario.
- Tone.js requiere que el contexto de audio esté iniciado antes de programar notas. Usar `Tone.start()` si es necesario.
- Los tiempos relativos deben calcularse correctamente considerando que los datos pueden venir ordenados pero con gaps temporales variables.
- La duración total de la melodía será: `(lastTimestamp - firstTimestamp)` en segundos.
- Manejar casos donde los datos tengan timestamps duplicados o muy cercanos (mínimo tiempo entre notas).
