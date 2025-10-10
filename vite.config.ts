import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

// https://vite.dev/config/
const viteconfig = ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd(), '') }

  const commit = execSync('git rev-parse --short HEAD').toString()

  const influxUrl = process.env.VITE_INFLUX_URL
  const influxToken = process.env.VITE_INFLUX_TOKEN
  const influxOrg = process.env.VITE_INFLUX_ORG
  const influxBucket = process.env.VITE_INFLUX_BUCKET

  if (!influxUrl || !influxToken || !influxOrg || !influxBucket) {
    throw new Error(
      'InfluxDB environment variables are not set properly. Must set VITE_INFLUX_URL, VITE_INFLUX_TOKEN, VITE_INFLUX_ORG, and VITE_INFLUX_BUCKET.'
    )
  }

  return defineConfig({
    define: {
      'import.meta.env.INFLUX_URL': JSON.stringify(influxUrl),
      'import.meta.env.INFLUX_TOKEN': JSON.stringify(influxToken),
      'import.meta.env.INFLUX_ORG': JSON.stringify(influxOrg),
      'import.meta.env.INFLUX_BUCKET': JSON.stringify(influxBucket),
      'import.meta.env.COMMIT': JSON.stringify(commit),
    },
    plugins: [react()],
  })
}

export default viteconfig
