import { Search, X } from 'lucide-react'
import type { RefObject } from 'react'

interface DataGridSearchProps {
  search: string
  onSearchChange: (value: string) => void
  searchRef: RefObject<HTMLInputElement | null>
  placeholder?: string
  disabled?: boolean
}

/**
 * Global search input. Search is intentionally separate from column filters:
 * it has its own clear affordance and never contributes to the filter count.
 */
export function DataGridSearch({
  search,
  onSearchChange,
  searchRef,
  placeholder = 'Search rows…',
  disabled = false,
}: DataGridSearchProps) {
  return (
    <div className="group relative min-w-56 flex-1 sm:max-w-sm">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint"
      />
      <input
        ref={searchRef}
        type="search"
        value={search}
        disabled={disabled}
        onChange={(event) => onSearchChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            if (search) onSearchChange('')
            else event.currentTarget.blur()
            return
          }
          // "/" focuses this field. If it was already focused and empty,
          // pressing it again is the shortcut, not a request to find a slash.
          if (
            event.key === '/' &&
            search === '' &&
            !event.metaKey &&
            !event.ctrlKey &&
            !event.altKey
          ) {
            event.preventDefault()
          }
        }}
        placeholder={placeholder}
        aria-label="Search all columns"
        aria-keyshortcuts="/"
        className="h-9 w-full rounded-sm border border-line bg-canvas pr-16 pl-9 text-sm text-ink placeholder:text-faint focus:border-accent/60 focus:ring-2 focus:ring-accent/20 focus:outline-none disabled:opacity-50 [&::-webkit-search-cancel-button]:hidden"
      />
      {search ? (
        <button
          type="button"
          onClick={() => onSearchChange('')}
          aria-label="Clear search field"
          title="Clear search"
          className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-xs p-1 text-faint transition-colors hover:text-ink"
        >
          <X aria-hidden="true" className="size-3.5" />
        </button>
      ) : (
        <kbd
          aria-hidden="true"
          title="Press / to focus search"
          className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded-xs border border-line bg-raised px-1.5 py-0.5 font-mono text-[10px] text-faint group-focus-within:hidden"
        >
          /
        </kbd>
      )}
    </div>
  )
}
