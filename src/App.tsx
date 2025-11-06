import './App.css'
import { playTone } from './libs/tone'
import InfluxDBClient from './libs/influxDbClient'
import { streamMeasurements } from './libs/radio'

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

  const query = async () => {
    const results = await influxClient.query(`
  from(bucket: $bucket)
    |> range(start: ${START_AGO})
`)
    // |> filter(fn: (r) => r._measurement == "temperature")
    console.log(results)
  }

  const getInfluxSchemaAndTypes = async () => {
    const schema = await influxClient.getInfluxSchemaAndTypes({ start: START_AGO })
    console.log('schema:', schema)
  }

  const getFieldKeys = async () => {
    const schema = await influxClient.getFieldKeys()
    console.log('getFieldKeys:', schema)
  }

  const _streamMeasurements = async () => {
    // const schema = await influxClient.getInfluxSchemaAndTypes({ start: START_AGO })
    // const measurements = Object.keys(schema)
    //
    // console.log(`Found ${measurements.length} measurements:`, measurements)
    // const res = await streamMeasurements(influxClient, measurements, {
    //   start: START_AGO,
    // })
    // console.log('measurements:', res)
  }


  return (
    <div className="app-container">
      <div className="section-container">
        <div className="section-title">📻 Radio sinfonia biotica</div>
        <button onClick={_streamMeasurements}>sample last hour</button>
      </div>
      <div className="section-container">
        <div className="section-title">🗒 Tests</div>
        <div className="button-group">
          <button onClick={playTone}>Tonejs</button>
          <button onClick={stream}>stream results</button>
          <button onClick={query}>query</button>
        </div>
      </div>
      <div className="section-container">
        <div className="section-title">🔎 Explore influxDb schema</div>
        <div className="button-group">
          <button onClick={getInfluxSchemaAndTypes}>Get schema and types</button>
          <button onClick={getFieldKeys}>Get field keys</button>
        </div>
      </div>
    </div>
  )
}

export default App

/**
 * Sample data by time blocks with adaptive reference time lookup
 * @param influxClient - Client of influxDB
 * @param measurements - Array of measurement names to query
 * @param options - Configuration options
 * @returns Structured sample data for each measurement
 */
// const sampleDataByTimeBlocks = async (
//   influxClient: InfluxDBClient,
//   measurements: string[],
//   options?: {
//     intervalMinutes?: number // Sampling interval (default: 1 minute)
//     lookbackHours?: number // How far back to look for data (default: 1 hour)
//     fields?: string[] // Optional field filter
//   }
// ) => {
//   const intervalMinutes = options?.intervalMinutes || 1
//   const lookbackHours = options?.lookbackHours || 1
//   const fields = options?.fields
//
//   // Calculate current hour as reference (e.g., 15:00 if now is 15:37)
//   const now = new Date()
//   const currentHour = new Date(now)
//   currentHour.setMinutes(0, 0, 0)
//
//   const results: Record<
//     string,
//     {
//       referenceTime: Date | null
//       samples: Array<{
//         time: string
//         field: string
//         value: number | string | boolean
//       }>
//     }
//   > = {}
//
//   console.log(`Sampling ${measurements.length} measurements with ${intervalMinutes}min intervals`)
//
//   for (const measurement of measurements) {
//     console.log(`\nProcessing measurement: ${measurement}`)
//
//     // Step 1: Find the reference time by looking back for first available data at the reference hour
//     let referenceTime: Date | null = null
//     const lookbackLimit = 30 // days to search back for reference
//
//     // Build query to find first data at reference hour going backwards
//     const hourMinute = currentHour.toISOString().substring(11, 16) // e.g., "15:00"
//
//     // Query backwards to find first occurrence of the reference hour
//     const referenceQuery = `
//         from(bucket: $bucket)
//           |> range(start: -${lookbackLimit}d)
//           |> filter(fn: (r) => r._measurement == "${measurement}")
//           ${fields ? `|> filter(fn: (r) => ${fields.map((f) => `r._field == "${f}"`).join(' or ')})` : ''}
//           |> filter(fn: (r) => strings.substring(v: string(v: r._time), start: 11, end: 16) == "${hourMinute}")
//           |> limit(n: 1)
//       `
//
//     try {
//       const referenceResults = await influxClient.query(referenceQuery)
//
//       if (referenceResults.length > 0) {
//         referenceTime = new Date(referenceResults[0]._time)
//         console.log(`  Found reference time: ${referenceTime.toISOString()}`)
//       } else {
//         console.log(`  No data found at reference hour ${hourMinute} for ${measurement}`)
//         results[measurement] = {
//           referenceTime: null,
//           samples: [],
//         }
//         continue
//       }
//     } catch (error) {
//       console.error(`  Error finding reference time for ${measurement}:`, error)
//       results[measurement] = {
//         referenceTime: null,
//         samples: [],
//       }
//       continue
//     }
//
//     // Step 2: Sample data forward from reference time at specified intervals
//     const endTime = new Date(referenceTime)
//     endTime.setHours(endTime.getHours() + lookbackHours)
//
//     const samplingQuery = `
//         from(bucket: $bucket)
//           |> range(start: ${referenceTime.toISOString()}, stop: ${endTime.toISOString()})
//           |> filter(fn: (r) => r._measurement == "${measurement}")
//           ${fields ? `|> filter(fn: (r) => ${fields.map((f) => `r._field == "${f}"`).join(' or ')})` : ''}
//           |> aggregateWindow(every: ${intervalMinutes}m, fn: last, createEmpty: false)
//       `
//
//     try {
//       const samples = await influxClient.query(samplingQuery)
//       console.log(`  Retrieved ${samples.length} samples`)
//
//       results[measurement] = {
//         referenceTime,
//         samples: samples.map((row) => ({
//           time: row._time,
//           field: row._field,
//           value: row._value,
//         })),
//       }
//     } catch (error) {
//       console.error(`  Error sampling data for ${measurement}:`, error)
//       results[measurement] = {
//         referenceTime,
//         samples: [],
//       }
//     }
//   }
//
//   return results
// }
