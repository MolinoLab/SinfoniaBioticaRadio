import { ReactNode, useState } from 'react'
import { ConsoleContext } from './useConsole'

export interface ConsoleEntry {
  timestamp: string
  message: string
  type: 'info' | 'error' | 'success'
}

interface ConsoleProviderProps {
  children: ReactNode
}

export function ConsoleProvider({ children }: ConsoleProviderProps) {
  const [consoleOutput, setConsoleOutput] = useState<ConsoleEntry[]>([])

  const addConsoleOutput = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setConsoleOutput((prev) => {
      const newOutput = [...prev, { timestamp, message, type }]
      // Keep only the most recent 500 entries
      return newOutput.length > 500 ? newOutput.slice(-500) : newOutput
    })
  }

  const clearConsole = () => {
    setConsoleOutput([])
  }

  return (
    <ConsoleContext.Provider value={{ consoleOutput, addConsoleOutput, clearConsole }}>
      {children}
    </ConsoleContext.Provider>
  )
}
