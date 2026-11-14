import {
  functionalUpdate,
  getCoreRowModel,
  useReactTable,
  type Column,
  type ColumnFiltersState,
  type FilterFn,
  type PaginationState,
  type SortingState,
  type Updater,
  type VisibilityState,
} from '@tanstack/react-table'
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { buildRows } from '../model'
import { activeFilterCount, filterChips } from '../utils'
import type { DataGridColumn, DataGridViewState } from '../types'

/** Long enough to swallow a burst of keystrokes, short enough to feel live. */
const SEARCH_DEBOUNCE_MS = 200

interface DataGridControllerOptions<TData> {
  data: TData[]
  columns: DataGridColumn<TData>[]
  getRowId: (row: TData) => string
  globalFilterFn?: FilterFn<TData>
  initialSorting?: SortingState
  initialPageSize: number
  initialPageIndex?: number
  initialGlobalFilter?: string
  columnFilters?: ColumnFiltersState
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void
  onViewStateChange?: (state: DataGridViewState) => void
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
  initialPageIndex = 0,
  initialGlobalFilter = '',
  columnFilters: controlledColumnFilters,
  onColumnFiltersChange,
  onViewStateChange,
  initialColumnVisibility,
}: DataGridControllerOptions<TData>) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting ?? [])
  const [internalColumnFilters, setInternalColumnFilters] = useState<ColumnFiltersState>(
    controlledColumnFilters ?? [],
  )
  const columnFilters = controlledColumnFilters ?? internalColumnFilters
  const [globalFilter, setGlobalFilter] = useState(initialGlobalFilter)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialColumnVisibility ?? {},
  )
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: initialPageIndex,
    pageSize: initialPageSize,
  })

  // TanStack hands setters an updater, not always a value. Resolve it against
  // the filters the parent currently sees, then hand the result back.
  const setColumnFilters = useCallback(
    (updater: Updater<ColumnFiltersState>) => {
      const next = functionalUpdate(updater, columnFilters)
      if (controlledColumnFilters === undefined) setInternalColumnFilters(next)
      onColumnFiltersChange?.(next)
    },
    [columnFilters, controlledColumnFilters, onColumnFiltersChange],
  )

  // The input is urgent; the applied query waits for a pause in typing.
  const [search, setSearchState] = useState(initialGlobalFilter)
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS)
  const [isPending, startTransition] = useTransition()

  const resetPage = useCallback(() => {
    setPagination((current) =>
      current.pageIndex === 0 ? current : { ...current, pageIndex: 0 },
    )
  }, [])

  // Clearing must feel instant, so an empty box skips the debounce entirely
  // and drops the applied query now. Typing still waits for the pause below.
  const setSearch = useCallback(
    (value: string) => {
      setSearchState(value)
      if (value.trim() !== '') return
      setGlobalFilter('')
      resetPage()
    },
    [resetPage],
  )

  useEffect(() => {
    // While the debounce is catching up, the input is ahead of it. Applying a
    // stale value here would resurrect a query the user just cleared.
    if (debouncedSearch !== search) return
    const next = search.trim()
    if (next === globalFilter) return
    // The filter pass walks the full 100k rows: keep it interruptible so a
    // resumed keystroke is never stuck behind it.
    startTransition(() => {
      setGlobalFilter(next)
      resetPage()
    })
  }, [debouncedSearch, search, globalFilter, resetPage])

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
  // Chips come from filter state, not from the visible columns, so a filter on
  // a hidden column stays visible and removable.
  const chips = useMemo(() => filterChips(table, columnFilters), [table, columnFilters])
  const hasSearch = globalFilter.length > 0
  const hasFilters = filterCount > 0
  const showFilterRow = useMemo(
    () => visibleColumns.some((column) => column.columnDef.meta?.filter),
    [visibleColumns],
  )

  // Report the applied view after every change. The page uses this to mirror
  // the view into the URL, so a refresh or a shared link lands on the same rows.
  useEffect(() => {
    onViewStateChange?.({
      globalFilter,
      columnFilters,
      sorting,
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
    })
  }, [
    globalFilter,
    columnFilters,
    sorting,
    pagination.pageIndex,
    pagination.pageSize,
    onViewStateChange,
  ])

  const clearSearch = useCallback(() => {
    setSearch('')
    setGlobalFilter('')
    resetPage()
  }, [resetPage, setSearch])

  const clearColumnFilters = useCallback(() => {
    setColumnFilters([])
    resetPage()
  }, [resetPage, setColumnFilters])

  const removeColumnFilter = useCallback(
    (columnId: string) => {
      setColumnFilters((current) => current.filter((filter) => filter.id !== columnId))
      resetPage()
    },
    [resetPage, setColumnFilters],
  )

  // Only the empty state resets both: the toolbar keeps search and filters
  // independent so one never silently discards the other.
  const clearAll = useCallback(() => {
    setSearch('')
    setGlobalFilter('')
    setColumnFilters([])
    resetPage()
  }, [resetPage, setSearch, setColumnFilters])

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
    chips,
    hasSearch,
    hasFilters,
    showFilterRow,
    resetKey,
    clearSearch,
    clearColumnFilters,
    removeColumnFilter,
    clearAll,
    sortByColumn,
    filterByColumn,
    setPage,
    setPageSize,
    rangeStart,
    rangeEnd,
  }
}
