import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItemIndicator,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu'
import { Check, Rows2, Rows3, Rows4 } from 'lucide-react'
import { buttonClass } from '@/components/ui/buttonStyles'
import type { RowDensity } from './density'

const OPTIONS = [
  { value: 'compact', label: 'Compact', hint: '32 px rows', Icon: Rows4 },
  { value: 'comfortable', label: 'Comfortable', hint: '44 px rows', Icon: Rows3 },
  { value: 'spacious', label: 'Spacious', hint: '56 px rows', Icon: Rows2 },
] as const

interface DensityMenuProps {
  value: RowDensity
  onValueChange: (value: RowDensity) => void
}

const ITEM_CLASS =
  'flex cursor-pointer items-center gap-2 rounded-xs py-1.5 pr-2 pl-1.5 text-xs text-muted outline-none select-none data-[highlighted]:bg-canvas data-[highlighted]:text-ink data-[state=checked]:text-ink'

/**
 * Row density as one named control instead of three abbreviations.
 *
 * "Comp / Comf / Spac" made the reader decode the toolbar; the menu spells the
 * choices out, previews each one with a row-count icon, and shows the current
 * value with the same check used by every other menu in the panel.
 */
export function DensityMenu({ value, onValueChange }: DensityMenuProps) {
  const current = OPTIONS.find((option) => option.value === value) ?? OPTIONS[1]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Row density: ${current.label}`}
          title={`Row density: ${current.label}`}
          className={buttonClass({
            size: 'md',
            className: 'w-9 justify-center gap-2 px-0 sm:w-auto sm:px-3',
          })}
        >
          <current.Icon aria-hidden="true" className="size-3.5" />
          {/* Icon-only on a phone; the trigger's accessible name still says
              which density is active. */}
          <span className="hidden sm:inline">Density</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        aria-label="Row density options"
        className="z-50 min-w-52 rounded-md border border-line-strong bg-raised p-1 shadow-2xl shadow-black/60"
      >
        <DropdownMenuLabel className="px-2 py-1.5 font-mono text-[10px] tracking-widest text-faint uppercase">
          Row density
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(next) => onValueChange(next as RowDensity)}
        >
          {OPTIONS.map(({ value: optionValue, label, hint, Icon }) => (
            <DropdownMenuRadioItem
              key={optionValue}
              value={optionValue}
              className={ITEM_CLASS}
            >
              <span className="flex size-3.5 shrink-0 items-center justify-center">
                <DropdownMenuItemIndicator>
                  <Check aria-hidden="true" className="size-3.5 text-accent" />
                </DropdownMenuItemIndicator>
              </span>
              <Icon aria-hidden="true" className="size-3.5 text-faint" />
              <span className="truncate">{label}</span>
              <span className="ml-auto font-mono text-[10px] text-faint">{hint}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
