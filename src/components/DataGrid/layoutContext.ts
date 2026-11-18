import { createContext, useContext } from 'react'

/**
 * Which row layout the grid is painting.
 *
 * A cell that carries different facts at different widths reads this instead of
 * opening its own media-query listener: fifty rows should not mean fifty
 * `matchMedia` subscriptions, and two copies of the same text in the DOM is one
 * copy too many for a screen reader.
 */
export type GridLayout = 'wide' | 'narrow'

export const GridLayoutContext = createContext<GridLayout>('wide')

export function useGridLayout(): GridLayout {
  return useContext(GridLayoutContext)
}
