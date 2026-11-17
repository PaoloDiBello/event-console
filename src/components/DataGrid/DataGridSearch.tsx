import type { RefObject } from 'react'
import { Kbd } from '@/components/ui/Kbd'
import { SearchField } from '@/components/ui/SearchField'

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
    <SearchField
      value={search}
      onValueChange={onSearchChange}
      inputRef={searchRef}
      clearLabel="Clear search field"
      placeholder={placeholder}
      disabled={disabled}
      aria-label="Search all columns"
      aria-keyshortcuts="/"
      // Full row on a phone: the primary tool on a 100k-row table should not be
      // two characters wide. The shortcut hint is meaningless on touch.
      wrapperClassName="w-full sm:w-auto sm:max-w-sm sm:flex-1"
      shortcut={
        <span className="hidden sm:inline-flex">
          <Kbd ariaHidden title="Press / to focus search" tone="faint" className="px-1.5 py-0.5">
            /
          </Kbd>
        </span>
      }
      onKeyDown={(event) => {
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
    />
  )
}
