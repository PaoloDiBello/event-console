import { DayPicker } from '@daypicker/react'
import * as Popover from '@radix-ui/react-popover'
import { CalendarCheck, CalendarDays } from 'lucide-react'
import { useState } from 'react'
import type { ControllerRenderProps } from 'react-hook-form'
import { buttonClass } from '@/components/ui/buttonStyles'
import { cn } from '@/shared/lib/cn'
import { formatGridDate, parseIsoDay, toIsoDay } from '@/shared/lib/dates'
import type { EventFormValues } from './schema'
import { isRealIsoDay } from './schema'
import { inputClass } from './styles'

interface EventDateFieldProps {
  field: ControllerRenderProps<EventFormValues, 'date'>
  hasError: boolean
}

/**
 * Date field with an integrated DayPicker popover calendar.
 * Supports direct typing of ISO dates (YYYY-MM-DD) or picking
 * directly from the custom themed in-app calendar.
 */
export function EventDateField({ field, hasError }: EventDateFieldProps) {
  const [open, setOpen] = useState(false)
  const isValid = isRealIsoDay(field.value)
  const parsedDate = isValid ? parseIsoDay(field.value) : undefined

  const apply = (date: Date | undefined) => {
    if (!date) return
    field.onChange(toIsoDay(date))
    setOpen(false)
  }

  return (
    <div className="relative">
      <input
        {...field}
        id="date"
        type="text"
        placeholder="YYYY-MM-DD"
        autoComplete="off"
        spellCheck={false}
        aria-required="true"
        aria-invalid={hasError}
        aria-describedby={hasError ? 'date-error' : 'date-hint'}
        onKeyDown={(event) => {
          if ((event.altKey && event.key === 'ArrowDown') || event.key === 'F4') {
            event.preventDefault()
            setOpen(true)
          }
        }}
        className={cn(inputClass, 'pr-9')}
      />

      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            aria-haspopup="dialog"
            aria-label="Open calendar"
            title="Open calendar (Alt+Down)"
            className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-xs p-1 text-faint transition-colors hover:bg-raised hover:text-ink focus-visible:text-accent"
          >
            <CalendarDays aria-hidden="true" className="size-4" />
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            align="end"
            sideOffset={6}
            collisionPadding={8}
            aria-label="Choose event date"
            className="z-50 rounded-lg border border-line-strong bg-surface p-3 shadow-2xl shadow-black/50 outline-none data-[state=open]:animate-[content-in_150ms_ease-out]"
          >
            <DayPicker
              mode="single"
              selected={parsedDate}
              defaultMonth={parsedDate}
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
                {parsedDate ? formatGridDate(field.value) : 'Select a date'}
              </span>
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
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  )
}
