/**
 * streamFields - Streams data from selected fields in real-time
 * @param influxClient - InfluxDB client instance
 * @param fields - Array of field names to stream
 * @param {Object} [options] - Query options
 * @param {string} [options.measurement] - name of measurement, for ex. environment
 * @param {string} [options.start] - Start time (e.g., '-1h', '-7d'), default '-1h' * @param {Function} [options.onRow] - Callback for each row: (field, row) => void * @param {Function} [options.shouldStop] - Callback to check if streaming should stop: () => boolean * @returns {Promise<Object>} Summary statistics { totalRows, rowsByField }
 */
export const streamFields = async (influxClient, fields, options = {}) => {
  const { start = '-1h', onRow, shouldStop, measurement = 'environment' } = options
  console.log(`Streaming ${start} data for ${fields.length} fields...`)

  // Build fields filter for single query
  const filter = fields.map((f) => `r._field == "${f}"`).join(' or ')

  const sampleQuery = `
      from(bucket: $bucket)
        |> range(start: ${start})
        |> filter(fn: (r) => r._measurement == "${measurement}")
        |> filter(fn: (r) => ${filter})
        |> pivot(
            rowKey: ["_time"],
            columnKey: ["_field"],
            valueColumn: "_value"
        )
        |> sort(columns: ["_time"], desc: false)
    `

  let totalRows = 0
  const rowsByField = {}

  // Initialize counters
  fields.forEach((field) => {
    rowsByField[field] = 0
  })

  try {
    await influxClient.queryStream(sampleQuery, (row) => {
      // Check stop signal immediately
      if (shouldStop && shouldStop()) {
        return
      }
      totalRows++
      const rowsFieldValues = {}

      // Display each row in console as it arrives
      for (const field of fields) {
        if (row[field]) {
          rowsByField[field]++
          rowsFieldValues[field] = row[field]
        }
      }

      // Call the row callback if provided
      if (onRow) {
        onRow(rowsFieldValues, row)
      }
    })

    console.log(`Stream completed. Total rows: ${totalRows}`)
  } catch (error) {
    console.error(`Error streaming fields:`, error)
    throw error
  }

  return { totalRows, rowsByField }
}
