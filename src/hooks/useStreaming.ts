import { useState, useRef } from 'react'
import { streamFields, streamIterateRows } from '../libs/radio'
import { playInfluxFields, scheduleMidiNotes, cancelScheduledMidiNotes } from '../libs/tone'

import { useInfluxDB } from '../contexts/useInfluxDB'
import { useFieldSelection } from '../contexts/useFieldSelection'
import { useConsole } from '../contexts/useConsole'

export const useStreaming = () => {
  const influxClient = useInfluxDB()
  const { selectedFields, startAgo, measurement, setError, deviceTag, selectedTagValues } = useFieldSelection()
  const { addConsoleOutput } = useConsole()
  const [isStreaming, setIsStreaming] = useState(false)
  const [isMidiStreaming, setIsMidiStreaming] = useState(false)
  const [isMidiPlaying, setIsMidiPlaying] = useState(false)
  const stopSignalRef = useRef(false)
  const stopMidiSignalRef = useRef(false)
  const scheduledNotesRef = useRef<any[]>([])
  const midiPlaybackTimeoutRef = useRef<number | null>(null)

  // Shared streaming logic for both audio and MIDI streams
  const startStream = async (
    setStreamingState: (state: boolean) => void,
    stopSignal: React.MutableRefObject<boolean>,
    onRowCallback: (rowsFieldValues: Record<string, number>, row: any) => void,
    streamType: string
  ) => {
    try {
      setError(null)

      if (selectedFields.length === 0) {
        setError('Please select at least one field to stream measurements.')
        addConsoleOutput('Cannot stream: No fields selected', 'error')
        return
      }

      // Reset stop signal and start streaming
      stopSignal.current = false
      setStreamingState(true)

      addConsoleOutput(
        `Starting ${streamType} stream for ${selectedFields.length} fields: ${selectedFields.join(', ')}`,
        'info'
      )
      console.log(`Streaming ${selectedFields.length} selected fields (${streamType}):`, selectedFields)

      const res = await streamIterateRows(influxClient, selectedFields, {
        start: startAgo,
        measurement,
        tagKey: deviceTag,
        tagValues: selectedTagValues,
        onRow: onRowCallback,
        shouldStop: () => stopSignal.current,
      })

      console.log(`${streamType} stream result:`, res)

      // Log final summary
      const wasStopped = stopSignal.current
      if (wasStopped) {
        addConsoleOutput(`${streamType} stream stopped by user. Processed ${res.totalRows} rows.`, 'info')
      } else {
        addConsoleOutput(`${streamType} stream completed. Total rows: ${res.totalRows}`, 'success')
      }

      // Show breakdown by field
      for (const field in res.rowsByField) {
        if (res.rowsByField[field] > 0) {
          addConsoleOutput(`  ${field}: ${res.rowsByField[field]} rows`, 'info')
        }
      }
    } catch (err) {
      const errorMsg = `Failed to stream measurements: ${err instanceof Error ? err.message : String(err)}`
      setError(errorMsg)
      addConsoleOutput(errorMsg, 'error')
    } finally {
      setStreamingState(false)
    }
  }

  const startStreaming = async () => {
    await startStream(
      setIsStreaming,
      stopSignalRef,
      (rowsFieldValues, row) => {
        console.log(new Date(row._time).toLocaleString(), rowsFieldValues)
        playInfluxFields(rowsFieldValues)
      },
      'audio'
    )
  }

  const startMidiStreaming = async () => {
    // Array para acumular todos los datos MIDI
    const midiData: Array<{ timestamp: string | Date; values: number[] }> = []

    await startStream(
      setIsMidiStreaming,
      stopMidiSignalRef,
      (rowsFieldValues, row) => {
        console.log(new Date(row._time).toLocaleString(), rowsFieldValues)

        // Acumular datos en lugar de reproducir inmediatamente
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

    // Si se detuvo manualmente, no procesar el timeline
    if (stopMidiSignalRef.current) {
      addConsoleOutput('MIDI stream stopped before timeline processing', 'info')
      return
    }

    // Procesar el timeline solo si hay datos acumulados
    if (midiData.length > 0) {
      addConsoleOutput(`Processing MIDI timeline with ${midiData.length} notes...`, 'info')
      setIsMidiPlaying(true)
      await scheduleMidiTimeline(midiData)
    } else {
      addConsoleOutput('No MIDI data to process', 'info')
    }
  }

  const scheduleMidiTimeline = async (midiData: Array<{ timestamp: string | Date; values: number[] }>) => {
    // Convertir el primer timestamp a tiempo base (t0 = 0)
    const firstTimestamp = new Date(midiData[0].timestamp).getTime()
    
    // Procesar cada elemento y calcular tiempos relativos
    const notesToSchedule: Array<{ relativeTime: number; midiNote: number; duration: number; velocity: number }> = []
    
    for (const data of midiData) {
      const timestamp = new Date(data.timestamp).getTime()
      const relativeTime = (timestamp - firstTimestamp) / 1000 // Convertir de milisegundos a segundos
      
      // Extraer los primeros 3 valores
      const [midiNote, duration, velocity] = data.values
      
      // Validar que haya al menos 3 valores
      if (data.values.length >= 3 && typeof midiNote === 'number' && typeof duration === 'number' && typeof velocity === 'number') {
        notesToSchedule.push({
          relativeTime,
          midiNote,
          duration,
          velocity,
        })
      }
    }

    // Programar las notas usando Tone.js
    if (notesToSchedule.length > 0) {
      const totalDuration = notesToSchedule[notesToSchedule.length - 1].relativeTime + notesToSchedule[notesToSchedule.length - 1].duration
      addConsoleOutput(`Scheduling ${notesToSchedule.length} notes. Total duration: ${totalDuration.toFixed(2)}s`, 'info')
      
      scheduledNotesRef.current = await scheduleMidiNotes(notesToSchedule)
      addConsoleOutput('MIDI timeline playback started', 'success')
      
      // Limpiar timeout anterior si existe
      if (midiPlaybackTimeoutRef.current) {
        clearTimeout(midiPlaybackTimeoutRef.current)
      }
      
      // Actualizar estado cuando termine la reproducción
      midiPlaybackTimeoutRef.current = window.setTimeout(() => {
        setIsMidiPlaying(false)
        addConsoleOutput('MIDI timeline playback completed', 'success')
        midiPlaybackTimeoutRef.current = null
      }, totalDuration * 1000 + 500) // +500ms de margen
    } else {
      setIsMidiPlaying(false)
    }
  }

  const stopStreaming = () => {
    stopSignalRef.current = true
    addConsoleOutput('Stopping audio stream...', 'info')
  }

  const stopMidiStreaming = () => {
    // Si está reproduciéndose el timeline, detenerlo
    if (isMidiPlaying) {
      cancelScheduledMidiNotes()
      scheduledNotesRef.current = []
      setIsMidiPlaying(false)
      
      // Limpiar timeout de finalización
      if (midiPlaybackTimeoutRef.current) {
        clearTimeout(midiPlaybackTimeoutRef.current)
        midiPlaybackTimeoutRef.current = null
      }
      
      addConsoleOutput('MIDI playback stopped', 'info')
      return
    }
    
    // Si está haciendo streaming de datos, detenerlo
    stopMidiSignalRef.current = true
    addConsoleOutput('Stopping MIDI stream...', 'info')
  }

  return {
    isStreaming,
    startStreaming,
    stopStreaming,
    isMidiStreaming,
    startMidiStreaming,
    stopMidiStreaming,
    isMidiPlaying,
  }
}
