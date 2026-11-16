import { createContext, useContext } from 'react'

/**
 * The applied grid search query, provided by `DataGrid` so column cell
 * renderers can highlight matching text without prop drilling through every
 * column definition.
 */
export const SearchQueryContext = createContext<string>('')

export function useSearchQuery(): string {
  return useContext(SearchQueryContext)
}