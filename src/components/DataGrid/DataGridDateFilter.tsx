import { DayPicker } from '@daypicker/react'
import * as Popover from '@radix-ui/react-popover'
import { CalendarCheck, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { buttonClass } from '@/components/ui/buttonStyles'
import { cn } from '@/shared/lib/cn'
import { formatGridDate, parseIsoDay, toIsoDay } from '@/shared/lib/dates'
import { DataGridFilterClear } from './DataGridFilterClear'
import { filterControlClass } from './filterControlStyles'

interface DataGridDateFilterProps {
  /** Column label, used in the trigger's accessible name. */
  label: string
  /** ISO day (`2026-11-13`) or an empty string when the column is unfiltered. */
  value: string
  disabled: boolean
  onChange: (value: string | undefined) => void
}

/**
 * The date filter's trigger and calendar. A native `<input type="date">` cannot
 * show the app's calendar, cannot clear itself, and renders a locale placeholder
 * that competes with the data; this control reuses the agenda's DayPicker and
 * spells the applied day out in the trigger.
 */
export function DataGridDateFilter({
  label,
  value,
  disabled,
  onChange,
}: DataGridDateFilterProps) {
  const [open, setOpen] = useState(false)
  const active = value !== ''
  const selected = active ? parseIsoDay(value) : undefined

  const apply = (next: Date | undefined) => {
    if (!next) return
    onChange(toIsoDay(next))
    setOpen(false)
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <div className="relative">
        <Popover.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            aria-label={`Filter by ${label}${active ? `, currently ${formatGridDate(value)}` : ''}`}
            aria-haspopup="dialog"
            title={active ? `Filtered to ${formatGridDate(value)}` : `Filter by ${label}`}
            className={cn(
              filterControlClass(active),
              'flex items-center pr-8 pl-2 text-left whitespace-nowrap',
            )}
          >
            <span className="truncate">{active ? formatGridDate(value) : 'Any date'}</span>
          </button>
        </Popover.Trigger>

        {active ? (
          <DataGridFilterClear label={label} onClear={() => onChange(undefined)} />
        ) : (
          <ChevronDown
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute top-1/2 right-1.5 size-3 -translate-y-1/2 text-faint transition-transform duration-150',
              open && 'rotate-180 text-accent',
            )}
          />
        )}
      </div>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          collisionPadding={8}
          aria-label={`Filter ${label} by date`}
          className="z-50 rounded-lg border border-line-strong bg-surface p-3 shadow-2xl shadow-black/50 outline-none data-[state=open]:animate-[content-in_150ms_ease-out]"
        >
          <DayPicker
            mode="single"
            selected={selected}
            defaultMonth={selected}
            weekStartsOn={1}
            fixedWeeks
            showOutsideDays={false}
            navLayout="around"
            autoFocus
            onSelect={apply}
            className="event-calendar"
          />

          <div className="mt-2 flex min-h-8 items-center justify-between gap-3 border-t border-line pt-2">
            <span className="font-mono text-[9px] tracking-wider text-faint uppercase">
              Exact day
            </span>
            <div className="flex items-center gap-1">
              {active ? (
                <button
                  type="button"
                  onClick={() => {
                    onChange(undefined)
                    setOpen(false)
                  }}
                  className={buttonClass({
                    variant: 'ghost',
                    size: 'sm',
                    className: 'px-2',
                  })}
                >
                  Clear
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => apply(new Date())}
                className={buttonClass({
                  variant: 'ghost',
                  size: 'sm',
                  className: 'gap-1 px-2 text-accent hover:bg-accent/10 hover:text-accent',
                })}
              >
                <CalendarCheck aria-hidden="true" className="size-3.5" />
                Today
              </button>
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
