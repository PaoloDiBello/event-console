import type { PaginationState } from '@tanstack/react-table'
import type { Virtualizer } from '@tanstack/react-virtual'
import { useCallback, useEffect, useLayoutEffect, useRef, type RefObject } from 'react'

interface RowRevealOptions<TData> {
  focusRowId?: string | null
  displayRows: readonly TData[]
  getRowId: (row: TData) => string
  pagination: PaginationState
  setPage: (pageIndex: number) => void
  scrollRef: RefObject<HTMLDivElement | null>
  virtualizer: Virtualizer<HTMLDivElement, Element>
}

/**
 * Reveal a specific row (the one just created or edited): jump to its page,
 * then scroll within that page once the rows are in the DOM.
 *
 * The reveal effect intentionally reacts to `focusRowId` only. The latest
 * table values are read through a ref, so a filter/sort recomputation does not
 * re-scroll the grid.
 */
export function useRowReveal<TData>({
  focusRowId,
  displayRows,
  getRowId,
  pagination,
  setPage,
  scrollRef,
  virtualizer,
}: RowRevealOptions<TData>) {
  const pendingRowScrollRef = useRef<string | null>(null)
  /** Set when a reveal already positioned the page, so the generic reset skips. */
  const skipScrollResetRef = useRef(false)
  const latest = useRef({ displayRows, getRowId, pagination, setPage, virtualizer, scrollRef })

  // Keep the effect inputs current without reading refs during render. The
  // reveal effects below read this snapshot when they run.
  useLayoutEffect(() => {
    latest.current = { displayRows, getRowId, pagination, setPage, virtualizer, scrollRef }
  })

  /** Scroll to a row and make the virtualizer read the new offset immediately. */
  const scrollToRow = useCallback((index: number) => {
    const { virtualizer, scrollRef } = latest.current
    virtualizer.scrollToIndex(index, { align: 'center' })
    // Browsers throttle the async scroll event in background/occluded tabs;
    // dispatching it here keeps the rendered window in sync with scrollTop.
    scrollRef.current?.dispatchEvent(new Event('scroll'))
  }, [])

  useEffect(() => {
    if (!focusRowId) return
    const { displayRows, getRowId, pagination, setPage } = latest.current
    const index = displayRows.findIndex((row) => getRowId(row) === focusRowId)
    if (index < 0) return

    const targetPage = Math.floor(index / pagination.pageSize)
    if (targetPage !== pagination.pageIndex) {
      pendingRowScrollRef.current = focusRowId
      setPage(targetPage)
      return
    }
    scrollToRow(index % pagination.pageSize)
  }, [focusRowId, scrollToRow])

  // Scroll after the page's rows are in the DOM. A layout effect is more
  // reliable here than rAF, which browsers throttle in background tabs.
  useLayoutEffect(() => {
    const rowId = pendingRowScrollRef.current
    if (!rowId) return
    const { displayRows, getRowId, pagination } = latest.current
    const index = displayRows.findIndex((row) => getRowId(row) === rowId)
    if (index < 0) return
    pendingRowScrollRef.current = null
    skipScrollResetRef.current = true
    scrollToRow(index % pagination.pageSize)
  }, [pagination.pageIndex, pagination.pageSize, scrollToRow])

  return { skipScrollResetRef }
}
