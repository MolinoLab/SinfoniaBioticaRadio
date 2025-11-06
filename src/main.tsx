import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ConsoleProvider } from './contexts/ConsoleContext'
import { InfluxDBProvider } from './contexts/InfluxDBContext'
import { FieldSelectionProvider } from './contexts/FieldSelectionContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConsoleProvider>
      <InfluxDBProvider>
        <FieldSelectionProvider>
          <App />
        </FieldSelectionProvider>
      </InfluxDBProvider>
    </ConsoleProvider>
  </StrictMode>
)
