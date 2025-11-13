import { createContext, useContext } from 'react'
import { ConsoleEntry } from './ConsoleContext'

interface ConsoleContextType {
  consoleOutput: ConsoleEntry[]
  addConsoleOutput: (message: string, type?: 'info' | 'error' | 'success') => void
  clearConsole: () => void
}

export const ConsoleContext = createContext<ConsoleContextType | undefined>(undefined)

export function useConsole() {
  const context = useContext(ConsoleContext)
  if (context === undefined) {
    throw new Error('useConsole must be used within a ConsoleProvider')
  }
  return context
}
