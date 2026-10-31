import type { ColumnFiltersState, FilterFn, SortingState } from '@tanstack/react-table'
import { isBlank, type AnyColumn } from './accessors'
import { rowMatchesFilters } from './filter'
import { sortRows } from './sort'

/**
 * Filter and sort the full data set, returning new rows in display order.
 *
 * The grid owns this pass so TanStack only ever sees the current page. At 100k
 * rows that keeps the table's row model at page size and avoids re-allocating
 * the entire dataset on every render.
 */
export function buildRows<TData>(
  data: readonly TData[],
  columns: readonly AnyColumn<TData>[],
  columnFilters: ColumnFiltersState,
  globalFilter: string,
  globalFilterFn: FilterFn<TData> | undefined,
  sorting: SortingState,
): TData[] {
  const filters = columnFilters.filter((filter) => !isBlank(filter.value))
  const query = globalFilter.trim()

  let rows: TData[]
  if (filters.length === 0 && !query) {
    rows = data as TData[]
  } else {
    rows = []
    for (let index = 0; index < data.length; index += 1) {
      const row = data[index]!
      if (rowMatchesFilters(row, columns, filters, query, globalFilterFn, index)) {
        rows.push(row)
      }
    }
  }

  return sortRows(rows, columns, sorting)
}
