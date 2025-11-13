import { createContext, ReactNode, useState, useEffect, useContext } from 'react'
import { InfluxDBContext } from './InfluxDBContext'

interface FieldSelectionContextType {
  fieldKeys: string[]
  selectedFields: string[]
  isLoading: boolean
  error: string | null
  setError: (error: string | null) => void
  handleFieldToggle: (field: string) => void
  handleSelectAll: () => void
  handleDeselectAll: () => void
  startAgo: string
  setStartAgo: (value: string) => void
  measurement: string
  setMeasurement: (value: string) => void
}

export const FieldSelectionContext = createContext<FieldSelectionContextType | null>(null)

interface FieldSelectionProviderProps {
  children: ReactNode
}

export function FieldSelectionProvider({ children }: FieldSelectionProviderProps) {
  const influxContext = useContext(InfluxDBContext)
  if (!influxContext) {
    throw new Error('FieldSelectionProvider must be used within InfluxDBProvider')
  }
  const { client } = influxContext

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

  return (
    <FieldSelectionContext.Provider
      value={{
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
      }}
    >
      {children}
    </FieldSelectionContext.Provider>
  )
}

export const useFieldSelection = () => {
  const context = useContext(FieldSelectionContext)
  if (!context) {
    throw new Error('useFieldSelection must be used within FieldSelectionProvider')
  }
  return context
}
