import { formatGridDate } from '@/shared/lib/dates'
import { isBlank } from './model/accessors'
import type { DataGridColumn } from './types'

/** Number of active per-column filters. Global search is a query, not a filter. */
export function activeFilterCount(
  columnFilters: readonly { id: string; value: unknown }[],
): number {
  return columnFilters.filter((filter) => !isBlank(filter.value)).length
}

/**
 * The minimal shape shared by a TanStack `Column` and a raw `ColumnDef`:
 * both carry `id` and a `columnDef` with optional `header` and `meta`.
 */
type ColumnLike = {
  id: string
  columnDef?: {
    header?: unknown
    meta?: {
      filter?: 'text' | 'select' | 'date'
      filterOptions?: readonly { value: string; label: string }[]
    }
  }
}

/**
 * The string label for a column, used by the header and the visibility menu.
 * Header renderers may be nodes; in that case fall back to the column id.
 * Accepts either a TanStack `Column` (from the table) or a raw `ColumnDef`
 * (when the table instance is not available), since both expose the same
 * header/id surface.
 */
export function columnLabel(
  column: ColumnLike | undefined,
  fallback = '',
): string {
  if (!column) return fallback
  const header = column.columnDef?.header
  return typeof header === 'string' ? header : column.id
}

/** One active filter value, rendered as a removable chip. */
export interface FilterChip {
  /** Stable per-value key: a column can contribute several chips. */
  key: string
  /** Column the chip belongs to. */
  id: string
  label: string
  value: string
  /**
   * The raw value to remove. Undefined for a single-value filter (text, date),
   * where removing the chip drops the whole column filter.
   */
  raw?: string
}

/**
 * The human label for a filter value. Selects use the option label, dates use
 * the grid's compact day format, and everything else falls back to the raw
 * value the column stores.
 */
export function filterChipValue(
  column: ColumnLike | undefined,
  raw: string,
): string {
  const meta = column?.columnDef?.meta
  const option = meta?.filterOptions?.find(
    (candidate) => candidate.value === raw,
  )
  if (option) return option.label
  if (meta?.filter === 'date') return formatGridDate(raw)
  return raw
}

/**
 * Turn filter state into chips the user can read and remove one at a time.
 *
 * This reads `columnFilters`, not the header row, so a filter on a hidden
 * column still gets a chip instead of becoming invisible and stuck. The
 * column definitions are passed in rather than a TanStack `Table` instance
 * because the instance is recreated on every render and would defeat the
 * memo that wraps this function.
 */
export function filterChips<TData>(
  columns: readonly DataGridColumn<TData>[],
  columnFilters: readonly { id: string; value: unknown }[],
): FilterChip[] {
  const chips: FilterChip[] = []

  for (const filter of columnFilters) {
    if (isBlank(filter.value)) continue
    const column = columns.find(
      (candidate) =>
        candidate.id === filter.id ||
        (candidate as { accessorKey?: string }).accessorKey === filter.id,
    )
    const like = asColumnLike(column)
    const label = columnLabel(like, filter.id)
    const values = Array.isArray(filter.value) ? filter.value : [filter.value]

    // A multi-select column gets one chip per value so a single option can be
    // dropped without reopening the menu and reconstructing the selection.
    for (const value of values) {
      const raw = String(value)
      chips.push({
        key: `${filter.id}:${raw}`,
        id: filter.id,
        label,
        value: filterChipValue(like, raw),
        raw: Array.isArray(filter.value) ? raw : undefined,
      })
    }
  }

  return chips
}

/** Coerce a TanStack Column or a raw ColumnDef to the shared shape. */
function asColumnLike(column: { id?: string; columnDef?: unknown; header?: unknown; meta?: unknown } | undefined): ColumnLike | undefined {
  if (!column) return undefined
  // A TanStack `Column` wraps its def in `.columnDef`; a raw `ColumnDef` is
  // the def itself, so read either slot.
  const def = (column as { columnDef?: unknown }).columnDef ?? column
  return {
    id: column.id ?? '',
    columnDef: def as ColumnLike['columnDef'],
  }
}