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
import { useState, type Ref } from 'react'
import { cn } from '@/shared/lib/cn'

export interface SelectMenuOption {
  value: string
  label: string
}

interface SelectMenuProps {
  /** The field id, so the visible <label> can name the trigger. */
  id: string
  /** Field name, used as the trigger's accessible name and the menu label. */
  label: string
  value: string
  options: readonly SelectMenuOption[]
  onValueChange: (value: string) => void
  triggerRef?: Ref<HTMLButtonElement>
  onBlur?: () => void
  triggerClassName?: string
  disabled?: boolean
  hasError?: boolean
  describedBy?: string
}

const ITEM_CLASS =
  'flex cursor-pointer items-center gap-2 rounded-xs py-1.5 pr-2 pl-1.5 text-xs text-muted outline-none select-none data-[highlighted]:bg-canvas data-[highlighted]:text-ink data-[state=checked]:text-ink'

/**
 * A select-shaped control backed by the app's own menu.
 *
 * The native `<select>` popup is drawn by the operating system, so it ignores
 * the console palette and looks like a different app. This keeps the form's
 * four choice fields in the same menu language as the grid filters: a raised
 * surface, a check on the current option, and keyboard support from Radix.
 */
export function SelectMenu({
  id,
  label,
  value,
  options,
  onValueChange,
  triggerRef,
  onBlur,
  triggerClassName,
  disabled = false,
  hasError = false,
  describedBy,
}: SelectMenuProps) {
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => option.value === value)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          type="button"
          id={id}
          ref={triggerRef}
          onBlur={onBlur}
          aria-label={label}
          aria-haspopup="menu"
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy}
          className={cn(
            'flex w-full items-center justify-between gap-2 text-left',
            'data-[state=open]:border-accent/60',
            triggerClassName,
          )}
        >
          <span className="truncate">{selected?.label ?? value}</span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              'size-3.5 shrink-0 text-faint transition-transform duration-150',
              open && 'rotate-180',
            )}
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuPortal>
        <DropdownMenuContent
          align="start"
          sideOffset={6}
          collisionPadding={8}
          aria-label={`${label} options`}
          className="scrollbar-thin z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto overscroll-contain rounded-md border border-line-strong bg-raised p-1 shadow-2xl shadow-black/60"
        >
          <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
            {options.map((option) => (
              <DropdownMenuRadioItem
                key={option.value}
                value={option.value}
                className={ITEM_CLASS}
              >
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
