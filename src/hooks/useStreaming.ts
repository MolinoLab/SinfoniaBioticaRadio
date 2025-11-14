import { useState, useRef } from 'react'
import { streamFields, streamIterateRows } from '../libs/radio'
import { playInfluxFields, playInfluxMidi } from '../libs/tone'

import { useInfluxDB } from '../contexts/useInfluxDB'
import { useFieldSelection } from '../contexts/useFieldSelection'
import { useConsole } from '../contexts/useConsole'

export const useStreaming = () => {
  const influxClient = useInfluxDB()
  const { selectedFields, startAgo, measurement, setError, deviceTag, selectedTagValues } = useFieldSelection()
  const { addConsoleOutput } = useConsole()
  const [isStreaming, setIsStreaming] = useState(false)
  const [isMidiStreaming, setIsMidiStreaming] = useState(false)
  const stopSignalRef = useRef(false)
  const stopMidiSignalRef = useRef(false)

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
    await startStream(
      setIsMidiStreaming,
      stopMidiSignalRef,
      (rowsFieldValues, row) => {
        console.log(new Date(row._time).toLocaleString(), rowsFieldValues)

        // Extract first 3 field values for MIDI parameters
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

  const stopStreaming = () => {
    stopSignalRef.current = true
    addConsoleOutput('Stopping audio stream...', 'info')
  }

  const stopMidiStreaming = () => {
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
  }
}
