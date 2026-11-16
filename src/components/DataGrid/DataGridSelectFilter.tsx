import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemIndicator,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu'
import { Check, ChevronDown, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/shared/lib/cn'
import { filterControlClass } from './filterControlStyles'

interface DataGridSelectFilterProps {
  /** Column label, used in the trigger's accessible name. */
  label: string
  /** Selected option values. Empty means the column is unfiltered. */
  values: readonly string[]
  options: readonly { value: string; label: string }[]
  disabled: boolean
  onChange: (values: string[]) => void
  /**
   * Rows each option would leave under the other filters. Called when the menu
   * opens, not per render, so the 100k-row pass only runs while it is visible.
   */
  getCounts?: () => Record<string, number>
}

const ITEM_CLASS =
  'flex cursor-pointer items-center gap-2 rounded-xs py-1.5 pr-2 pl-1.5 text-xs text-muted outline-none select-none data-[highlighted]:bg-canvas data-[highlighted]:text-ink data-[state=checked]:text-ink'

/**
 * A multi-select facet. Several values in one column mean "any of these", which
 * is the question a registry user actually asks — meetings and deploys in one
 * look, not one category at a time.
 *
 * The items are checkboxes that keep the menu open, so choosing a second value
 * never costs a reopen. Each row shows how many events that option would leave
 * with the other filters applied, so the choice is informed rather than blind.
 */
export function DataGridSelectFilter({
  label,
  values,
  options,
  disabled,
  onChange,
  getCounts,
}: DataGridSelectFilterProps) {
  const [open, setOpen] = useState(false)
  const [counts, setCounts] = useState<Record<string, number> | null>(null)

  const active = values.length > 0
  const selected = values.map(
    (value) => options.find((option) => option.value === value)?.label ?? value,
  )
  const current =
    selected.length === 0
      ? 'All'
      : selected.length === 1
        ? selected[0]!
        : `${selected[0]!} +${selected.length - 1}`
  const selection = selected.join(', ')

  const toggle = (value: string) => {
    onChange(
      values.includes(value)
        ? values.filter((candidate) => candidate !== value)
        : [...values, value],
    )
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    // The other filters and the search can change while this is closed, so the
    // counts are read on open instead of being cached with the menu.
    setCounts(next && getCounts ? getCounts() : null)
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <div className="relative">
        <DropdownMenuTrigger asChild disabled={disabled}>
          <button
            type="button"
            data-grid-filter=""
            aria-label={`Filter by ${label}${active ? `, currently ${selection}` : ''}`}
            title={active ? `Filtered to ${selection}` : `Filter by ${label}`}
            className={cn(
              filterControlClass(active),
              'flex items-center pr-6 pl-2 text-left whitespace-nowrap data-[state=open]:border-accent/70 data-[state=open]:bg-canvas',
            )}
          >
            <span className="truncate">{current}</span>
          </button>
        </DropdownMenuTrigger>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute top-1/2 right-1.5 size-3 -translate-y-1/2 transition-transform duration-150',
            active ? 'text-accent' : 'text-faint',
            open && 'rotate-180',
          )}
        />
      </div>

      <DropdownMenuPortal>
        {/* A facet like Owner or Location has as many options as the data does,
            so the menu is capped to the space Radix measured and scrolls inside
            it rather than running off the bottom of the window. */}
        <DropdownMenuContent
          aria-label={`${label} filter`}
          align="start"
          sideOffset={6}
          collisionPadding={8}
          className="scrollbar-thin z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] w-max min-w-[var(--radix-dropdown-menu-trigger-width)] max-w-[var(--radix-dropdown-menu-content-available-width)] overflow-y-auto overscroll-contain rounded-md border border-line-strong bg-raised p-1 shadow-2xl shadow-black/60"
        >
          {options.map((option) => {
            const checked = values.includes(option.value)
            const count = counts?.[option.value]
            return (
              <DropdownMenuCheckboxItem
                key={option.value}
                // The count is the reason to look at the list, so it belongs in
                // the name a screen reader reads, not just in the pixels.
                aria-label={
                  count === undefined
                    ? option.label
                    : `${option.label}, ${count} ${count === 1 ? 'row' : 'rows'}`
                }
                checked={checked}
                onCheckedChange={() => toggle(option.value)}
                // Deliberately not closing: picking two categories is the point.
                onSelect={(event) => event.preventDefault()}
                className={ITEM_CLASS}
              >
                <span className="flex size-3.5 shrink-0 items-center justify-center">
                  <DropdownMenuItemIndicator>
                    <Check aria-hidden="true" className="size-3.5 text-accent" />
                  </DropdownMenuItemIndicator>
                </span>
                <span className="truncate">{option.label}</span>
                {count === undefined ? null : (
                  <span
                    aria-hidden="true"
                    className={cn(
                      'tnum ml-auto pl-4 font-mono text-[10px]',
                      count === 0 ? 'text-faint/50' : 'text-faint',
                    )}
                  >
                    {count}
                  </span>
                )}
              </DropdownMenuCheckboxItem>
            )
          })}

          <DropdownMenuSeparator className="my-1 h-px bg-line" />
          <DropdownMenuItem
            disabled={!active}
            onSelect={() => onChange([])}
            className="flex cursor-pointer items-center gap-2 rounded-xs px-2 py-1.5 text-xs text-faint outline-none data-[disabled]:cursor-default data-[disabled]:opacity-40 data-[highlighted]:bg-canvas data-[highlighted]:text-ink"
          >
            <X aria-hidden="true" className="size-3" />
            Clear
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  )
}
