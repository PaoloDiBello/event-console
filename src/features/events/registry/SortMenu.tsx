import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItemIndicator,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu'
import type { SortingState } from '@tanstack/react-table'
import { ArrowUpDown, Check } from 'lucide-react'
import { buttonClass } from '@/components/ui/buttonStyles'

/**
 * The sort modes the registry offers. `relevance` is the hidden sort-only
 * column; the rest map to visible headers, so the menu and the header arrows
 * always describe the same state.
 */
const OPTIONS = [
  { value: 'relevance:desc', label: 'Nearest to today', hint: 'Default' },
  { value: 'when:desc', label: 'Newest first' },
  { value: 'when:asc', label: 'Oldest first' },
  { value: 'title:asc', label: 'Title A–Z' },
  { value: 'priority:asc', label: 'Priority', hint: 'Critical first' },
] as const

type SortValue = (typeof OPTIONS)[number]['value']

const ITEM_CLASS =
  'flex cursor-pointer items-center gap-2 rounded-xs py-1.5 pr-2 pl-1.5 text-xs text-muted outline-none select-none data-[highlighted]:bg-canvas data-[highlighted]:text-ink data-[state=checked]:text-ink'

function toSortValue(sorting: SortingState): SortValue | null {
  const first = sorting[0]
  if (!first) return null
  const value = `${first.id}:${first.desc ? 'desc' : 'asc'}`
  return OPTIONS.find((option) => option.value === value)?.value ?? null
}

interface SortMenuProps {
  value: SortingState
  onValueChange: (sorting: SortingState) => void
}

/**
 * The registry opens on nearest-to-today, which is a hidden column — without
 * this menu the only way back to it would be a URL. It also names the order in
 * words, which the header arrow cannot do on a phone.
 */
export function SortMenu({ value, onValueChange }: SortMenuProps) {
  const current = OPTIONS.find((option) => option.value === toSortValue(value))

  const choose = (next: string) => {
    const [id, direction] = next.split(':')
    if (!id) return
    onValueChange([{ id, desc: direction === 'desc' }])
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Sort: ${current?.label ?? 'custom'}`}
          title={current ? `Sorted by ${current.label}` : 'Choose a sort order'}
          className={buttonClass({
            size: 'md',
            className: 'justify-center gap-2 px-2.5',
          })}
        >
          <ArrowUpDown aria-hidden="true" className="size-3.5" />
          {/* The label is the point: a phone has no tooltips, so four bare
              icons in a row asked the reader to guess. */}
          <span>Sort</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        aria-label="Sort order"
        className="z-50 min-w-56 rounded-md border border-line-strong bg-raised p-1 shadow-2xl shadow-black/60"
      >
        <DropdownMenuLabel className="px-2 py-1.5 font-mono text-[10px] tracking-widest text-faint uppercase">
          Sort by
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup value={toSortValue(value) ?? ''} onValueChange={choose}>
          {OPTIONS.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value} className={ITEM_CLASS}>
              <span className="flex size-3.5 shrink-0 items-center justify-center">
                <DropdownMenuItemIndicator>
                  <Check aria-hidden="true" className="size-3.5 text-accent" />
                </DropdownMenuItemIndicator>
              </span>
              <span className="truncate">{option.label}</span>
              {'hint' in option ? (
                <span className="ml-auto font-mono text-[10px] text-faint">{option.hint}</span>
              ) : null}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
