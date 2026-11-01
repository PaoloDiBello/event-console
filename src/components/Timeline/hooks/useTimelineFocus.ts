import type { VirtualItem, Virtualizer } from '@tanstack/react-virtual'
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import type { TimelineFlatRow } from '../timelineModel'

interface TimelineFocusOptions<TItem> {
  flatRows: readonly TimelineFlatRow<TItem>[]
  virtualRows: readonly VirtualItem[]
  virtualizer: Virtualizer<HTMLDivElement, Element>
  scrollRef: RefObject<HTMLDivElement | null>
  /** Changes when the day groups change, not when an item is added to a day. */
  groupsKey: string
  onGroupsChange?: () => void
}

/**
 * Roving-tabindex focus for a virtualized list.
 *
 * The element you want to focus may not be mounted yet. When that happens the
 * target key is parked in `pendingFocusRef`, the list scrolls to the row, and
 * an effect focuses it as soon as it renders.
 */
export function useTimelineFocus<TItem>({
  flatRows,
  virtualRows,
  virtualizer,
  scrollRef,
  groupsKey,
  onGroupsChange,
}: TimelineFocusOptions<TItem>) {
  const pendingFocusRef = useRef<string | null>(null)
  const [activeKey, setActiveKey] = useState<string | null>(null)

  const renderedKeys = useMemo(
    () =>
      new Set(
        virtualRows
          .map((row) => flatRows[row.index]?.key)
          .filter((key): key is string => Boolean(key)),
      ),
    [virtualRows, flatRows],
  )
  const firstRenderedItemKey = useMemo(() => {
    for (const virtualRow of virtualRows) {
      const row = flatRows[virtualRow.index]
      if (row?.kind === 'item') return row.key
    }
    return null
  }, [virtualRows, flatRows])

  // If the remembered item scrolled away, the first rendered item becomes the
  // Tab stop — otherwise the timeline would have no reachable element.
  const tabbableKey = activeKey && renderedKeys.has(activeKey) ? activeKey : firstRenderedItemKey

  const focusRow = useCallback(
    (index: number) => {
      const row = flatRows[index]
      if (!row || row.kind !== 'item') return

      const isRendered = virtualizer
        .getVirtualItems()
        .some((virtualRow) => virtualRow.index === index)
      if (isRendered) {
        const element = scrollRef.current?.querySelector<HTMLElement>(
          `[data-timeline-item="${row.key}"]`,
        )
        if (element) {
          element.focus({ preventScroll: true })
          return
        }
      }

      // Not mounted: scroll it into view, then let the effect below focus it.
      pendingFocusRef.current = row.key
      virtualizer.scrollToIndex(index, { align: 'center' })
    },
    [flatRows, virtualizer, scrollRef],
  )

  useEffect(() => {
    const key = pendingFocusRef.current
    if (!key) return
    const element = scrollRef.current?.querySelector<HTMLElement>(`[data-timeline-item="${key}"]`)
    if (element) {
      element.focus({ preventScroll: true })
      pendingFocusRef.current = null
    }
  }, [virtualRows, flatRows, scrollRef])

  // New windows/filters start at the top; adding an event to an existing day
  // must not yank the user back up. Resetting the roving tab stop is an
  // intentional prop-driven state reset, not a synchronization effect.
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    setActiveKey(null)
    onGroupsChange?.()
    scrollRef.current?.scrollTo({ top: 0 })
  }, [groupsKey, onGroupsChange, scrollRef])

  return { setActiveKey, tabbableKey, focusRow }
}
