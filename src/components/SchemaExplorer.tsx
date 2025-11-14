import { useInfluxDB } from '../contexts/useInfluxDB'
import { useFieldSelection } from '../contexts/useFieldSelection'
import { useConsole } from '../contexts/useConsole'

export function SchemaExplorer() {
  const influxClient = useInfluxDB()
  const { startAgo, measurement } = useFieldSelection()
  const { addConsoleOutput } = useConsole()

  const getInfluxSchemaAndTypes = async () => {
    try {
      addConsoleOutput('Fetching InfluxDB schema and types...', 'info')
      const schema = await influxClient.getInfluxSchemaAndTypes({ start: startAgo })
      console.log('schema:', schema)
      addConsoleOutput('Schema retrieved successfully:', 'success')
      addConsoleOutput(JSON.stringify(schema, null, 2), 'info')
    } catch (err) {
      addConsoleOutput(`Failed to get schema: ${err instanceof Error ? err.message : String(err)}`, 'error')
    }
  }

  const getFieldKeys = async () => {
    try {
      addConsoleOutput('Fetching field keys...', 'info')
      const schema = await influxClient.getFieldKeys({ measurement })
      console.log('getFieldKeys:', schema)
      addConsoleOutput('Field keys retrieved successfully:', 'success')
      addConsoleOutput(`Fields: ${schema.join(', ')}`, 'info')
    } catch (err) {
      addConsoleOutput(`Failed to get field keys: ${err instanceof Error ? err.message : String(err)}`, 'error')
    }
  }

  const getTagKeys = async () => {
    try {
      addConsoleOutput('Fetching tag keys...', 'info')
      const tags = await influxClient.getTagKeys({ measurement })
      console.log('getTagKeys:', tags)
      addConsoleOutput('Tag keys retrieved successfully:', 'success')
      addConsoleOutput(`Tags: ${tags.join(', ')}`, 'info')
    } catch (err) {
      addConsoleOutput(`Failed to get tag keys: ${err instanceof Error ? err.message : String(err)}`, 'error')
    }
  }

  const getMeasurementTypes = async () => {
    try {
      addConsoleOutput('Fetching measurement types...', 'info')
      const types = await influxClient.getMeasurementTypes({ measurement, start: startAgo })
      console.log('getMeasurementTypes:', types)
      addConsoleOutput('Measurement types retrieved successfully:', 'success')
      addConsoleOutput(JSON.stringify(types, null, 2), 'info')
    } catch (err) {
      addConsoleOutput(`Failed to get measurement types: ${err instanceof Error ? err.message : String(err)}`, 'error')
    }
  }

  return (
    <div className='section-container'>
      <div className='section-title'>🔎 Explore influxDb schema</div>
      <div className='button-group'>
        <button onClick={getInfluxSchemaAndTypes}>Get schema and types</button>
        <button onClick={getFieldKeys}>Get field keys</button>
        <button onClick={getTagKeys}>Get tag keys</button>
        <button onClick={getMeasurementTypes}>Get measurement types</button>
      </div>
    </div>
  )
}
