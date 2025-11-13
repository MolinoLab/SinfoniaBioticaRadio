import { useFieldSelection } from '../contexts/FieldSelectionContext'
import { useConsole } from '../contexts/ConsoleContext'
import { useInfluxDB } from '../contexts/InfluxDBContext'

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

  return (
    <div className='section-container'>
      <div className='section-title'>🔎 Explore influxDb schema</div>
      <div className='button-group'>
        <button onClick={getInfluxSchemaAndTypes}>Get schema and types</button>
        <button onClick={getFieldKeys}>Get field keys</button>
      </div>
    </div>
  )
}
