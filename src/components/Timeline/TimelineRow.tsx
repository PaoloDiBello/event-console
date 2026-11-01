import { formatCount, pluralize } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'
import type { ReactNode } from 'react'
import type { TimelineItemRowData } from './timelineModel'
import type { TimelineGroup } from './types'

interface TimelineGroupRowProps<TItem> {
  group: TimelineGroup<TItem>
  height: number
}

export function TimelineGroupRow<TItem>({ group, height }: TimelineGroupRowProps<TItem>) {
  return (
    <div style={{ height }} className="flex items-end pb-2">
      <h3 className="flex w-full items-baseline gap-2.5 border-b border-line/80 pb-2">
        <span className="text-sm font-semibold text-ink">{group.label}</span>
        <span className="font-mono text-[10px] tracking-wide text-faint">
          {formatCount(group.items.length)} {pluralize(group.items.length, 'event')}
        </span>
      </h3>
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
