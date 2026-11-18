import type { VirtualItem, Virtualizer } from '@tanstack/react-virtual'
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import type { TimelineFlatRow } from '../timelineModel'

/** `auto` only scrolls when the row is outside the viewport. */
export type TimelineFocusAlign = 'auto' | 'start' | 'center' | 'end'

interface TimelineFocusOptions<TItem> {
  flatRows: readonly TimelineFlatRow<TItem>[]
  virtualRows: readonly VirtualItem[]
  virtualizer: Virtualizer<HTMLDivElement, Element>
  scrollRef: RefObject<HTMLDivElement | null>
  /** Changes when the day groups change, not when an item is added to a day. */
  groupsKey: string
  /**
   * The view inputs (window, search) that should start the list at the top.
   * Optional so existing callers keep the group-key behaviour.
   */
  resetKey?: string
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
  resetKey,
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
    (index: number, align: TimelineFocusAlign = 'auto') => {
      const row = flatRows[index]
      if (!row || row.kind !== 'item') return

      // Always let the virtualizer move the row into view first. Overscan rows
      // are mounted while still offscreen, so focusing them without scrolling
      // used to move focus below the scrollport and leave the list behind.
      virtualizer.scrollToIndex(index, { align })

      const element = scrollRef.current?.querySelector<HTMLElement>(
        `[data-timeline-item="${row.key}"]`,
      )
      if (element) {
        pendingFocusRef.current = null
        element.focus({ preventScroll: true })
        return
      }

      // Not mounted: the effect below focuses it as soon as it renders.
      pendingFocusRef.current = row.key
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
  }, [groupsKey, resetKey, onGroupsChange, scrollRef])

  return { setActiveKey, tabbableKey, focusRow }
}
