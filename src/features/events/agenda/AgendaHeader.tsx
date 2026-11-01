import { Search, X } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Kbd } from '@/components/ui/Kbd'
import { formatCount } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'
import { TIMELINE_SCOPES, type TimelineScope } from './agendaData'

interface AgendaHeaderProps {
  scope: TimelineScope
  onScopeChange: (scope: TimelineScope) => void
  query: string
  onQueryChange: (query: string) => void
  total: number
  dayCount: number
  atRisk: number
}

export function AgendaHeader({
  scope,
  onScopeChange,
  query,
  onQueryChange,
  total,
  dayCount,
  atRisk,
}: AgendaHeaderProps) {
  return (
    <PageHeader
      title="Agenda"
      description={`The next ${scope} days, grouped by day and virtualized. Arrow keys move between events and days; every move is announced with its day and position.`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-md border border-line bg-surface/60 px-2.5 py-2">
          <span className="font-mono text-[10px] tracking-wider text-faint uppercase">Window</span>
          <div
            role="group"
            aria-label="Timeline window"
            className="flex rounded-sm border border-line bg-canvas p-0.5"
          >
            {TIMELINE_SCOPES.map((days) => (
              <button
                key={days}
                type="button"
                aria-pressed={scope === days}
                onClick={() => onScopeChange(days)}
                className={cn(
                  'rounded-xs px-2 py-1 font-mono text-[11px] transition-colors',
                  scope === days
                    ? 'bg-accent/15 text-accent'
                    : 'text-muted hover:bg-raised hover:text-ink',
                )}
              >
                {days}d
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-faint"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Filter the agenda…"
            aria-label="Filter timeline events"
            className="h-10 w-56 rounded-md border border-line bg-surface/60 pr-8 pl-8 text-xs text-ink placeholder:text-faint focus:border-accent/60 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {query ? (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              aria-label="Clear timeline filter"
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-xs p-1 text-faint hover:text-ink"
            >
              <X aria-hidden="true" className="size-3.5" />
            </button>
          ) : null}
        </div>

        <p className="tnum rounded-md border border-line bg-surface/60 px-3 py-2 font-mono text-[11px] text-muted">
          <span className="text-ink">{formatCount(total)}</span> events ·{' '}
          <span className="text-ink">{formatCount(dayCount)}</span> days ·{' '}
          <span className="text-rose">{formatCount(atRisk)}</span> at risk
        </p>

        <div className="hidden items-center gap-1.5 pl-1 text-[10px] text-faint xl:flex">
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
    </PageHeader>
  )
}
