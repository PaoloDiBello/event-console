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
      wrapperClassName="sm:max-w-sm"
      shortcut={
        <Kbd ariaHidden title="Press / to focus search" tone="faint" className="px-1.5 py-0.5">
          /
        </Kbd>
      }
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
    />
  )
}
