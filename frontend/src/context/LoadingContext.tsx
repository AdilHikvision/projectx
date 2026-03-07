import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

interface LoadingContextValue {
  isLoading: boolean
  startLoading: () => void
  stopLoading: () => void
}

const LoadingContext = createContext<LoadingContextValue | undefined>(undefined)

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0)
  const isLoading = count > 0

  const startLoading = useCallback(() => {
    setCount((c) => c + 1)
  }, [])

  const stopLoading = useCallback(() => {
    setCount((c) => Math.max(0, c - 1))
  }, [])

  const value: LoadingContextValue = {
    isLoading,
    startLoading,
    stopLoading,
  }

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const ctx = useContext(LoadingContext)
  if (!ctx) {
    throw new Error('useLoading must be used within LoadingProvider')
  }
  return ctx
}
