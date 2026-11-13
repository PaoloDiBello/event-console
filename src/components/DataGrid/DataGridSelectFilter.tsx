import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItemIndicator,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu'
import { Check, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/shared/lib/cn'
import { filterControlClass } from './filterControlStyles'

interface DataGridSelectFilterProps {
  /** Column label, used in the trigger's accessible name. */
  label: string
  /** Selected option value, or an empty string when the column is unfiltered. */
  value: string
  options: readonly { value: string; label: string }[]
  disabled: boolean
  onChange: (value: string | undefined) => void
}

/** Radix radio groups cannot use an empty string as a value. */
const ALL_VALUE = '__all__'

const ITEM_CLASS =
  'flex cursor-pointer items-center gap-2 rounded-xs py-1.5 pr-2 pl-1.5 text-xs text-muted outline-none select-none data-[highlighted]:bg-canvas data-[highlighted]:text-ink data-[state=checked]:text-ink'

/**
 * The select filter's trigger and menu. The native `<select>` popup is drawn by
 * the operating system, so it ignores the console palette and looks like a
 * different app; this keeps the menu in the same raised surface as the column
 * menu and marks the current option with a check.
 */
export function DataGridSelectFilter({
  label,
  value,
  options,
  disabled,
  onChange,
}: DataGridSelectFilterProps) {
  const active = value !== ''
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => option.value === value)
  const current = active ? (selected?.label ?? value) : 'All'

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <div className="relative">
        <DropdownMenuTrigger asChild disabled={disabled}>
          <button
            type="button"
            aria-label={`Filter by ${label}${active ? `, currently ${current}` : ''}`}
            title={active ? `Filtered to ${current}` : `Filter by ${label}`}
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
        <DropdownMenuContent
          align="start"
          sideOffset={6}
          collisionPadding={8}
          className="z-50 min-w-36 rounded-md border border-line-strong bg-raised p-1 shadow-2xl shadow-black/60"
        >
          <DropdownMenuRadioGroup
            value={active ? value : ALL_VALUE}
            onValueChange={(next) => onChange(next === ALL_VALUE ? undefined : next)}
          >
            <DropdownMenuRadioItem value={ALL_VALUE} className={ITEM_CLASS}>
              <span className="flex size-3.5 shrink-0 items-center justify-center">
                <DropdownMenuItemIndicator>
                  <Check aria-hidden="true" className="size-3.5 text-accent" />
                </DropdownMenuItemIndicator>
              </span>
              <span className="truncate">All</span>
            </DropdownMenuRadioItem>

            {options.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value} className={ITEM_CLASS}>
                <span className="flex size-3.5 shrink-0 items-center justify-center">
                  <DropdownMenuItemIndicator>
                    <Check aria-hidden="true" className="size-3.5 text-accent" />
                  </DropdownMenuItemIndicator>
                </span>
                <span className="truncate">{option.label}</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  )
}
