import { useVirtualizer } from '@tanstack/react-virtual'
import { CalendarRange } from 'lucide-react'
import { useId, useRef } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import { useTimelineAnnouncement } from './hooks/useTimelineAnnouncement'
import { useTimelineFocus } from './hooks/useTimelineFocus'
import { useTimelineKeyboard } from './hooks/useTimelineKeyboard'
import { useTimelineModel } from './hooks/useTimelineModel'
import { TimelineGroupRow, TimelineItemRow } from './TimelineRow'
import type { TimelineItemRowData } from './timelineModel'
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
  itemHeight = DEFAULT_ITEM_HEIGHT,
  groupHeight = DEFAULT_GROUP_HEIGHT,
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
  })

  const virtualRows = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()

  const { announcement, announce, clearAnnouncement } = useTimelineAnnouncement(getItemLabel)
  const { setActiveKey, tabbableKey, focusRow } = useTimelineFocus({
    flatRows,
    virtualRows,
    virtualizer,
    scrollRef,
    groupsKey,
    onGroupsChange: clearAnnouncement,
  })
  const onKeyDown = useTimelineKeyboard({
    groups,
    flatRows,
    indexByKey,
    firstItemIndexByGroup,
    focusRow,
    onItemActivate,
  })

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
