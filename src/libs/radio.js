/**
 * streamMeasurements - Streams sample data from each measurement type in the last hour
 * @param influxClient - InfluxDB client instance
 * @param measurements - Array of measurement names to sample
 * @param {Object} [options] - Query options
 * @param {string} [options.start] - Start time (e.g., '-1h', '-7d'), default '-7d'
 * @returns {Promise<Object>} Schema info { [measurement]: { [field]: type } }
 */
export const streamFields = async (influxClient, fields, options = {}) => {
  const { start = '-1h' } = options
  console.log(`Sampling ${start} data by measurement type...`)

  // build fields filters array
  const filter = fields.map((f) => `r._field == "${f}"`).join(' or ')

  const samples = {}

  for (const field of fields) {
    const sampleQuery = `
        from(bucket: $bucket)
          |> range(start: ${start})
          |> filter(fn: (r) => ${filter})
      `
    try {
      const results = await influxClient.query(sampleQuery)
      samples[field] = results
      console.log(`  ${field}:`, results)
    } catch (error) {
      console.error(`Error querying ${field}:`, error)
      samples[field] = []
    }
  }

  return samples
}
