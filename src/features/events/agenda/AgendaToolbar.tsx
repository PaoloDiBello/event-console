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

      {/*
        Phone: the window gets its own full-width row and the jump controls the
        row below, all 40px tall. They used to share one 340px row at three
        different heights (32 / 36 / 40), which read as controls dropped next to
        each other rather than a toolbar. From `sm` up it is the single row it
        always was.
      */}
      <div className="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:items-center">
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <span
            aria-hidden="true"
            className="hidden font-mono text-[9px] tracking-[0.18em] text-faint uppercase lg:inline"
          >
            Window
          </span>
          <div
            role="group"
            aria-label="Timeline window"
            className={cn(segmentTrackClass, 'h-10 w-full p-1 sm:h-8 sm:w-auto sm:p-0.5')}
          >
            {TIMELINE_SCOPES.map((days) => (
              <button
                key={days}
                type="button"
                aria-pressed={scope === days}
                onClick={() => onScopeChange(days)}
                className={cn(
                  segmentClass,
                  // Equal thirds on a phone: each segment is a full thumb target
                  // instead of a 33px chip hugging the left edge of the row.
                  'h-full flex-1 font-mono text-[11px] sm:h-7 sm:flex-none sm:px-2.5',
                  scope === days ? selectedSegmentClass : 'text-muted hover:text-ink',
                )}
              >
                {days}d
              </button>
            ))}
          </div>
        </div>

        <div className="flex w-full items-center gap-1.5 sm:w-auto sm:gap-1">
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

          {/* The way back sits in the jump row, where the day it returns to is
              already on screen, instead of dropping onto a row of its own. */}
          {jumpDate !== today ? (
            <button
              type="button"
              onClick={() => onJumpDateChange(today)}
              title="Back to today"
              aria-label="Back to today"
              className={buttonClass({
                variant: 'ghost',
                size: 'md',
                className: 'h-10 shrink-0 gap-1.5 px-2.5 font-normal sm:h-9',
              })}
            >
              <CalendarCheck aria-hidden="true" className="size-3.5 text-accent" />
              <span className="text-accent">Today</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
