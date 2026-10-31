import { useVirtualizer } from '@tanstack/react-virtual'
import { CalendarRange } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { TimelineGroupRow, TimelineItemRow } from './TimelineRow'
import { buildTimelineRows, indexTimelineRows, type TimelineFlatRow } from './timelineModel'
import type { TimelineProps } from './types'

const DEFAULT_ITEM_HEIGHT = 84
const DEFAULT_GROUP_HEIGHT = 56

/**
 * A day-grouped, virtualized agenda with a roving tabindex.
 *
 * Why day grouping: an event is anchored to a date, and "what is happening on
 * Thursday" is the question people actually ask. It also gives screen readers a
 * meaningful boundary — each announcement carries group + position, so focus
 * moving into a new day is never silent.
 *
 * Keyboard model:
 * - ↑ / ↓  previous / next event, crossing day boundaries in reading order
 * - ← / →  first event of the previous / next day
 * - Home / End  first / last event
 * - Enter / Space  activate (open the editor)
 *
 * The hard part of combining this with virtualization is that the element you
 * want to focus may not be mounted yet. When that happens, the target key is
 * parked in `pendingFocusRef`, the list scrolls to the row, and an effect
 * focuses it as soon as it renders.
 */
export function Timeline<TItem>({
  groups,
  getItemId,
  getItemLabel,
  renderItem,
  onItemActivate,
  ariaLabel,
  emptyState,
  itemHeight = DEFAULT_ITEM_HEIGHT,
  groupHeight = DEFAULT_GROUP_HEIGHT,
}: TimelineProps<TItem>) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const pendingFocusRef = useRef<string | null>(null)
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')

  const flatRows = useMemo(
    () => buildTimelineRows(groups, getItemId),
    [groups, getItemId],
  )
  const { indexByKey, firstItemIndexByGroup } = useMemo(
    () => indexTimelineRows(flatRows),
    [flatRows],
  )

  // TanStack Virtual intentionally exposes non-memoizable instance methods;
  // this component is not compiled by React Compiler.
  // oxlint-disable-next-line react/incompatible-library
  const virtualizer = useVirtualizer({
    count: flatRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => (flatRows[index]?.kind === 'group' ? groupHeight : itemHeight),
    getItemKey: (index) => flatRows[index]?.key ?? index,
    overscan: 8,
  })

  const virtualRows = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()

  const renderedKeys = useMemo(
    () => new Set(virtualRows.map((row) => flatRows[row.index]?.key).filter(Boolean) as string[]),
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

  const announce = (row: Extract<TimelineFlatRow<TItem>, { kind: 'item' }>) => {
    const day = row.group.shortLabel ?? row.group.label
    setAnnouncement(
      `${day}: ${getItemLabel(row.item)}, ${row.itemIndex + 1} of ${row.group.items.length}`,
    )
  }

  const focusRow = (index: number) => {
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
  }

  useEffect(() => {
    const key = pendingFocusRef.current
    if (!key) return
    const element = scrollRef.current?.querySelector<HTMLElement>(`[data-timeline-item="${key}"]`)
    if (element) {
      element.focus({ preventScroll: true })
      pendingFocusRef.current = null
    }
  })

  // New windows/filters start at the top; adding an event to an existing day
  // must not yank the user back up.
  const groupsKey = groups.map((group) => group.key).join('|')
  useEffect(() => {
    setActiveKey(null)
    setAnnouncement('')
    scrollRef.current?.scrollTo({ top: 0 })
  }, [groupsKey])

  const helpId = useId()

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const card = (event.target as HTMLElement).closest<HTMLElement>('[data-timeline-item]')
    if (!card) return
    const key = card.dataset.timelineItem
    if (!key) return
    const currentIndex = indexByKey.get(key)
    if (currentIndex === undefined) return
    const current = flatRows[currentIndex]
    if (!current || current.kind !== 'item') return

    let targetIndex: number | null = null

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        const step = event.key === 'ArrowDown' ? 1 : -1
        for (let i = currentIndex + step; i >= 0 && i < flatRows.length; i += step) {
          if (flatRows[i]?.kind === 'item') {
            targetIndex = i
            break
          }
        }
        break
      }
      case 'ArrowRight':
      case 'ArrowLeft': {
        const step = event.key === 'ArrowRight' ? 1 : -1
        for (
          let groupIndex = current.groupIndex + step;
          groupIndex >= 0 && groupIndex < groups.length;
          groupIndex += step
        ) {
          const candidate = firstItemIndexByGroup.get(groupIndex)
          if (candidate !== undefined) {
            targetIndex = candidate
            break
          }
        }
        break
      }
      case 'Home': {
        targetIndex = firstItemIndexByGroup.get(0) ?? null
        break
      }
      case 'End': {
        for (let i = flatRows.length - 1; i >= 0; i -= 1) {
          if (flatRows[i]?.kind === 'item') {
            targetIndex = i
            break
          }
        }
        break
      }
      case 'Enter':
      case ' ':
        event.preventDefault()
        onItemActivate?.(current.item)
        return
      default:
        return
    }

    event.preventDefault()
    if (targetIndex !== null) focusRow(targetIndex)
  }

  const empty = flatRows.length === 0
  const activate = (row: Extract<TimelineFlatRow<TItem>, { kind: 'item' }>) => {
    setActiveKey(row.key)
    announce(row)
    onItemActivate?.(row.item)
  }
  const focus = (row: Extract<TimelineFlatRow<TItem>, { kind: 'item' }>) => {
    setActiveKey(row.key)
    announce(row)
  }

  return (
    <section
      aria-label={ariaLabel}
      aria-describedby={helpId}
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-line bg-surface/60 shadow-2xl shadow-black/30"
    >
      <p id={helpId} className="sr-only">
        Grouped by day. Press Down or Up to move between events, Left or Right to jump to the
        previous or next day, Home or End to jump to the edges, and Enter to edit an event.
      </p>
      <div
        ref={scrollRef}
        onKeyDown={onKeyDown}
        className="scrollbar-thin relative min-h-0 flex-1 overflow-auto px-3"
      >
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center px-6 py-16 text-center">
            {emptyState ?? (
              <>
                <CalendarRange aria-hidden="true" className="size-7 text-faint" />
                <p className="mt-3 text-sm font-medium text-ink">Nothing scheduled</p>
                <p className="mt-1 max-w-sm text-xs text-muted">
                  No events fall inside this window. Try a wider range or clear the search.
                </p>
              </>
            )}
          </div>
        ) : (
          <div style={{ height: totalSize }} className="relative">
            {virtualRows.map((virtualRow) => {
              const row = flatRows[virtualRow.index]
              if (!row) return null

              return (
                <div
                  key={virtualRow.key}
                  style={{ transform: `translateY(${virtualRow.start}px)` }}
                  className="absolute inset-x-0 top-0"
                >
                  {row.kind === 'group' ? (
                    <TimelineGroupRow group={row.group} height={groupHeight} />
                  ) : (
                    <TimelineItemRow
                      row={row}
                      height={itemHeight}
                      tabbable={row.key === tabbableKey}
                      getItemLabel={getItemLabel}
                      renderItem={renderItem}
                      onActivate={activate}
                      onFocus={focus}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* The live region is what makes moving between groups audible. */}
      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </p>
    </section>
  )
}
