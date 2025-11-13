import { useState, useRef } from 'react'
import { streamFields } from '../libs/radio'
import { playInfluxFields } from '../libs/tone'

import { useInfluxDB } from '../contexts/useInfluxDB'
import { useFieldSelection } from '../contexts/useFieldSelection'
import { useConsole } from '../contexts/useConsole'

export function useStreaming() {
  const influxClient = useInfluxDB()
  const { selectedFields, startAgo, measurement, setError } = useFieldSelection()
  const { addConsoleOutput } = useConsole()
  const [isStreaming, setIsStreaming] = useState(false)
  const stopSignalRef = useRef(false)

  const startStreaming = async () => {
    try {
      setError(null)

      if (selectedFields.length === 0) {
        setError('Please select at least one field to stream measurements.')
        addConsoleOutput('Cannot stream: No fields selected', 'error')
        return
      }

      // Reset stop signal and start streaming
      stopSignalRef.current = false
      setIsStreaming(true)

      addConsoleOutput(`Starting stream for ${selectedFields.length} fields: ${selectedFields.join(', ')}`, 'info')
      console.log(`Streaming ${selectedFields.length} selected fields:`, selectedFields)

      const res = await streamFields(influxClient, selectedFields, {
        start: startAgo,
        measurement,
        onRow: (rowsFieldValues, row) => {
          console.log(new Date(row._time).toLocaleString(), rowsFieldValues)
          playInfluxFields(rowsFieldValues)
        },
        shouldStop: () => stopSignalRef.current,
      })

      console.log('Stream result:', res)

      // Log final summary
      const wasStopped = stopSignalRef.current
      if (wasStopped) {
        addConsoleOutput(`Stream stopped by user. Processed ${res.totalRows} rows.`, 'info')
      } else {
        addConsoleOutput(`Stream completed. Total rows: ${res.totalRows}`, 'success')
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
      setIsStreaming(false)
    }
  }

  const stopStreaming = () => {
    stopSignalRef.current = true
    addConsoleOutput('Stopping stream...', 'info')
  }

  return {
    isStreaming,
    startStreaming,
    stopStreaming,
  }
}
