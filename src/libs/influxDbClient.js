import { InfluxDB, Point } from '@influxdata/influxdb-client'

/**
 * InfluxDB Client Utility Class
 * Provides methods to interact with InfluxDB 2.x
 */
class InfluxDBClient {
  /**
   * Initialize InfluxDB client
   * @param {Object} config - Configuration object
   * @param {string} config.url - InfluxDB URL (e.g., 'http://localhost:8086')
   * @param {string} config.token - API token
   * @param {string} config.org - Organization name
   * @param {string} config.bucket - Default bucket name
   * @param {number} [config.timeout=10000] - Query timeout in milliseconds
   */
  constructor(config) {
    if (!config.url || !config.token || !config.org) {
      throw new Error('url, token, and org are required parameters')
    }

    this.url = config.url
    this.token = config.token
    this.org = config.org
    this.bucket = config.bucket
    this.timeout = config.timeout || 10000

    this.client = new InfluxDB({
      url: this.url,
      token: this.token,
      timeout: this.timeout,
    })

    this.queryApi = this.client.getQueryApi(this.org)
    this.writeApi = this.client.getWriteApi(this.org, this.bucket)
  }

  /**
   * Execute a Flux query and return all results
   * @param {string} fluxQuery - Flux query string
   * @param {string} [bucket] - Optional bucket override
   * @returns {Promise<Array>} Array of query results
   */
  async query(fluxQuery, bucket = null) {
    const targetBucket = bucket || this.bucket

    // Replace bucket placeholder if present
    const finalQuery = fluxQuery.replace(/\$bucket/g, `"${targetBucket}"`)

    try {
      const results = await this.queryApi.collectRows(finalQuery)
      return results
    } catch (err) {
      console.error('Query error:', err)
      throw err
    }
  }

  /**
   * Execute a Flux query with streaming results
   * @param {string} fluxQuery - Flux query string
   * @param {Function} onRow - Callback function for each row
   * @param {string} [bucket] - Optional bucket override
   * @returns {Promise<void>}
   */
  async queryStream(fluxQuery, onRow, bucket = null) {
    const targetBucket = bucket || this.bucket
    const finalQuery = fluxQuery.replace(/\$bucket/g, `"${targetBucket}"`)

    return new Promise((resolve, reject) => {
      this.queryApi.queryRows(finalQuery, {
        next(row, tableMeta) {
          const obj = tableMeta.toObject(row)
          onRow(obj)
        },
        error(err) {
          console.error('Query stream error:', err)
          reject(err)
        },
        complete() {
          resolve()
        },
      })
    })
  }

  /**
   * Query data from a measurement with filters
   * @param {Object} options - Query options
   * @param {string} options.measurement - Measurement name
   * @param {string} [options.field] - Field name to filter
   * @param {string} [options.start] - Start time (e.g., '-1h', '-7d')
   * @param {string} [options.stop] - Stop time (default: 'now()')
   * @param {Object} [options.filters] - Additional filters as key-value pairs
   * @param {string} [options.bucket] - Optional bucket override
   * @returns {Promise<Array>} Query results
   */
  // async queryMeasurement(options) {
  //   const { measurement, field = null, start = '-1h', stop = 'now()', filters = {}, bucket = null } = options
  //
  //   const targetBucket = bucket || this.bucket
  //
  //   let query = `
  //     from(bucket: "${targetBucket}")
  //       |> range(start: ${start}, stop: ${stop})
  //       |> filter(fn: (r) => r._measurement == "${measurement}")
  //   `
  //
  //   if (field) {
  //     query += `\n  |> filter(fn: (r) => r._field == "${field}")`
  //   }
  //
  //   for (const [key, value] of Object.entries(filters)) {
  //     query += `\n  |> filter(fn: (r) => r.${key} == "${value}")`
  //   }
  //
  //   return await this.query(query)
  // }

  /**
   * Write data point to InfluxDB
   * @param {Object} point - Data point
   * @param {string} point.measurement - Measurement name
   * @param {Object} point.tags - Tags as key-value pairs
   * @param {Object} point.fields - Fields as key-value pairs
   * @param {Date} [point.timestamp] - Optional timestamp
   * @returns {Promise<void>}
   */
  // async writePoint(point) {
  //   try {
  //     const p = new Point(point.measurement)
  //
  //     if (point.tags) {
  //       Object.entries(point.tags).forEach(([key, value]) => {
  //         p.tag(key, value)
  //       })
  //     }
  //
  //     if (point.fields) {
  //       Object.entries(point.fields).forEach(([key, value]) => {
  //         if (typeof value === 'number') {
  //           p.floatField(key, value)
  //         } else if (typeof value === 'boolean') {
  //           p.booleanField(key, value)
  //         } else if (typeof value === 'string') {
  //           p.stringField(key, value)
  //         } else {
  //           p.intField(key, value)
  //         }
  //       })
  //     }
  //
  //     if (point.timestamp) {
  //       p.timestamp(point.timestamp)
  //     }
  //
  //     this.writeApi.writePoint(p)
  //     await this.writeApi.flush()
  //   } catch (err) {
  //     console.error('Write error:', err)
  //     throw err
  //   }
  // }

  /**
   * Write multiple data points to InfluxDB
   * @param {Array} points - Array of data points
   * @returns {Promise<void>}
   */
  // async writePoints(points) {
  //   try {
  //     points.forEach((point) => {
  //       const p = new Point(point.measurement)
  //
  //       if (point.tags) {
  //         Object.entries(point.tags).forEach(([key, value]) => {
  //           p.tag(key, value)
  //         })
  //       }
  //
  //       if (point.fields) {
  //         Object.entries(point.fields).forEach(([key, value]) => {
  //           if (typeof value === 'number') {
  //             p.floatField(key, value)
  //           } else if (typeof value === 'boolean') {
  //             p.booleanField(key, value)
  //           } else if (typeof value === 'string') {
  //             p.stringField(key, value)
  //           } else {
  //             p.intField(key, value)
  //           }
  //         })
  //       }
  //
  //       if (point.timestamp) {
  //         p.timestamp(point.timestamp)
  //       }
  //
  //       this.writeApi.writePoint(p)
  //     })
  //
  //     await this.writeApi.flush()
  //   } catch (err) {
  //     console.error('Write error:', err)
  //     throw err
  //   }
  // }

  /**
   * Get aggregated data (mean, sum, count, etc.)
   * @param {Object} options - Aggregation options
   * @param {string} options.measurement - Measurement name
   * @param {string} options.field - Field name
   * @param {string} options.aggregateFunction - Function (mean, sum, count, min, max)
   * @param {string} [options.start] - Start time
   * @param {string} [options.stop] - Stop time
   * @param {string} [options.window] - Window duration (e.g., '1h', '5m')
   * @param {string} [options.bucket] - Optional bucket override
   * @returns {Promise<*[]>} Aggregated results
   */
  // async queryAggregate(options) {
  //   const {
  //     measurement,
  //     field,
  //     aggregateFunction,
  //     start = '-1h',
  //     stop = 'now()',
  //     window = null,
  //     bucket = null,
  //   } = options
  //
  //   const targetBucket = bucket || this.bucket
  //
  //   let query = `
  //     from(bucket: "${targetBucket}")
  //       |> range(start: ${start}, stop: ${stop})
  //       |> filter(fn: (r) => r._measurement == "${measurement}")
  //       |> filter(fn: (r) => r._field == "${field}")
  //   `
  //
  //   if (window) {
  //     query += `\n  |> aggregateWindow(every: ${window}, fn: ${aggregateFunction}, createEmpty: false)`
  //   } else {
  //     query += `\n  |> ${aggregateFunction}()`
  //   }
  //
  //   return await this.query(query)
  // }

  /**
   * Get field keys of a bucket and measurement
   * @param {Object} options - Aggregation options
   * @param {string} [options.measurement] - Measurement name
   * @returns {Promise<*[]>} Aggregated results
   */
  async getFieldKeys(options = {}) {
    const { measurement = 'environmental' } = options
    const measurementQuery = `
    import "influxdata/influxdb/schema"
    schema.measurementFieldKeys(bucket: "${this.bucket}", measurement: "${measurement}")
  `
    const fieldKeys = []

    // const measures = await this.queryApi.iterateRows(measurementQuery)
    const fields = await this.queryApi.collectRows(measurementQuery)

    for (const value of fields) {
      fieldKeys.push(value._value)
    }

    return fieldKeys
  }

  async getMeasurements(options = {}) {
    const measurementQuery = `
    import "influxdata/influxdb/schema"
    schema.measurements(bucket: "${this.bucket}")
  `
    const measurements = new Set()

    // const measures = await this.queryApi.iterateRows(measurementQuery)
    const measures = await this.queryApi.collectRows(measurementQuery)

    for (const value of measures) {
      measurements.add(value._value)
    }

    return measurements
  }

  /**
   * Get tag keys for a measurement
   * @param {Object} [options] - Query options
   * @param {string} [options.measurement] - Measurement name, default 'environment'
   * @returns {Promise<Array>} Array of tag key names
   */
  async getTagKeys(options = {}) {
    const { measurement = 'environment' } = options
    const tagKeysQuery = `
    import "influxdata/influxdb/schema"
    schema.tagKeys(bucket: "${this.bucket}")
  `
    const tagKeys = []

    const tags = await this.queryApi.collectRows(tagKeysQuery)

    for (const value of tags) {
      tagKeys.push(value._value)
    }

    return tagKeys
  }

  /**
   * Get tag values for a specific tag key
   * @param {Object} options - Query options
   * @param {string} [options.measurement] - Measurement name, default 'environment'
   * @param {string} options.tagKey - Tag key name (e.g., 'devices', 'device_id')
   * @returns {Promise<Array>} Array of tag values
   */
  async getTagValues(tagKey) {
    if (!tagKey) {
      throw new Error('tagKey is required')
    }

    const tagValuesQuery = `
    import "influxdata/influxdb/schema"
    schema.tagValues(
      bucket: "${this.bucket}",
      tag: "${tagKey}"
    )
  `

    const tagValues = []

    const values = await this.queryApi.collectRows(tagValuesQuery)

    for (const value of values) {
      tagValues.push(value._value)
    }

    return tagValues
  }

  /**
   * Get all measurements, fields, and inferred data types from an InfluxDB bucket.
   * @param {Object} [options] - Query options
   * @param {string} [options.start] - Start time (e.g., '-1h', '-7d'), default '-7d'
   * @returns {Promise<Object>} Schema info { [measurement]: { [field]: type } }
   */
  async getInfluxSchemaAndTypes(options = {}) {
    const { start = '-7d' } = options
    // Step 1: Get all measurements
    const measurements = await this.getMeasurements()
    const schema = {}

    // Step 2: For each measurement, query one point to infer field types
    for (const measurement of measurements) {
      const sampleQuery = `
      from(bucket: "${this.bucket}")
        |> range(start: ${start})
        |> filter(fn: (r) => r._measurement == "${measurement}")
        |> limit(n: 1)
    `

      const fields = {}
      const _fields = await this.queryApi.collectRows(sampleQuery)

      for (const values of _fields) {
        const fieldName = values._field
        const value = values._value
        const jsType = typeof value
        if (fieldName && jsType) {
          fields[fieldName] = jsType
        }
      }

      schema[measurement] = fields
    }

    return schema
  }

  /**
   * Get field types for a specific measurement
   * @param {Object} [options] - Query options
   * @param {string} [options.measurement] - Measurement name, default 'environmental'
   * @param {string} [options.start] - Start time (e.g., '-1h', '-7d'), default '-7d'
   * @returns {Promise<Object>} Field types { [fieldName]: jsType }
   */
  async getMeasurementTypes() {
    const sampleQuery = `
    import "influxdata/influxdb/schema"
    schema.measurements(
      bucket: "${this.bucket}",
    )`

    const fields = []
    const rows = await this.queryApi.collectRows(sampleQuery)

    for (const value of rows) {
      fields.push(value._value)
    }

    return fields
  }

  /**
   * Close the client connection
   */
  async close() {
    try {
      await this.writeApi.close()
      console.log('InfluxDB connection closed')
    } catch (err) {
      console.error('Error closing connection:', err)
      throw err
    }
  }
}

export default InfluxDBClient
