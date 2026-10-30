import type {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  Row,
  SortingState,
} from '@tanstack/react-table'

/**
 * The grid owns filtering, sorting and pagination for the full data set and
 * only hands the visible page to TanStack Table. That keeps the table's row
 * model at page size (50–250) instead of 100k, which is the difference between
 * an interactive grid and a multi-second garbage-collection pause whenever a
 * row is added.
 *
 * These helpers implement the small slice of TanStack's column API the grid
 * relies on: accessor values, filter functions and sort comparators.
 */

type AnyColumn<TData> = ColumnDef<TData, unknown>

interface RowShim<TData> {
  original: TData
  getValue: (columnId: string) => unknown
}

export function columnId<TData>(column: AnyColumn<TData>): string {
  if (column.id) return column.id
  if ('accessorKey' in column && typeof column.accessorKey === 'string') {
    return column.accessorKey
  }
  return ''
}

function readPath(row: unknown, path: string): unknown {
  if (!path.includes('.')) return (row as Record<string, unknown>)[path]
  let current: unknown = row
  for (const part of path.split('.')) {
    if (current == null) return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

export function cellValue<TData>(
  row: TData,
  column: AnyColumn<TData>,
  index = 0,
): unknown {
  if ('accessorFn' in column && column.accessorFn) {
    return column.accessorFn(row, index)
  }
  if ('accessorKey' in column && typeof column.accessorKey === 'string') {
    return readPath(row, column.accessorKey)
  }
  return undefined
}

function valueById<TData>(
  row: TData,
  id: string,
  columns: readonly AnyColumn<TData>[],
  index = 0,
): unknown {
  const column = columns.find((candidate) => columnId(candidate) === id)
  return column ? cellValue(row, column, index) : undefined
}

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || value === ''
}

function asText(value: unknown): string {
  return value == null ? '' : String(value)
}

function includes(value: unknown, filterValue: unknown): boolean {
  return asText(value).toLowerCase().includes(asText(filterValue).toLowerCase())
}

function equalsString(value: unknown, filterValue: unknown): boolean {
  return asText(value).toLowerCase() === asText(filterValue).toLowerCase()
}

/**
 * Evaluate one column filter. Custom functions receive the same shape they
 * would from TanStack (`row.original`, `row.getValue`) so column definitions
 * remain portable.
 */
function matchesColumnFilter<TData>(
  row: TData,
  column: AnyColumn<TData>,
  filterValue: unknown,
  columns: readonly AnyColumn<TData>[],
  index: number,
): boolean {
  const id = columnId(column)
  const value = cellValue(row, column, index)
  const filterFn = column.filterFn

  if (typeof filterFn === 'function') {
    const shim: RowShim<TData> = {
      original: row,
      getValue: (columnId) => valueById(row, columnId, columns, index),
    }
    return filterFn(
      shim as unknown as Row<TData>,
      id,
      filterValue,
      () => undefined,
    )
  }

  if (filterFn === 'equalsString') return equalsString(value, filterValue)
  if (filterFn === 'includesString') return includes(value, filterValue)
  if (filterFn === 'equals') return value === filterValue
  if (filterFn === 'weakEquals') return asText(value) === asText(filterValue)

  // No explicit function: fall back to the filter control's semantics.
  switch (column.meta?.filter) {
    case 'select':
      return equalsString(value, filterValue)
    case 'date':
      return (
        asText(value) === asText(filterValue) ||
        asText(value).startsWith(`${asText(filterValue)}T`)
      )
    default:
      return includes(value, filterValue)
  }
}

function matchesGlobalFilter<TData>(
  row: TData,
  columns: readonly AnyColumn<TData>[],
  value: string,
  globalFilterFn: FilterFn<TData> | undefined,
  index: number,
): boolean {
  if (typeof globalFilterFn === 'function') {
    const shim: RowShim<TData> = {
      original: row,
      getValue: (columnId) => valueById(row, columnId, columns, index),
    }
    return globalFilterFn(
      shim as unknown as Row<TData>,
      '',
      value,
      () => undefined,
    )
  }

  // TanStack's default `auto` filter searches every column.
  return columns.some((column) => includes(cellValue(row, column, index), value))
}

function compareValues(a: unknown, b: unknown, text: boolean): number {
  if (a === b) return 0
  if (a == null) return b == null ? 0 : 1
  if (b == null) return -1
  if (!text && typeof a === 'number' && typeof b === 'number') return a - b
  const left = asText(a).toLowerCase()
  const right = asText(b).toLowerCase()
  return left < right ? -1 : left > right ? 1 : 0
}

const naturalCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

function sortKey<TData>(
  row: TData,
  column: AnyColumn<TData> | undefined,
  index: number,
): unknown {
  if (!column) return undefined
  if (column.meta?.sortValue) return column.meta.sortValue(row)
  return cellValue(row, column, index)
}

/**
 * Filter and sort the full data set, returning new rows in display order.
 * Sort keys are computed once per row (not once per comparison), so sorting
 * 100k rows stays a linear key pass plus a comparison sort.
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
      let keep = true
      for (const filter of filters) {
        const column = columns.find((candidate) => columnId(candidate) === filter.id)
        if (!column) continue
        if (!matchesColumnFilter(row, column, filter.value, columns, index)) {
          keep = false
          break
        }
      }
      if (keep && query) {
        keep = matchesGlobalFilter(row, columns, query, globalFilterFn, index)
      }
      if (keep) rows.push(row)
    }
  }

  if (sorting.length === 0 || rows.length < 2) return rows

  const plans = sorting
    .map((sort) => {
      const column = columns.find((candidate) => columnId(candidate) === sort.id)
      if (!column) return null
      const hasSortValue = Boolean(column.meta?.sortValue)
      const comparator = hasSortValue ? undefined : column.sortingFn
      return {
        desc: sort.desc,
        column,
        text: !hasSortValue && comparator === 'text',
        comparator: typeof comparator === 'function' ? comparator : undefined,
        natural: !hasSortValue && comparator === 'alphanumeric',
      }
    })
    .filter((plan): plan is NonNullable<typeof plan> => plan !== null)

  if (plans.length === 0) return rows

  const keys: unknown[][] = plans.map(() => new Array(rows.length))
  const shims = new Map<TData, RowShim<TData>>()

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]!
    for (let planIndex = 0; planIndex < plans.length; planIndex += 1) {
      const plan = plans[planIndex]!
      if (plan.comparator) {
        let shim = shims.get(row)
        if (!shim) {
          shim = {
            original: row,
            getValue: (columnId) => valueById(row, columnId, columns, index),
          }
          shims.set(row, shim)
        }
        keys[planIndex]![index] = shim
      } else {
        keys[planIndex]![index] = sortKey(row, plan.column, index)
      }
    }
  }

  const indices = Array.from({ length: rows.length }, (_, index) => index)
  indices.sort((leftIndex, rightIndex) => {
    for (let planIndex = 0; planIndex < plans.length; planIndex += 1) {
      const plan = plans[planIndex]!
      let result: number
      if (plan.comparator) {
        const left = keys[planIndex]![leftIndex] as RowShim<TData>
        const right = keys[planIndex]![rightIndex] as RowShim<TData>
        result = plan.comparator(
          left as unknown as Row<TData>,
          right as unknown as Row<TData>,
          columnId(plan.column),
        )
      } else {
        const left = keys[planIndex]![leftIndex]
        const right = keys[planIndex]![rightIndex]
        result = plan.natural
          ? naturalCollator.compare(asText(left), asText(right))
          : compareValues(left, right, plan.text)
      }
      if (result !== 0) return plan.desc ? -result : result
    }
    return leftIndex - rightIndex
  })

  return indices.map((index) => rows[index]!)
}
