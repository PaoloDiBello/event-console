import * as Popover from '@radix-ui/react-popover'
import { useId, useMemo, useState } from 'react'
import type { ControllerRenderProps } from 'react-hook-form'
import { cn } from '@/shared/lib/cn'
import type { EventFormValues } from './schema'
import { inputClass } from './styles'

/** Enough to choose from without turning the field into a directory. */
const MAX_SUGGESTIONS = 6

interface SuggestionFieldProps {
  id: 'owner' | 'location'
  label: string
  field: ControllerRenderProps<EventFormValues, 'owner' | 'location'>
  /** Values already used in the registry; anything else can still be typed. */
  suggestions: readonly string[]
  placeholder: string
  autoComplete?: string
  hasError: boolean
}

/**
 * Free-text input that suggests existing values as you type.
 *
 * The input keeps focus for the whole interaction and points at the active
 * option with `aria-activedescendant`, so the combobox is one tab stop and
 * typing is never interrupted by a focus move.
 */
export function SuggestionField({
  id,
  label,
  field,
  suggestions,
  placeholder,
  autoComplete = 'off',
  hasError,
}: SuggestionFieldProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const listId = useId()
  const optionId = (index: number) => `${listId}-option-${index}`

  const query = field.value.trim().toLowerCase()
  const matches = useMemo(() => {
    const seen = new Set<string>()
    const next: string[] = []

    for (const value of suggestions) {
      const key = value.toLowerCase()
      // An exact match needs no suggestion; duplicates are collapsed.
      if (key === query || !key.includes(query) || seen.has(key)) continue
      seen.add(key)
      next.push(value)
      if (next.length === MAX_SUGGESTIONS) break
    }

    return next
  }, [suggestions, query])

  const expanded = open && matches.length > 0

  const close = () => {
    setOpen(false)
    setActiveIndex(-1)
  }

  const choose = (value: string) => {
    field.onChange(value)
    close()
  }

  return (
    <Popover.Root open={expanded} onOpenChange={setOpen}>
      <Popover.Anchor asChild>
        <div className="relative">
          <input
            {...field}
            id={id}
            type="text"
            placeholder={placeholder}
            autoComplete={autoComplete}
            autoCapitalize="words"
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded={expanded}
            aria-controls={expanded ? listId : undefined}
            aria-autocomplete="list"
            aria-activedescendant={
              expanded && activeIndex >= 0 ? optionId(activeIndex) : undefined
            }
            aria-invalid={hasError}
            aria-describedby={hasError ? `${id}-error` : undefined}
            onChange={(event) => {
              field.onChange(event)
              setOpen(true)
              setActiveIndex(-1)
            }}
            onFocus={() => setOpen(true)}
            onBlur={close}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                if (!matches.length) return
                event.preventDefault()
                setOpen(true)
                setActiveIndex((index) => {
                  const next = event.key === 'ArrowDown' ? index + 1 : index - 1
                  return Math.min(Math.max(next, 0), matches.length - 1)
                })
                return
              }

              if (event.key === 'Enter' && expanded && activeIndex >= 0) {
                event.preventDefault()
                choose(matches[activeIndex]!)
                return
              }

              if (event.key === 'Escape' && expanded) {
                // Close the suggestions only; the Escape that closes the
                // dialog must not fire from inside an open list.
                event.preventDefault()
                event.stopPropagation()
                close()
              }
            }}
            className={inputClass}
          />
        </div>
      </Popover.Anchor>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          collisionPadding={8}
          aria-label={`${label} suggestions`}
          onOpenAutoFocus={(event) => {
            // The caret stays in the input while the list is open.
            event.preventDefault()
          }}
          className="z-50 max-h-64 w-[var(--radix-popper-anchor-width)] overflow-y-auto rounded-lg border border-line-strong bg-surface p-1 shadow-2xl shadow-black/50 outline-none data-[state=open]:animate-[content-in_150ms_ease-out]"
        >
          <ul id={listId} role="listbox" aria-label={label} className="space-y-0.5">
            {matches.map((value, index) => (
              <li
                key={value}
                id={optionId(index)}
                role="option"
                aria-selected={index === activeIndex}
                onMouseDown={(event) => {
                  // Keep focus (and the caret) in the input while clicking.
                  event.preventDefault()
                }}
                onClick={() => choose(value)}
                className={cn(
                  'cursor-pointer rounded-xs px-2 py-1.5 text-xs transition-colors',
                  index === activeIndex
                    ? 'bg-accent/15 text-ink'
                    : 'text-muted hover:bg-raised hover:text-ink',
                )}
              >
                {value}
              </li>
            ))}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
