import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatCount, pluralize } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'
import type { ReactNode } from 'react'
import type { TimelineItemRowData } from './timelineModel'
import type { TimelineGroup } from './types'

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
        <h3 className="flex items-baseline gap-2.5">
          <span className="text-sm font-semibold text-ink">{group.label}</span>
          <span className="font-mono text-[10px] tracking-wide text-faint">
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
              className="inline-flex size-6 items-center justify-center rounded-xs border border-line bg-canvas text-faint transition-colors hover:border-line-strong hover:bg-raised hover:text-ink disabled:pointer-events-none disabled:opacity-25"
            >
              <ChevronLeft aria-hidden="true" className="size-3.5" />
            </button>
            <button
              type="button"
              disabled={groupIndex >= groupCount - 1}
              onClick={() => onNavigateGroup(groupIndex + 1)}
              aria-label={`Next day from ${group.label}`}
              title="Next day"
              className="inline-flex size-6 items-center justify-center rounded-xs border border-line bg-canvas text-faint transition-colors hover:border-line-strong hover:bg-raised hover:text-ink disabled:pointer-events-none disabled:opacity-25"
            >
              <ChevronRight aria-hidden="true" className="size-3.5" />
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
        onClick={() => onActivate(row)}
        onFocus={() => onFocus(row)}
        className={cn(
          'group flex h-full w-full cursor-pointer items-stretch gap-3 rounded-md border border-line bg-surface px-3 text-left',
          'transition-colors hover:border-line-strong hover:bg-raised/80',
          'focus-visible:border-accent/70 focus-visible:bg-raised/80 focus-visible:outline-2 focus-visible:outline-accent/70',
        )}
      >
        {renderItem(row.item)}
      </div>
    </div>
  )
}
