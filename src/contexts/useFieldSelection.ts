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
  const [measurement, setMeasurement] = useState()
  const [fieldKeys, setFieldKeys] = useState<string[]>([])
  const [selectedFields, setSelectedFields] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Tag filtering state
  const deviceTag = import.meta.env.DEVICE_TAG
  const [tagValues, setTagValues] = useState<string[]>([])
  const [selectedTagValues, setSelectedTagValues] = useState<string[]>([])
  const [isLoadingTags, setIsLoadingTags] = useState(true)

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

  // Load tag values when measurement changes
  useEffect(() => {
    const loadTagValues = async () => {
      try {
        setIsLoadingTags(true)
        const values = await client.getTagValues(deviceTag)
        if (values.length === 0) {
          setTagValues([])
          setSelectedTagValues([])
        } else {
          setTagValues(values)
          // Select all tag values by default
          setSelectedTagValues(values)
        }
      } catch (err) {
        console.error(`Failed to load tag values for '${deviceTag}':`, err)
        setTagValues([])
        setSelectedTagValues([])
      } finally {
        setIsLoadingTags(false)
      }
    }

    loadTagValues()
  }, [client, measurement, deviceTag])

  const handleFieldToggle = (field: string) => {
    setSelectedFields((prev) => (prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]))
  }

  const handleSelectAll = () => {
    setSelectedFields(fieldKeys)
  }

  const handleDeselectAll = () => {
    setSelectedFields([])
  }

  const handleTagValueToggle = (tagValue: string) => {
    setSelectedTagValues((prev) => (prev.includes(tagValue) ? prev.filter((v) => v !== tagValue) : [...prev, tagValue]))
  }

  const handleSelectAllTagValues = () => {
    setSelectedTagValues(tagValues)
  }

  const handleDeselectAllTagValues = () => {
    setSelectedTagValues([])
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
    deviceTag,
    tagValues,
    selectedTagValues,
    isLoadingTags,
    handleTagValueToggle,
    handleSelectAllTagValues,
    handleDeselectAllTagValues,
  }
}
