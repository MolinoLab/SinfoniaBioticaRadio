/**
 * streamFields - Streams data from selected fields in real-time
 * Uses native InfluxDB iterateRows() for efficient, memory-friendly streaming
 * @param influxClient - InfluxDB client instance
 * @param fields - Array of field names to stream
 * @param {Object} [options] - Query options
 * @param {string} [options.tagKey] -Tag key to filter on
 * @param {string} [options.tagValues] - Array of tag values to filter on
 * @param {string} [options.measurement] - name of measurement, for ex. environment * @param {string} [options.start] - Start time (e.g., '-1h', '-7d'), default '-1h' * @param {Function} [options.onRow] - Callback for each row: (field, row) => void * @param {Function} [options.shouldStop] - Callback to check if streaming should stop: () => boolean * @returns {Promise<Object>} Summary statistics { totalRows, rowsByField }
 */
export const streamFields = async (influxClient, fields, options = {}) => {
  // todo(kon): this function may be deprecated. Let it here to use it as example normal query
  const {
    start = '-1h',
    delayMs = 1000,
    onRow,
    shouldStop,
    measurement = 'environment',
    tagKey = null,
    tagValues = [],
  } = options
  console.log(`Streaming ${start} data for ${fields.length} fields...`)

  // Build fields filter for single query
  const fieldFilter = fields.map((f) => `r._field == "${f}"`).join(' or ')

  // Build tag filter (if provided)
  let tagFilter = ''
  if (tagKey && tagValues.length > 0) {
    const tagValueFilter = tagValues.map((v) => `r.${tagKey} == "${v}"`).join(' or ')
    tagFilter = `|> filter(fn: (r) => ${tagValueFilter})`
  }

  const sampleQuery = `
      from(bucket: $bucket)
        |> range(start: ${start})
        |> filter(fn: (r) => r._measurement == "${measurement}")
        ${tagFilter}
        |> filter(fn: (r) => ${fieldFilter})
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

  const vals = await influxClient.query(sampleQuery)
  console.log(vals)

  for (const row of vals) {
    // Check stop signal immediately
    if (shouldStop && shouldStop()) {
      break
    }

    // Wait for the specified delay before processing this row
    await new Promise((resolve) => setTimeout(resolve, delayMs))

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
  }

  // todo(kon): Commented below is the example using queryStream
  // try {
  //   await influxClient.queryStream(sampleQuery, (row) => {
  //     // Check stop signal immediately
  //     if (shouldStop && shouldStop()) {
  //       return
  //     }
  //     totalRows++
  //     const rowsFieldValues = {}
  //
  //     // Display each row in console as it arrives
  //     for (const field of fields) {
  //       if (row[field]) {
  //         rowsByField[field]++
  //         rowsFieldValues[field] = row[field]
  //       }
  //     }
  //
  //     // Call the row callback if provided
  //     if (onRow) {
  //       onRow(rowsFieldValues, row)
  //     }
  //   })
  //
  //   console.log(`Stream completed. Total rows: ${totalRows}`)
  // } catch (error) {
  //   console.error(`Error streaming fields:`, error)
  //   throw error
  // }
  //
  return { totalRows, rowsByField }
}

/**
 * streamFieldsWithDelay - Streams data from selected fields with a configurable delay between rows
 * @param influxClient - InfluxDB client instance
 * @param fields - Array of field names to stream
 * @param {Object} [options] - Query options
 * @param {string} [options.tagKey] - Tag key to filter on
 * @param {string} [options.tagValues] - Array of tag values to filter on
 * @param {string} [options.measurement] - name of measurement, for ex. environment
 * @param {string} [options.start] - Start time (e.g., '-1h', '-7d'), default '-1h'
 * @param {number} [options.delayMs] - Delay in milliseconds between rows, default 1000ms
 * @param {Function} [options.onRow] - Callback for each row: (field, row) => void
 * @param {Function} [options.shouldStop] - Callback to check if streaming should stop: () => boolean
 * @returns {Promise<Object>} Summary statistics { totalRows, rowsByField }
 */
export const streamIterateRows = async (influxClient, fields, options = {}) => {
  const {
    start = '-1h',
    delayMs = 1000,
    onRow,
    shouldStop,
    measurement = 'environment',
    tagKey = null,
    tagValues = [],
  } = options
  console.log(`Streaming ${start} data for ${fields.length} fields with ${delayMs}ms delay between rows...`)

  // Build fields filter for single query
  const fieldFilter = fields.map((f) => `r._field == "${f}"`).join(' or ')

  // Build tag filter (if provided)
  let tagFilter = ''
  if (tagKey && tagValues.length > 0) {
    const tagValueFilter = tagValues.map((v) => `r.${tagKey} == "${v}"`).join(' or ')
    tagFilter = `|> filter(fn: (r) => ${tagValueFilter})`
  }

  const sampleQuery = `
      from(bucket: $bucket)
        |> range(start: ${start})
        |> filter(fn: (r) => r._measurement == "${measurement}")
        ${tagFilter}
        |> filter(fn: (r) => ${fieldFilter})
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
    // Use native iterateRows for true streaming without loading all data into memory
    for await (const { values, tableMeta } of influxClient.queryIterateRows(sampleQuery)) {
      // Check stop signal immediately
      if (shouldStop && shouldStop()) {
        break
      }

      // Wait for the specified delay before processing this row
      await new Promise((resolve) => setTimeout(resolve, delayMs))

      // Convert row values to object
      const row = tableMeta.toObject(values)

      totalRows++
      const rowsFieldValues = {}

      // Extract field values
      for (const field of fields) {
        if (row[field] !== undefined && row[field] !== null) {
          rowsByField[field]++
          rowsFieldValues[field] = row[field]
        }
      }

      // Call the row callback if provided
      if (onRow) {
        onRow(rowsFieldValues, row)
      }
    }
  } catch (error) {
    console.error(`Error streaming fields with delay:`, error)
    throw error
  }

  return { totalRows, rowsByField }
}
