import { ReactNode } from 'react'

import { FieldSelectionContext, useFieldSelectionProvider } from './useFieldSelection'

interface FieldSelectionProviderProps {
  children: ReactNode
}

export function FieldSelectionProvider({ children }: FieldSelectionProviderProps) {
  const useField = useFieldSelectionProvider()
  return <FieldSelectionContext.Provider value={useField}>{children}</FieldSelectionContext.Provider>
}
