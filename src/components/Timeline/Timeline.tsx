import { useVirtualizer } from '@tanstack/react-virtual'
import { CalendarDays, CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import { panelClass } from '@/components/ui/surfaces'
import { cn } from '@/shared/lib/cn'
import { formatDayShort } from '@/shared/lib/dates'
import { formatCount, pluralize } from '@/shared/lib/format'
import { useTimelineAnnouncement } from './hooks/useTimelineAnnouncement'
import { useTimelineFocus } from './hooks/useTimelineFocus'
import { useTimelineKeyboard } from './hooks/useTimelineKeyboard'
import { useTimelineModel } from './hooks/useTimelineModel'
import { TimelineGroupRow, TimelineItemRow } from './TimelineRow'
import type { TimelineItemRowData } from './timelineModel'
import type { TimelineProps } from './types'

const DEFAULT_ITEM_HEIGHT = 84
const DEFAULT_GROUP_HEIGHT = 56
/** Height of the sticky day bar that covers the top of the scrollport. */
const STICKY_DAY_HEIGHT = DEFAULT_GROUP_HEIGHT

/**
 * A day-grouped, virtualized agenda with a roving tabindex.
 *
 * Why day grouping: an event is anchored to a date, and "what is happening on
 * Thursday" is the question people actually ask. It also gives screen readers a
 * meaningful boundary — each announcement carries group + position, so focus
 * moving into a new day is never silent.
 *
 * The stateful parts live in hooks: the model flattens and indexes the rows,
 * the focus hook owns the roving tabindex and pending focus, the keyboard hook
 * owns the navigation rules, and the announcement hook owns the live region.
 */
export function Timeline<TItem>({
  groups,
  getItemId,
  getItemLabel,
  renderItem,
  onItemActivate,
  ariaLabel,
  emptyState,
  toolbar,
  footer,
  resetKey,
  itemHeight = DEFAULT_ITEM_HEIGHT,
  groupHeight = DEFAULT_GROUP_HEIGHT,
  jumpToDay,
  jumpRequestId,
}: TimelineProps<TItem>) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { flatRows, indexByKey, firstItemIndexByGroup, groupsKey } = useTimelineModel(
    groups,
    getItemId,
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
    // Rows aligned to the top of the list must clear the sticky day bar, or the
    // focused event ends up hidden behind it.
    scrollPaddingStart: STICKY_DAY_HEIGHT,
  })

  const virtualRows = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()

  // Keep the current day visible while scrolling through a long group. The
  // in-list heading is hidden behind the scrollport once a day starts, so this
  // compact sticky copy takes over at exactly that point.
  const scrollOffset = virtualizer.scrollOffset ?? 0
  const topRow = virtualRows.find((virtualRow) => virtualRow.end > scrollOffset)
  const activeGroup = topRow ? flatRows[topRow.index]?.group : undefined
  const activeGroupRowIndex = activeGroup ? indexByKey.get(`g:${activeGroup.key}`) : undefined
  const activeGroupRow =
    activeGroupRowIndex === undefined
      ? undefined
      : virtualRows.find((virtualRow) => virtualRow.index === activeGroupRowIndex)
  const showActiveGroup = Boolean(
    activeGroup && (!activeGroupRow || activeGroupRow.end <= scrollOffset),
  )

  const { announcement, announce, clearAnnouncement } = useTimelineAnnouncement(getItemLabel)
  const { setActiveKey, tabbableKey, focusRow } = useTimelineFocus({
    flatRows,
    virtualRows,
    virtualizer,
    scrollRef,
    groupsKey,
    resetKey,
    onGroupsChange: clearAnnouncement,
  })
  const lastJumpRequest = useRef<number | undefined>(undefined)
  useEffect(() => {
    if (!jumpToDay || jumpRequestId === undefined) return
    if (lastJumpRequest.current === jumpRequestId) return

    const groupIndex = groups.findIndex((group) => group.key === jumpToDay)
    if (groupIndex === -1) return
    // Aim at the day's first event, not the heading row: the sticky padding
    // then leaves the heading exactly at the top of the scrollport.
    const index = firstItemIndexByGroup.get(groupIndex) ?? indexByKey.get(`g:${jumpToDay}`)
    if (index === undefined) return

    lastJumpRequest.current = jumpRequestId
    virtualizer.scrollToIndex(index, { align: 'start' })
  }, [firstItemIndexByGroup, groups, indexByKey, jumpRequestId, jumpToDay, virtualizer])

  const onKeyDown = useTimelineKeyboard({
    groups,
    flatRows,
    indexByKey,
    firstItemIndexByGroup,
    focusRow,
    onItemActivate,
  })

  const activeGroupIndex = activeGroup
    ? groups.findIndex((candidate) => candidate.key === activeGroup.key)
    : -1
  // "Today, Wednesday 18 November" is the right heading for the day itself, but
  // it does not fit a phone's sticky bar next to the count and two chevrons —
  // it was truncating mid-word. The short form keeps the orientation word.
  const activeGroupShortLabel =
    activeGroup && /^\d{4}-\d{2}-\d{2}$/.test(activeGroup.key)
      ? formatDayShort(activeGroup.key)
      : activeGroup?.label

  const scrollToGroup = (targetGroupIndex: number) => {
    if (targetGroupIndex < 0 || targetGroupIndex >= groups.length) return
    const target = groups[targetGroupIndex]
    if (!target) return
    const firstItem = firstItemIndexByGroup.get(targetGroupIndex)
    if (firstItem !== undefined) {
      // Focus the day's first event; the heading lands directly above it.
      focusRow(firstItem, 'start')
      return
    }
    const index = indexByKey.get(`g:${target.key}`)
    if (index === undefined) return
    virtualizer.scrollToIndex(index, { align: 'start' })
  }

  const empty = flatRows.length === 0
  const activate = (row: TimelineItemRowData<TItem>) => {
    setActiveKey(row.key)
    announce(row)
    onItemActivate?.(row.item)
  }
  const focus = (row: TimelineItemRowData<TItem>) => {
    setActiveKey(row.key)
    announce(row)
  }

  const helpId = useId()

  return (
    <section aria-label={ariaLabel} aria-describedby={helpId} className={panelClass}>
      {toolbar}
      <p id={helpId} className="sr-only">
        Grouped by day. Press Down or Up to move between events, Left or Right to jump to the
        previous or next day, Home or End to jump to the edges, and Enter to edit an event.
      </p>
      <div
        ref={scrollRef}
        onKeyDown={onKeyDown}
        className="scrollbar-thin relative min-h-0 flex-1 overflow-auto px-3"
      >
        {showActiveGroup && activeGroup ? (
          <div
            data-timeline-sticky-day={activeGroup.key}
            className="pointer-events-none sticky top-0 z-20 h-0"
          >
            <div
              className={cn(
                '-mx-3 pointer-events-auto flex items-center gap-2 border-b border-line/80 bg-surface/95 px-3 py-2',
                'shadow-lg shadow-black/25 backdrop-blur',
              )}
            >
              <CalendarDays className="size-3.5 shrink-0 text-accent" />
              <span className="truncate text-xs font-semibold text-ink">
                <span className="md:hidden">{activeGroupShortLabel}</span>
                <span className="hidden md:inline">{activeGroup.label}</span>
              </span>
              <span className="ml-auto shrink-0 font-mono text-[10px] tracking-wide text-faint">
                {formatCount(activeGroup.items.length)} {pluralize(activeGroup.items.length, 'event')}
              </span>
              {groups.length > 1 ? (
                <div className="ml-1 flex items-center gap-1">
                  <button
                    type="button"
                    disabled={activeGroupIndex <= 0}
                    onClick={() => scrollToGroup(activeGroupIndex - 1)}
                    aria-label={`Previous day from ${activeGroup.label}`}
                    title="Previous day"
                    className="inline-flex size-9 items-center justify-center rounded-xs border border-line bg-canvas text-faint transition-colors hover:border-line-strong hover:bg-raised hover:text-ink disabled:pointer-events-none disabled:opacity-25"
                  >
                    <ChevronLeft aria-hidden="true" className="size-4" />
                  </button>
                  <button
                    type="button"
                    disabled={activeGroupIndex >= groups.length - 1}
                    onClick={() => scrollToGroup(activeGroupIndex + 1)}
                    aria-label={`Next day from ${activeGroup.label}`}
                    title="Next day"
                    className="inline-flex size-9 items-center justify-center rounded-xs border border-line bg-canvas text-faint transition-colors hover:border-line-strong hover:bg-raised hover:text-ink disabled:pointer-events-none disabled:opacity-25"
                  >
                    <ChevronRight aria-hidden="true" className="size-4" />
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
        {empty ? (
          emptyState ?? (
            <EmptyState
              className="h-full px-6 py-16"
              icon={<CalendarRange aria-hidden="true" className="size-7 text-faint" />}
              title="Nothing scheduled"
              hint="No events fall inside this window. Try a wider range or clear the search."
            />
          )
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
                    <TimelineGroupRow
                      group={row.group}
                      height={groupHeight}
                      groupIndex={row.groupIndex}
                      groupCount={groups.length}
                      onNavigateGroup={scrollToGroup}
                    />
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

      {footer}
    </section>
  )
}
