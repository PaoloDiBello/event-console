import { X } from 'lucide-react'
import type { FilterChip } from './utils'

interface DataGridFilterChipsProps {
  chips: readonly FilterChip[]
  onRemove: (columnId: string) => void
  disabled?: boolean
}

/**
 * Active filters as individual chips. The column filter row can be scrolled
 * away or hidden with its column; this row cannot, and each chip removes only
 * its own filter.
 */
export function DataGridFilterChips({
  chips,
  onRemove,
  disabled = false,
}: DataGridFilterChipsProps) {
  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5 bg-surface/80 px-3 py-2">
      <span className="mr-1 font-mono text-[10px] tracking-[0.14em] text-faint uppercase">
        Filters
      </span>
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          disabled={disabled}
          onClick={() => onRemove(chip.id)}
          aria-label={`Remove ${chip.label} filter: ${chip.value}`}
          title={`Remove ${chip.label} filter`}
          className="group inline-flex h-6 max-w-56 items-center gap-1 rounded-xs border border-line bg-canvas pr-1 pl-2 text-[11px] text-muted transition-colors hover:border-line-strong hover:text-ink disabled:opacity-50"
        >
          <span className="shrink-0 text-faint">{chip.label}</span>
          <span className="truncate text-ink">{chip.value}</span>
          <X
            aria-hidden="true"
            className="size-3 shrink-0 text-faint group-hover:text-ink"
          />
        </button>
      ))}
    </div>
  )
}
