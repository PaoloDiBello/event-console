import type {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  RowData,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table'
import type { ReactNode } from 'react'

/**
 * Column metadata the DataGrid understands.
 *
 * These live in TanStack's own `ColumnMeta` interface instead of a wrapper
 * type, because once columns are registered with the table the definitions come
 * back as plain `Column<TData, unknown>` — a wrapper would be erased and every
 * access would need a cast.
 */
declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Renders a control in the filter row. Omit for non-filterable columns. */
    filter?: 'text' | 'select' | 'date'
    filterOptions?: readonly { value: string; label: string }[]
    align?: 'left' | 'center' | 'right'
    /** Fixed pixel width. Columns without a width share the remaining space. */
    width?: number
    /** Set false to keep a column out of the visibility menu. */
    hideable?: boolean
    /**
     * Value used by the grid's sorter. Defaults to the column accessor.
     * Supplying this avoids calling a full comparator once per comparison.
     */
    sortValue?: (row: TData) => string | number
  }
}

export type DataGridColumn<TData> = ColumnDef<TData, unknown>

/** Sizes offered by the footer menu, shared with anything that parses a URL. */
export const DEFAULT_PAGE_SIZE_OPTIONS = [25, 50, 100, 250] as const

/** The applied view, reported after every change so a page can mirror it. */
export interface DataGridViewState {
  globalFilter: string
  columnFilters: ColumnFiltersState
  sorting: SortingState
  pageIndex: number
  pageSize: number
}

export interface DataGridProps<TData> {
  data: TData[]
  columns: DataGridColumn<TData>[]
  getRowId: (row: TData) => string
  /** Accessible name for the table. Rendered as a visually hidden <caption>. */
  caption: string
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
  /** Needed for the global search box; match against whatever fields you like. */
  globalFilterFn?: FilterFn<TData>
  searchPlaceholder?: string
  initialSorting?: SortingState
  initialPageSize?: number
  initialPageIndex?: number
  /** Seed the applied query, e.g. from a URL or a saved view. */
  initialGlobalFilter?: string
  /**
   * Controlled column filters. Omit to let the grid own them; supply both props
   * when the page needs to set a filter from outside the grid, such as a
   * quick-filter metric.
   */
  columnFilters?: ColumnFiltersState
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void
  /** Called after every applied change so the page can persist the view. */
  onViewStateChange?: (state: DataGridViewState) => void
  initialColumnVisibility?: VisibilityState
  pageSizeOptions?: readonly number[]
  emptyTitle?: string
  emptyHint?: string
  getRowClassName?: (row: TData) => string
  /** Row to reveal (e.g. the event just created): jumps to its page and scrolls it into view. */
  focusRowId?: string | null
  toolbarActions?: ReactNode
  rowHeight?: number
}
