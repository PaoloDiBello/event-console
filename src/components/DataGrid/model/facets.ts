import type { ColumnFiltersState, FilterFn } from '@tanstack/react-table'
import { asText, cellValue, columnId as columnIdOf, isBlank, type AnyColumn } from './accessors'
import { rowMatchesFilters } from './filter'

/**
 * How many rows each option of `columnId` would leave, with the other filters
 * and the search applied.
 *
 * The column's own filter is left out: counting with it applied would describe
 * the selection instead of the choice, and every unselected option would read
 * zero. Keeping the other filters in means the counts answer the question the
 * user actually has — "what happens to my result set if I add this?".
 *
 * One pass over the data, computed only while the menu is open, so this costs
 * about what a normal filter pass does and never runs during typing.
 */
export function collectFacetCounts<TData>(
  data: readonly TData[],
  columns: readonly AnyColumn<TData>[],
  columnFilters: ColumnFiltersState,
  globalFilter: string,
  globalFilterFn: FilterFn<TData> | undefined,
  columnId: string,
): Record<string, number> {
  const column = columns.find((candidate) => columnIdOf(candidate) === columnId)
  if (!column) return {}

  const filters = columnFilters.filter(
    (filter) => filter.id !== columnId && !isBlank(filter.value),
  )
  const query = globalFilter.trim()
  const counts: Record<string, number> = {}

  for (let index = 0; index < data.length; index += 1) {
    const row = data[index]!
    if (!rowMatchesFilters(row, columns, filters, query, globalFilterFn, index)) continue
    const key = asText(cellValue(row, column, index))
    counts[key] = (counts[key] ?? 0) + 1
  }

  return counts
}
