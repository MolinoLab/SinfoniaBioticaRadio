import { createContext, useContext } from 'react'
import InfluxDBClient from '../libs/influxDbClient'

interface InfluxDBContextType {
  client: InfluxDBClient
}

export const InfluxDBContext = createContext<InfluxDBContextType | null>(null)

export function useInfluxDB() {
  const context = useContext(InfluxDBContext)
  if (!context) {
    throw new Error('useInfluxDB must be used within InfluxDBProvider')
  }
  return context.client
}
