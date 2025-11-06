import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ConsoleProvider } from './contexts/ConsoleContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConsoleProvider>
      <App />
    </ConsoleProvider>
  </StrictMode>
)
