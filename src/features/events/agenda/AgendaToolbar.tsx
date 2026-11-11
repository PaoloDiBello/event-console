import { SearchField } from '@/components/ui/SearchField'
import {
  segmentClass,
  segmentTrackClass,
  selectedSegmentClass,
  toolbarClass,
} from '@/components/ui/surfaces'
import { cn } from '@/shared/lib/cn'
import { AgendaDatePicker } from './AgendaDatePicker'
import { TIMELINE_SCOPES, type TimelineScope } from './agendaData'

interface AgendaToolbarProps {
  scope: TimelineScope
  onScopeChange: (scope: TimelineScope) => void
  query: string
  onQueryChange: (query: string) => void
  jumpDate: string
  jumpMin: string
  jumpMax: string
  onJumpDateChange: (date: string) => void
}

/**
 * The agenda's panel toolbar. It mirrors the grid toolbar: search on the left,
 * view controls beside it, and nothing competing with the page header.
 */
export function AgendaToolbar({
  scope,
  onScopeChange,
  query,
  onQueryChange,
  jumpDate,
  jumpMin,
  jumpMax,
  onJumpDateChange,
}: AgendaToolbarProps) {
  return (
    <div className={toolbarClass}>
      <SearchField
        value={query}
        onValueChange={onQueryChange}
        clearLabel="Clear timeline filter"
        placeholder="Filter the agenda…"
        aria-label="Filter timeline events"
        wrapperClassName="sm:max-w-sm"
      />

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="hidden font-mono text-[9px] tracking-[0.18em] text-faint uppercase lg:inline"
          >
            Window
          </span>
          <div role="group" aria-label="Timeline window" className={segmentTrackClass}>
            {TIMELINE_SCOPES.map((days) => (
              <button
                key={days}
                type="button"
                aria-pressed={scope === days}
                onClick={() => onScopeChange(days)}
                className={cn(
                  segmentClass,
                  'font-mono text-[11px]',
                  scope === days ? selectedSegmentClass : 'text-muted hover:text-ink',
                )}
              >
                {days}d
              </button>
            ))}
          </div>
        </div>

        <AgendaDatePicker
          value={jumpDate}
          min={jumpMin}
          max={jumpMax}
          onChange={onJumpDateChange}
        />
      </div>
    </div>
  )
}
