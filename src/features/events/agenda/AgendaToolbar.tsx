import { CalendarCheck, ChevronLeft, ChevronRight } from 'lucide-react'
import { buttonClass } from '@/components/ui/buttonStyles'
import { SearchField } from '@/components/ui/SearchField'
import {
  segmentClass,
  segmentTrackClass,
  selectedSegmentClass,
  toolbarClass,
} from '@/components/ui/surfaces'
import { cn } from '@/shared/lib/cn'
import { shiftIsoDay } from '@/shared/lib/dates'
import { AgendaDatePicker } from './AgendaDatePicker'
import { TIMELINE_SCOPES, type TimelineScope } from './agendaData'

interface AgendaToolbarProps {
  scope: TimelineScope
  onScopeChange: (scope: TimelineScope) => void
  query: string
  onQueryChange: (query: string) => void
  /** Today's ISO day; drives the one-click return when you have jumped away. */
  today: string
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
  today,
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
        wrapperClassName="w-full sm:w-auto sm:max-w-sm sm:flex-1"
      />

      <div className="ml-auto flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
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

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={jumpDate <= jumpMin}
            onClick={() => onJumpDateChange(shiftIsoDay(jumpDate, -1))}
            aria-label="Previous day"
            title="Previous day"
            className={buttonClass({
              variant: 'secondary',
              size: 'md',
              // Full-size on a phone; the same button the desktop keeps, one
              // step larger than the surrounding controls.
              className: 'h-10 w-10 justify-center p-0 disabled:opacity-30 sm:h-9 sm:w-9',
            })}
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </button>

          <AgendaDatePicker
            value={jumpDate}
            min={jumpMin}
            max={jumpMax}
            onChange={onJumpDateChange}
          />

          <button
            type="button"
            disabled={jumpDate >= jumpMax}
            onClick={() => onJumpDateChange(shiftIsoDay(jumpDate, 1))}
            aria-label="Next day"
            title="Next day"
            className={buttonClass({
              variant: 'secondary',
              size: 'md',
              className: 'h-10 w-10 justify-center p-0 disabled:opacity-30 sm:h-9 sm:w-9',
            })}
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </button>
        </div>

        {jumpDate !== today ? (
          <button
            type="button"
            onClick={() => onJumpDateChange(today)}
            title="Back to today"
            className={buttonClass({
              variant: 'ghost',
              size: 'md',
              className: 'gap-1.5 px-2.5 font-normal',
            })}
          >
            <CalendarCheck aria-hidden="true" className="size-3.5 text-accent" />
            <span className="text-accent">Today</span>
          </button>
        ) : null}
      </div>
    </div>
  )
}
