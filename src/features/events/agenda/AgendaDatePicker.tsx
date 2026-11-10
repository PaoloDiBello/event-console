import { DayPicker } from '@daypicker/react'
import * as Popover from '@radix-ui/react-popover'
import { CalendarDays, ChevronDown } from 'lucide-react'
import { useState } from 'react'
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
          className="flex h-10 min-w-[10.5rem] items-center gap-2 rounded-md border border-line bg-surface/60 px-2.5 text-left transition-colors hover:border-line-strong hover:bg-raised/50"
        >
          <CalendarDays aria-hidden="true" className="size-3.5 shrink-0 text-faint" />
          <span className="font-mono text-[10px] tracking-wider text-faint uppercase">Jump</span>
          <span className="tnum font-mono text-[11px] text-ink">{formatDayShort(value)}</span>
          <ChevronDown aria-hidden="true" className="ml-auto size-3.5 shrink-0 text-faint" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          collisionPadding={8}
          aria-label="Choose a date to jump to"
          className="z-50 rounded-lg border border-line-strong bg-surface p-3 shadow-2xl shadow-black/50 outline-none data-[state=open]:animate-[content-in_150ms_ease-out]"
        >
          <DayPicker
            mode="single"
            required
            selected={selected}
            defaultMonth={selected}
            startMonth={parseIsoDay(min)}
            endMonth={parseIsoDay(max)}
            weekStartsOn={1}
            fixedWeeks
            showOutsideDays={false}
            navLayout="around"
            autoFocus
            disabled={(date) => {
              const iso = toIsoDay(date)
              return iso < min || iso > max
            }}
            onSelect={(date) => choose(toIsoDay(date))}
            className="agenda-calendar"
          />

          <div className="mt-2 flex items-center justify-between gap-3 border-t border-line pt-2">
            <span className="font-mono text-[9px] tracking-wider text-faint uppercase">
              Next 45 days
            </span>
            <button
              type="button"
              onClick={() => choose(min)}
              className="rounded-xs px-1.5 py-0.5 font-mono text-[10px] text-accent transition-colors hover:bg-accent/10"
            >
              Today
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
