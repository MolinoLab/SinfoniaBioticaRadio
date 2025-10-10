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
   * @returns {Promise<Array>} Aggregated results
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

// Export the class
// module.exports = InfluxDBClient

// Usage example (comment out before importing):
/*
const client = new InfluxDBClient({
  url: 'http://localhost:8086',
  token: 'your-token',
  org: 'your-org',
  bucket: 'your-bucket'
});

// Query all data
const results = await client.query(`
  from(bucket: $bucket)
    |> range(start: -1h)
    |> filter(fn: (r) => r._measurement == "temperature")
`);

// Query with helper
const data = await client.queryMeasurement({
  measurement: 'temperature',
  field: 'value',
  start: '-24h',
  filters: { location: 'office' }
});

// Write data
await client.writePoint({
  measurement: 'temperature',
  tags: { location: 'office', sensor: 'A1' },
  fields: { value: 23.5, humidity: 45 }
});

// Get aggregated data
const avgTemp = await client.queryAggregate({
  measurement: 'temperature',
  field: 'value',
  aggregateFunction: 'mean',
  window: '1h',
  start: '-7d'
});

await client.close();
*/
