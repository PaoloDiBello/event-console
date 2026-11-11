import { Kbd } from '@/components/ui/Kbd'
import { footerClass } from '@/components/ui/surfaces'
import { formatCount, pluralize } from '@/shared/lib/format'

interface AgendaFooterProps {
  total: number
  dayCount: number
}

/** Status row for the agenda panel, matching the grid's pagination footer. */
export function AgendaFooter({ total, dayCount }: AgendaFooterProps) {
  return (
    <div className={footerClass}>
      <p className="tnum">
        <span className="font-mono text-ink">{formatCount(total)}</span>{' '}
        {pluralize(total, 'event')} in{' '}
        <span className="font-mono text-ink">{formatCount(dayCount)}</span>{' '}
        {pluralize(dayCount, 'day')}
      </p>

      <div className="ml-auto hidden items-center gap-1.5 text-[10px] text-faint lg:flex">
        <Kbd className="inline-flex h-5 min-w-5 px-1">↑</Kbd>
        <Kbd className="inline-flex h-5 min-w-5 px-1">↓</Kbd>
        <span>move</span>
        <span aria-hidden="true" className="mx-1 text-line-strong">
          /
        </span>
        <Kbd className="inline-flex h-5 min-w-5 px-1">←</Kbd>
        <Kbd className="inline-flex h-5 min-w-5 px-1">→</Kbd>
        <span>day</span>
        <span aria-hidden="true" className="mx-1 text-line-strong">
          /
        </span>
        <Kbd className="inline-flex h-5 min-w-5 px-1">↵</Kbd>
        <span>edit</span>
      </div>
    </div>
  )
}
