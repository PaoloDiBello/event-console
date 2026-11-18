import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatDayShort } from '@/shared/lib/dates'
import { formatCount, pluralize } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'
import type { ReactNode } from 'react'
import type { TimelineItemRowData } from './timelineModel'
import type { TimelineGroup } from './types'

/** Day keys are ISO; anything else (a synthetic group) keeps its own label. */
function shortGroupLabel(key: string, fallback: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(key) ? formatDayShort(key) : fallback
}

interface TimelineGroupRowProps<TItem> {
  group: TimelineGroup<TItem>
  height: number
  groupIndex?: number
  groupCount?: number
  onNavigateGroup?: (index: number) => void
}

export function TimelineGroupRow<TItem>({
  group,
  height,
  groupIndex,
  groupCount,
  onNavigateGroup,
}: TimelineGroupRowProps<TItem>) {
  return (
    <div style={{ height }} className="flex items-end pb-2">
      <div className="flex w-full items-center justify-between border-b border-line/80 pb-2">
        <h3 className="flex min-w-0 items-baseline gap-2.5">
          {/* A phone gets the short day (`Today`, `Thu 29 Oct`):
              "Today, Wednesday 18 November" wrapped to two lines and squeezed
              the chevrons on every group heading. */}
          <span className="truncate text-sm font-semibold text-ink md:hidden">
            {shortGroupLabel(group.key, group.label)}
          </span>
          <span className="hidden text-sm font-semibold text-ink md:inline">{group.label}</span>
          <span className="shrink-0 font-mono text-[10px] whitespace-nowrap text-faint">
            {formatCount(group.items.length)} {pluralize(group.items.length, 'event')}
          </span>
        </h3>
        {onNavigateGroup && groupCount !== undefined && groupIndex !== undefined ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={groupIndex === 0}
              onClick={() => onNavigateGroup(groupIndex - 1)}
              aria-label={`Previous day from ${group.label}`}
              title="Previous day"
              className="inline-flex size-9 items-center justify-center rounded-xs border border-line bg-canvas text-faint transition-colors hover:border-line-strong hover:bg-raised hover:text-ink disabled:pointer-events-none disabled:opacity-25"
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
            </button>
            <button
              type="button"
              disabled={groupIndex >= groupCount - 1}
              onClick={() => onNavigateGroup(groupIndex + 1)}
              aria-label={`Next day from ${group.label}`}
              title="Next day"
              className="inline-flex size-9 items-center justify-center rounded-xs border border-line bg-canvas text-faint transition-colors hover:border-line-strong hover:bg-raised hover:text-ink disabled:pointer-events-none disabled:opacity-25"
            >
              <ChevronRight aria-hidden="true" className="size-4" />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

interface TimelineItemRowProps<TItem> {
  row: TimelineItemRowData<TItem>
  height: number
  tabbable: boolean
  getItemLabel: (item: TItem) => string
  renderItem: (item: TItem) => ReactNode
  onActivate: (row: TimelineItemRowData<TItem>) => void
  onFocus: (row: TimelineItemRowData<TItem>) => void
}

export function TimelineItemRow<TItem>({
  row,
  height,
  tabbable,
  getItemLabel,
  renderItem,
  onActivate,
  onFocus,
}: TimelineItemRowProps<TItem>) {
  return (
    <div style={{ height }} className="pb-2">
      <div
        role="button"
        tabIndex={tabbable ? 0 : -1}
        data-timeline-item={row.key}
        aria-label={`${getItemLabel(row.item)} ${row.group.label}. Event ${row.itemIndex + 1} of ${row.group.items.length}.`}
        aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight Home End Enter Space"
        onClick={() => onActivate(row)}
        onFocus={() => onFocus(row)}
        onKeyDown={(event) => {
          // The arrow keys move the roving focus; Enter/Space activates.
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onActivate(row)
          }
        }}
        className={cn(
          'group flex h-full w-full cursor-pointer items-stretch gap-3 rounded-md border border-line bg-surface px-3 text-left',
          'transition-colors hover:border-line-strong hover:bg-raised/80',
          'focus-visible:border-accent/70 focus-visible:bg-raised/80 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent/70',
        )}
      >
        {renderItem(row.item)}
      </div>
    </div>
  )
}
