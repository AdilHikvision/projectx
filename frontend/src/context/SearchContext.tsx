import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

interface SearchContextValue {
  query: string
  setQuery: (q: string) => void
  clearQuery: () => void
}

const SearchContext = createContext<SearchContextValue | undefined>(undefined)

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQueryState] = useState('')

  const setQuery = useCallback((q: string) => setQueryState(q), [])
  const clearQuery = useCallback(() => setQueryState(''), [])

  return (
    <SearchContext.Provider value={{ query, setQuery, clearQuery }}>
      {children}
    </SearchContext.Provider>
  )
}

export function useSearch() {
  const ctx = useContext(SearchContext)
  if (!ctx) throw new Error('useSearch must be used within SearchProvider')
  return ctx
}
