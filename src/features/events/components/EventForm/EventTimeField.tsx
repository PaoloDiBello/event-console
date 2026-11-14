import * as Popover from '@radix-ui/react-popover'
import { Check, Clock } from 'lucide-react'
import {
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from 'react'
import { flushSync } from 'react-dom'
import type { ControllerRenderProps } from 'react-hook-form'
import { buttonClass } from '@/components/ui/buttonStyles'
import { cn } from '@/shared/lib/cn'
import type { EventFormValues } from './schema'
import { inputClass } from './styles'

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))
const PRESETS = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00']
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/

function getNowTime(): string {
  const now = new Date()
  const h = now.getHours()
  const m = Math.round(now.getMinutes() / 5) * 5
  const finalHour = m === 60 ? (h + 1) % 24 : h
  const finalMinute = m === 60 ? 0 : m
  return `${String(finalHour).padStart(2, '0')}:${String(finalMinute).padStart(2, '0')}`
}

/**
 * A listbox keeps exactly one tab stop and moves its selection with the arrow
 * keys. Both columns are fixed arrays, so the next option is an index lookup;
 * the matching option is focused directly so the roving tab stop follows the
 * value without adding a tab stop per option.
 */
function moveSelection(
  event: ReactKeyboardEvent<HTMLButtonElement>,
  list: HTMLDivElement | null,
  options: readonly string[],
  current: string | null,
  select: (value: string) => void,
) {
  const index = current === null ? -1 : options.indexOf(current)
  let next: string | undefined

  switch (event.key) {
    case 'ArrowDown':
      next = options[Math.min(index + 1, options.length - 1)]
      break
    case 'ArrowUp':
      next = options[Math.max(index - 1, 0)]
      break
    case 'Home':
      next = options[0]
      break
    case 'End':
      next = options[options.length - 1]
      break
    default:
      return
  }

  event.preventDefault()
  if (next === undefined) return

  // The option only announces as selected once React has re-rendered, so the
  // value must land before focus moves to it.
  flushSync(() => select(next))
  list?.querySelector<HTMLElement>(`[data-value="${next}"]`)?.focus()
}

interface TimeColumnProps {
  label: string
  options: readonly string[]
  /** `null` while the field holds something that is not a valid `HH:mm`. */
  value: string | null
  listRef: RefObject<HTMLDivElement | null>
  onSelect: (value: string) => void
}

function TimeColumn({ label, options, value, listRef, onSelect }: TimeColumnProps) {
  return (
    <div>
      <span className="block font-mono text-[9px] tracking-wider text-faint uppercase">
        {label}
      </span>
      <div
        ref={listRef}
        role="listbox"
        aria-label={label}
        className="scrollbar-thin mt-0.5 max-h-24 overflow-y-auto space-y-0.5 pr-1"
      >
        {options.map((option, index) => {
          const isSelected = option === value
          // An empty field has no selected option, so the first one keeps the
          // list rememberable by keyboard instead of leaving it with no tab stop.
          const isTabStop = isSelected || (value === null && index === 0)
          return (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={isSelected}
              tabIndex={isTabStop ? 0 : -1}
              data-value={option}
              onClick={() => onSelect(option)}
              onKeyDown={(event) => moveSelection(event, listRef.current, options, value, onSelect)}
              className={cn(
                'w-full rounded-xs py-1 text-center font-mono text-xs transition-colors',
                isSelected
                  ? 'bg-accent text-canvas font-semibold'
                  : 'text-muted hover:bg-raised hover:text-ink',
              )}
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface EventTimeFieldProps {
  field: ControllerRenderProps<EventFormValues, 'startTime'>
  hasError: boolean
}

/**
 * Time field with an integrated in-app popover time picker.
 * Supports direct typing of 24-hour time (HH:mm), quick meeting presets,
 * dual hour/minute listboxes, and a one-click "Now" shortcut.
 */
export function EventTimeField({ field, hasError }: EventTimeFieldProps) {
  const [open, setOpen] = useState(false)
  const hourListRef = useRef<HTMLDivElement>(null)
  const minuteListRef = useRef<HTMLDivElement>(null)

  const match = TIME_PATTERN.exec(field.value)
  const currentHour = match?.[1] ?? null
  const currentMinute = match?.[2] ?? null

  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => {
      for (const list of [hourListRef.current, minuteListRef.current]) {
        list
          ?.querySelector<HTMLElement>('[aria-selected="true"]')
          ?.scrollIntoView({ block: 'nearest' })
      }
    })
  }, [open])

  const selectHour = (hour: string) => {
    field.onChange(`${hour}:${currentMinute ?? '00'}`)
  }

  const selectMinute = (minute: string) => {
    field.onChange(`${currentHour ?? '00'}:${minute}`)
  }

  const selectPreset = (time: string) => {
    field.onChange(time)
    setOpen(false)
  }

  const handleNow = () => {
    field.onChange(getNowTime())
    setOpen(false)
  }

  return (
    <div className="relative">
      <input
        {...field}
        id="startTime"
        type="text"
        placeholder="HH:MM"
        autoComplete="off"
        spellCheck={false}
        aria-required="true"
        aria-invalid={hasError}
        aria-describedby={hasError ? 'startTime-error' : 'startTime-hint'}
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
            aria-label="Open time picker"
            title="Open time picker (Alt+Down)"
            className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-xs p-1 text-faint transition-colors hover:bg-raised hover:text-ink focus-visible:text-accent"
          >
            <Clock aria-hidden="true" className="size-4" />
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            align="end"
            sideOffset={6}
            collisionPadding={8}
            aria-label="Choose start time"
            className="scrollbar-thin z-50 max-h-[var(--radix-popover-content-available-height)] w-64 overflow-y-auto overscroll-contain rounded-lg border border-line-strong bg-surface p-3 shadow-2xl shadow-black/50 outline-none data-[state=open]:animate-[content-in_150ms_ease-out]"
            onOpenAutoFocus={(event) => {
              // Land on the current hour instead of the first quick preset, so
              // the arrow keys are immediately useful. With an empty field the
              // first hour is the list's only tab stop.
              event.preventDefault()
              const list = hourListRef.current
              const target =
                list?.querySelector<HTMLElement>('[aria-selected="true"]') ??
                list?.querySelector<HTMLElement>('[role="option"]')
              target?.focus()
            }}
          >
            <div className="flex items-center justify-between border-b border-line pb-2">
              <span className="font-mono text-[10px] tracking-wider text-faint uppercase">
                Time (24h)
              </span>
              <span className="tnum font-mono text-xs font-semibold text-accent">
                {match ? `${match[1]}:${match[2]}` : '—'}
              </span>
            </div>

            {/* Quick Presets */}
            <div className="mt-2">
              <span className="font-mono text-[9px] tracking-wider text-faint uppercase">
                Quick times
              </span>
              <div role="group" aria-label="Quick times" className="mt-1 grid grid-cols-4 gap-1">
                {PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => selectPreset(preset)}
                    className={cn(
                      'rounded-xs px-1 py-1 text-center font-mono text-[11px] transition-colors',
                      field.value === preset
                        ? 'bg-accent text-canvas font-semibold'
                        : 'border border-line bg-canvas text-muted hover:border-line-strong hover:text-ink',
                    )}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Hours and Minutes Columns */}
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-line pt-2">
              <TimeColumn
                label="Hours"
                options={HOURS}
                value={currentHour}
                listRef={hourListRef}
                onSelect={selectHour}
              />
              <TimeColumn
                label="Minutes"
                options={MINUTES}
                value={currentMinute}
                listRef={minuteListRef}
                onSelect={selectMinute}
              />
            </div>

            {/* Footer */}
            <div className="mt-3 flex items-center justify-between border-t border-line pt-2">
              <button
                type="button"
                onClick={handleNow}
                className={buttonClass({
                  variant: 'ghost',
                  size: 'sm',
                  className: 'gap-1 px-2 text-accent hover:bg-accent/10 hover:text-accent',
                })}
              >
                <Clock aria-hidden="true" className="size-3.5" />
                Now
              </button>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className={buttonClass({
                  variant: 'secondary',
                  size: 'sm',
                  className: 'gap-1 px-2.5',
                })}
              >
                <Check aria-hidden="true" className="size-3" />
                Done
              </button>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  )
}
