import type { ComponentProps, ReactNode, Ref } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

interface SearchFieldProps
  extends Omit<ComponentProps<'input'>, 'value' | 'onChange' | 'type' | 'ref'> {
  value: string
  onValueChange: (value: string) => void
  inputRef?: Ref<HTMLInputElement>
  /** Accessible name for the clear button, e.g. "Clear search field". */
  clearLabel: string
  /** Optional keyboard hint shown while the field is empty. */
  shortcut?: ReactNode
  wrapperClassName?: string
}

/**
 * The one search control. Grid and agenda both use it, so the icon, height,
 * radius, clear affordance and focus treatment cannot drift apart.
 */
export function SearchField({
  value,
  onValueChange,
  inputRef,
  clearLabel,
  shortcut,
  wrapperClassName,
  className,
  placeholder = 'Search…',
  ...props
}: SearchFieldProps) {
  return (
    <div className={cn('group relative min-w-56 flex-1', wrapperClassName)}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint"
      />
      <input
        {...props}
        ref={inputRef}
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onValueChange(event.target.value)}
        className={cn(
          'h-9 w-full rounded-sm border border-line bg-canvas pr-10 pl-9 text-sm text-ink',
          'placeholder:text-faint transition-colors focus:border-accent/60 focus:ring-2',
          'focus:ring-accent/20 focus:outline-none disabled:opacity-50',
          '[&::-webkit-search-cancel-button]:hidden',
          className,
        )}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onValueChange('')}
          aria-label={clearLabel}
          title={clearLabel}
          className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-xs p-1 text-faint transition-colors hover:text-ink"
        >
          <X aria-hidden="true" className="size-3.5" />
        </button>
      ) : shortcut ? (
        <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 group-focus-within:hidden">
          {shortcut}
        </span>
      ) : null}
    </div>
  )
}
