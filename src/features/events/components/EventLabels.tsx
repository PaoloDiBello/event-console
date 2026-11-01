import { cn } from '@/shared/lib/cn'
import {
  CATEGORY_TONE,
  PRIORITY_LABEL,
  PRIORITY_TONE,
  STATUS_LABEL,
  STATUS_TONE,
  type EventCategory,
  type EventPriority,
  type EventStatus,
} from '@/features/events/model'

export function StatusBadge({ status, className }: { status: EventStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] tracking-wide uppercase',
        STATUS_TONE[status],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}

export function PriorityLabel({ priority }: { priority: EventPriority }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs', PRIORITY_TONE[priority])}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {PRIORITY_LABEL[priority]}
    </span>
  )
}

export function CategoryLabel({
  category,
  className,
}: {
  category: EventCategory
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs capitalize',
        CATEGORY_TONE[category],
        className,
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-sm bg-current" />
      {category}
    </span>
  )
}
