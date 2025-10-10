import './App.css'
import { playTone } from './libs/tone'
import InfluxDBClient from './libs/influxDb'

function App() {
  console.log(import.meta.env.INFLUX_URL)
  console.log(import.meta.env.INFLUX_TOKEN)
  console.log(import.meta.env.INFLUX_ORG)
  console.log(import.meta.env.INFLUX_BUCKET)

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
    await influxClient.queryStream('from(bucket: $bucket) |> range(start: -1h)', (row) => {
      console.log('Row:', row)
    })
  }

  const query = async () => {
    const results = await influxClient.query(`
  from(bucket: $bucket)
    |> range(start: -1h)
`)
    // |> filter(fn: (r) => r._measurement == "temperature")
    console.log(results)
  }

  return (
    <>
      <button onClick={playTone}>play</button>
      <button onClick={stream}>stream results</button>
      <button onClick={query}>query</button>
    </>
  )
}

export default App
