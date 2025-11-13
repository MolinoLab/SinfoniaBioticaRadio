import { useInfluxDB } from './useInfluxDB'
import { createContext, useContext, useEffect, useState } from 'react'

export const FieldSelectionContext = createContext<ReturnType<typeof useFieldSelection> | null>(null)

export const useFieldSelection = () => {
  const context = useContext(FieldSelectionContext)
  if (!context) {
    throw new Error('useFieldSelection must be used within FieldSelectionProvider')
  }
  return context
}

export const useFieldSelectionProvider = () => {
  const client = useInfluxDB()

  const [startAgo, setStartAgo] = useState('-720h')
  const [measurement, setMeasurement] = useState('environment')
  const [fieldKeys, setFieldKeys] = useState<string[]>([])
  const [selectedFields, setSelectedFields] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load field keys when measurement changes
  useEffect(() => {
    const loadFieldKeys = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const fields = await client.getFieldKeys({ measurement })

        if (fields.length === 0) {
          setError('No fields found in the database. Please check your InfluxDB connection and data.')
          setFieldKeys([])
        } else {
          setFieldKeys(fields)
          // Select all fields by default
          setSelectedFields(fields)
        }
      } catch (err) {
        setError(`Failed to load field keys: ${err instanceof Error ? err.message : String(err)}`)
        setFieldKeys([])
      } finally {
        setIsLoading(false)
      }
    }

    loadFieldKeys()
  }, [client, measurement])

  const handleFieldToggle = (field: string) => {
    setSelectedFields((prev) => (prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]))
  }

  const handleSelectAll = () => {
    setSelectedFields(fieldKeys)
  }

  const handleDeselectAll = () => {
    setSelectedFields([])
  }

  return {
    fieldKeys,
    selectedFields,
    isLoading,
    error,
    setError,
    handleFieldToggle,
    handleSelectAll,
    handleDeselectAll,
    startAgo,
    setStartAgo,
    measurement,
    setMeasurement,
  }
}
