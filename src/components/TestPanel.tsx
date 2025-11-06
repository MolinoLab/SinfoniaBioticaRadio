import { playTone } from '../libs/tone'
import { useInfluxDB } from '../contexts/InfluxDBContext'
import { useFieldSelection } from '../contexts/FieldSelectionContext'
import { useConsole } from '../contexts/ConsoleContext'

export function TestPanel() {
  const influxClient = useInfluxDB()
  const { startAgo } = useFieldSelection()
  const { addConsoleOutput } = useConsole()

  const stream = async () => {
    try {
      addConsoleOutput('Streaming results from InfluxDB...', 'info')
      let rowCount = 0
      await influxClient.queryStream(`from(bucket: $bucket) |> range(start: ${startAgo})`, (row) => {
        rowCount++
        console.log('Row:', row)
      })
      addConsoleOutput(`Stream completed. Received ${rowCount} rows.`, 'success')
    } catch (err) {
      addConsoleOutput(`Stream failed: ${err instanceof Error ? err.message : String(err)}`, 'error')
    }
  }

  const query = async () => {
    try {
      addConsoleOutput('Querying InfluxDB...', 'info')
      const results = await influxClient.query(`
  from(bucket: $bucket)
    |> range(start: ${startAgo})
`)
      console.log(results)
      addConsoleOutput(`Query completed. Found ${results.length} results.`, 'success')
      addConsoleOutput(JSON.stringify(results.slice(0, 3), null, 2), 'info')
    } catch (err) {
      addConsoleOutput(`Query failed: ${err instanceof Error ? err.message : String(err)}`, 'error')
    }
  }

  return (
    <div className='section-container'>
      <div className='section-title'>🗒 Tests</div>
      <div className='button-group'>
        <button onClick={playTone}>Tonejs</button>
        <button onClick={stream}>Stream influx</button>
        <button onClick={query}>Query influx</button>
      </div>
    </div>
  )
}
