import './App.css'
import { playTone } from './libs/tone'
import InfluxDBClient from './libs/influxDb'

const START_AGO = '-720h'

function App() {
  // Initialize the client
  const influxClient = new InfluxDBClient({
    url: import.meta.env.INFLUX_URL,
    token: import.meta.env.INFLUX_TOKEN,
    org: import.meta.env.INFLUX_ORG,
    bucket: import.meta.env.INFLUX_BUCKET,
    timeout: 10000, // optional
  })

  const stream = async () => {
    console.log('Streaming results from InfluxDB...')
    await influxClient.queryStream(`from(bucket: $bucket) |> range(start: ${START_AGO})`, (row) => {
      console.log('Row:', row)
    })
  }

  const getInfluxSchema = async () => {
    const schema = await influxClient.getInfluxSchema({ start: START_AGO })
    console.log('schema:', schema)
  }

  const query = async () => {
    const results = await influxClient.query(`
  from(bucket: $bucket)
    |> range(start: ${START_AGO})
`)
    // |> filter(fn: (r) => r._measurement == "temperature")
    console.log(results)
  }

  return (
    <>
      <button onClick={playTone}>play</button>
      <button onClick={stream}>stream results</button>
      <button onClick={query}>query</button>
      <button onClick={getInfluxSchema}>getInfluxSchema</button>
      <button onClick={testSampling}>sample data</button>
    </>
  )
}

export default App
