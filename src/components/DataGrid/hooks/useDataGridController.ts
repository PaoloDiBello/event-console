import {
  getCoreRowModel,
  useReactTable,
  type Column,
  type ColumnFiltersState,
  type FilterFn,
  type PaginationState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import { useCallback, useDeferredValue, useEffect, useMemo, useState, useTransition } from 'react'
import { buildRows } from '../model'
import { activeFilterCount } from '../utils'
import type { DataGridColumn } from '../types'

interface DataGridControllerOptions<TData> {
  data: TData[]
  columns: DataGridColumn<TData>[]
  getRowId: (row: TData) => string
  globalFilterFn?: FilterFn<TData>
  initialSorting?: SortingState
  initialPageSize: number
  initialColumnVisibility?: VisibilityState
}

/**
 * The grid's state machine: search, sort, filters, visibility, pagination and
 * the TanStack table instance.
 *
 * The view only composes markup; every rule about when the page resets lives
 * here, next to the state it resets.
 */
export function useDataGridController<TData>({
  data,
  columns,
  getRowId,
  globalFilterFn,
  initialSorting,
  initialPageSize,
  initialColumnVisibility,
}: DataGridControllerOptions<TData>) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting ?? [])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialColumnVisibility ?? {},
  )
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  })

  // Search is the one control that can reasonably outrun the 100k-row filter
  // pass: the input stays urgent, the table catches up on the deferred value.
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [isPending, startTransition] = useTransition()

  const resetPage = useCallback(() => {
    setPagination((current) =>
      current.pageIndex === 0 ? current : { ...current, pageIndex: 0 },
    )
  }, [])

  useEffect(() => {
    setGlobalFilter(deferredSearch.trim())
    resetPage()
  }, [deferredSearch, resetPage])

  // Filter, sort and count the full data set here, then give TanStack only the
  // current page. Its row model stays small even when the source is 100k rows.
  const displayRows = useMemo(
    () => buildRows(data, columns, columnFilters, globalFilter, globalFilterFn, sorting),
    [data, columns, columnFilters, globalFilter, globalFilterFn, sorting],
  )
  const filteredCount = displayRows.length
  const pageCount = Math.max(1, Math.ceil(filteredCount / pagination.pageSize))

  // Filters can shrink the list below the current page without going through
  // the pagination controls; keep the index inside the valid range.
  useEffect(() => {
    setPagination((current) => {
      const maxPage = Math.max(0, Math.ceil(filteredCount / current.pageSize) - 1)
      return current.pageIndex > maxPage ? { ...current, pageIndex: maxPage } : current
    })
  }, [filteredCount])

  const pageRows = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize
    return displayRows.slice(start, start + pagination.pageSize)
  }, [displayRows, pagination.pageIndex, pagination.pageSize])

  // TanStack Table intentionally exposes non-memoizable instance methods; the
  // controller is not compiled by React Compiler.
  // oxlint-disable-next-line react/incompatible-library
  const table = useReactTable({
    data: pageRows,
    columns,
    getRowId,
    state: { sorting, columnFilters, globalFilter, columnVisibility, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    // Passing `undefined` here would override TanStack's `'auto'` default and
    // silently turn global search off, so fall back explicitly.
    globalFilterFn: globalFilterFn ?? 'auto',
    // The grid does the work; the table only renders the supplied page.
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount,
    // Turn off the built-in auto reset: page resets are handled next to the
    // filter/sort controls so they are easy to reason about.
    autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel(),
  })

  const rows = table.getRowModel().rows
  const visibleColumns = table.getVisibleLeafColumns()
  const filterCount = activeFilterCount(columnFilters)
  const hasSearch = globalFilter.length > 0
  const hasFilters = filterCount > 0
  const showFilterRow = useMemo(
    () => visibleColumns.some((column) => column.columnDef.meta?.filter),
    [visibleColumns],
  )

  const clearSearch = useCallback(() => {
    setSearch('')
    setGlobalFilter('')
    resetPage()
  }, [resetPage])

  const clearColumnFilters = useCallback(() => {
    setColumnFilters([])
    resetPage()
  }, [resetPage])

  // Only the empty state resets both: the toolbar keeps search and filters
  // independent so one never silently discards the other.
  const clearAll = useCallback(() => {
    setSearch('')
    setGlobalFilter('')
    setColumnFilters([])
    resetPage()
  }, [resetPage])

  const sortByColumn = useCallback(
    (column: Column<TData, unknown>, event: unknown) => {
      const handler = column.getToggleSortingHandler()
      if (!handler) return
      // Sorting 100k rows is a non-urgent update: keep the UI responsive and
      // show the pending hint.
      startTransition(() => handler(event))
      resetPage()
    },
    [resetPage],
  )

  const filterByColumn = useCallback(
    (column: Column<TData, unknown>, value: string | undefined) => {
      column.setFilterValue(value)
      resetPage()
    },
    [resetPage],
  )

  const setPage = useCallback((pageIndex: number) => {
    setPagination((current) => ({ ...current, pageIndex }))
  }, [])

  const setPageSize = useCallback((pageSize: number) => {
    setPagination((current) => ({ ...current, pageSize, pageIndex: 0 }))
  }, [])

  const rangeStart = filteredCount === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1
  const rangeEnd = Math.min(filteredCount, (pagination.pageIndex + 1) * pagination.pageSize)

  // A fresh page/filter/sort should start at the top of the list, not halfway
  // down a scroll container that is now showing different rows.
  const resetKey = JSON.stringify([
    sorting,
    columnFilters,
    globalFilter,
    pagination.pageIndex,
    pagination.pageSize,
  ])

  return {
    table,
    rows,
    visibleColumns,
    displayRows,
    filteredCount,
    pageCount,
    pagination,
    search,
    setSearch,
    isPending,
    sorting,
    filterCount,
    hasSearch,
    hasFilters,
    showFilterRow,
    resetKey,
    clearSearch,
    clearColumnFilters,
    clearAll,
    sortByColumn,
    filterByColumn,
    setPage,
    setPageSize,
    rangeStart,
    rangeEnd,
  }
}
