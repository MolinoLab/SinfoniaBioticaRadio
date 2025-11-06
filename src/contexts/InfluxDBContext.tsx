import { createContext, ReactNode, useContext } from 'react'
import InfluxDBClient from '../libs/influxDbClient'

interface InfluxDBContextType {
  client: InfluxDBClient
}

export const InfluxDBContext = createContext<InfluxDBContextType | null>(null)

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

  return <InfluxDBContext.Provider value={{ client }}>{children}</InfluxDBContext.Provider>
}

export function useInfluxDB() {
  const context = useContext(InfluxDBContext)
  if (!context) {
    throw new Error('useInfluxDB must be used within InfluxDBProvider')
  }
  return context.client
}
