import { DayPicker } from '@daypicker/react'
import * as Popover from '@radix-ui/react-popover'
import { differenceInCalendarDays } from 'date-fns'
import { CalendarCheck, CalendarDays, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { buttonClass } from '@/components/ui/buttonStyles'
import { formatDayFull, formatDayShort, parseIsoDay, toIsoDay } from '@/shared/lib/dates'

interface AgendaDatePickerProps {
  value: string
  min: string
  max: string
  onChange: (date: string) => void
}

export function AgendaDatePicker({ value, min, max, onChange }: AgendaDatePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = parseIsoDay(value)
  const windowDays = differenceInCalendarDays(parseIsoDay(max), parseIsoDay(min)) + 1

  const choose = (date: string) => {
    onChange(date)
    setOpen(false)
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-haspopup="dialog"
          aria-label={`Jump to date. Currently ${formatDayFull(value)}`}
          title={formatDayFull(value)}
          className={buttonClass({
            size: 'md',
            className:
              // Centred while the button stretches across a phone row: the
              // icon, day and chevron read as one control instead of three
              // items pinned to the opposite edges.
              'h-10 min-w-0 flex-1 justify-center gap-2 px-2.5 font-normal sm:h-9 sm:flex-none sm:justify-start sm:min-w-[10.5rem]',
          })}
        >
          <CalendarDays aria-hidden="true" className="size-3.5 shrink-0 text-faint" />
          <span className="flex items-baseline gap-2">
            <span className="hidden font-mono text-[10px] tracking-wider text-faint uppercase sm:inline">
              Jump
            </span>
            <span className="tnum font-mono text-[11px] text-ink">{formatDayShort(value)}</span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className="size-3.5 shrink-0 text-faint sm:ml-auto"
          />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
                    align="center"
          sideOffset={8}
          collisionPadding={10}
          aria-label="Choose a date to jump to"
          className="z-50 w-[19.5rem] max-w-[calc(100vw-1.25rem)] rounded-lg border border-line-strong bg-surface p-3 shadow-2xl shadow-black/60 outline-none data-[state=open]:animate-[content-in_150ms_ease-out]">
          <DayPicker
            mode="single"
            required
            selected={selected}
            defaultMonth={selected}
            startMonth={parseIsoDay(min)}
            endMonth={parseIsoDay(max)}
            weekStartsOn={1}
            fixedWeeks
            // Outside days keep every row the same shape; hiding them left a
            // half-empty first row and a lonely 30 at the bottom.
            showOutsideDays
            navLayout="around"
            autoFocus
            disabled={(date) => {
              const iso = toIsoDay(date)
              return iso < min || iso > max
            }}
            onSelect={(date) => choose(toIsoDay(date))}
            className="event-calendar"
          />

          <div className="mt-2 flex min-h-8 items-center justify-between gap-3 border-t border-line pt-2">
            <span className="font-mono text-[9px] tracking-wider text-faint uppercase">
              Next {windowDays} days
            </span>
            {value !== min ? (
              <button
                type="button"
                onClick={() => choose(min)}
                className={buttonClass({
                  variant: 'ghost',
                  size: 'sm',
                  className: 'gap-1 px-2 text-accent hover:bg-accent/10 hover:text-accent',
                })}
              >
                <CalendarCheck aria-hidden="true" className="size-3.5" />
                Today
              </button>
            ) : null}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
