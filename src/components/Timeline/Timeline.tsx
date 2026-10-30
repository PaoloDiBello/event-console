import { useVirtualizer } from '@tanstack/react-virtual'
import { CalendarRange } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { cn } from '@/lib/cn'
import { formatCount, pluralize } from '@/lib/format'
import type { TimelineGroup, TimelineProps } from './types'

type FlatRow<TItem> =
  | {
      kind: 'group'
      key: string
      group: TimelineGroup<TItem>
      groupIndex: number
    }
  | {
      kind: 'item'
      key: string
      group: TimelineGroup<TItem>
      groupIndex: number
      item: TItem
      itemIndex: number
    }

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

  const flatRows = useMemo(() => {
    const rows: FlatRow<TItem>[] = []
    groups.forEach((group, groupIndex) => {
      rows.push({ kind: 'group', key: `g:${group.key}`, group, groupIndex })
      group.items.forEach((item, itemIndex) => {
        rows.push({
          kind: 'item',
          key: `i:${group.key}:${getItemId(item)}`,
          group,
          groupIndex,
          item,
          itemIndex,
        })
      })
    })
    return rows
  }, [groups, getItemId])

  const indexByKey = useMemo(() => {
    const map = new Map<string, number>()
    flatRows.forEach((row, index) => map.set(row.key, index))
    return map
  }, [flatRows])

  /** Flat index of the first item in each group, for ← / → jumps. */
  const firstItemIndexByGroup = useMemo(() => {
    const map = new Map<number, number>()
    flatRows.forEach((row, index) => {
      if (row.kind === 'item' && !map.has(row.groupIndex)) map.set(row.groupIndex, index)
    })
    return map
  }, [flatRows])

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

  const announce = (row: Extract<FlatRow<TItem>, { kind: 'item' }>) => {
    const day = row.group.shortLabel ?? row.group.label
    setAnnouncement(
      `${day}: ${getItemLabel(row.item)}, ${row.itemIndex + 1} of ${row.group.items.length}`,
    )
  }

  const focusRow = (index: number) => {
    const row = flatRows[index]
    if (!row || row.kind !== 'item') return

    const isRendered = virtualizer.getVirtualItems().some((virtualRow) => virtualRow.index === index)
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
        for (let groupIndex = current.groupIndex + step; groupIndex >= 0 && groupIndex < groups.length; groupIndex += step) {
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
                    <div style={{ height: groupHeight }} className="flex items-end pb-2">
                      <h3 className="flex w-full items-baseline gap-2.5 border-b border-line/80 pb-2">
                        <span className="text-sm font-semibold text-ink">{row.group.label}</span>
                        <span className="font-mono text-[10px] tracking-wide text-faint">
                          {formatCount(row.group.items.length)}{' '}
                          {pluralize(row.group.items.length, 'event')}
                        </span>
                      </h3>
                    </div>
                  ) : (
                    <div style={{ height: itemHeight }} className="pb-2">
                      <div
                        role="button"
                        tabIndex={row.key === tabbableKey ? 0 : -1}
                        data-timeline-item={row.key}
                        aria-label={`${getItemLabel(row.item)} ${row.group.label}. Event ${row.itemIndex + 1} of ${row.group.items.length}.`}
                        onClick={() => {
                          setActiveKey(row.key)
                          announce(row)
                          onItemActivate?.(row.item)
                        }}
                        onFocus={() => {
                          setActiveKey(row.key)
                          announce(row)
                        }}
                        className={cn(
                          'group flex h-full w-full cursor-pointer items-stretch gap-3 rounded-md border border-line bg-surface px-3 text-left',
                          'transition-colors hover:border-line-strong hover:bg-raised/80',
                          'focus-visible:border-accent/70 focus-visible:bg-raised/80 focus-visible:outline-2 focus-visible:outline-accent/70',
                        )}
                      >
                        {renderItem(row.item)}
                      </div>
                    </div>
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
