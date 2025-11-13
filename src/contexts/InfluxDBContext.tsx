import { ReactNode } from 'react'
import InfluxDBClient from '../libs/influxDbClient'
import { InfluxDBContext as InfluxDBContext1 } from './useInfluxDB'

interface InfluxDBProviderProps {
  children: ReactNode
}

export function InfluxDBProvider({ children }: InfluxDBProviderProps) {
  // Initialize the client once at the provider level
  const client = new InfluxDBClient({
    url: import.meta.env.INFLUX_URL,
    token: import.meta.env.INFLUX_TOKEN,
    org: import.meta.env.INFLUX_ORG,
    bucket: import.meta.env.INFLUX_BUCKET,
    timeout: 10000,
  })

  return <InfluxDBContext1 value={{ client }}>{children}</InfluxDBContext1>
}
