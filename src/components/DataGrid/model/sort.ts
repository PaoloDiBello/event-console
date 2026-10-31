import type { Row, SortingState } from '@tanstack/react-table'
import {
  asText,
  cellValue,
  columnId,
  valueById,
  type AnyColumn,
  type RowShim,
} from './accessors'

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
 * Sort a filtered row set. Sort keys are computed once per row (not once per
 * comparison), so sorting 100k rows stays a linear key pass plus a comparison
 * sort.
 */
export function sortRows<TData>(
  rows: TData[],
  columns: readonly AnyColumn<TData>[],
  sorting: SortingState,
): TData[] {
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
