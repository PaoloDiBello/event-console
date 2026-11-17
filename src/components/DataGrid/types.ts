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
    /** Tighten horizontal padding for narrow utility columns (selection, actions). */
    compact?: boolean
    /** Set false to keep a column out of the visibility menu. */
    hideable?: boolean
    /**
     * Drop the column from the rendered table below this breakpoint. The
     * column stays in the grid state (sorting, filtering, export), so it is
     * still reachable from the Columns menu on a wider screen.
     */
    hideBelow?: 'md'
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
  /**
   * Controlled sorting. Supply both props when the page needs to set the sort
   * from outside the header, such as a toolbar sort menu. Any change resets the
   * page, whether it came from a header or from the page.
   */
  sorting?: SortingState
  onSortingChange?: (sorting: SortingState) => void
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
  /**
   * Makes rows a control: clicking a row or pressing Enter/Space on it calls
   * this. Rows then become the grid's keyboard surface (roving tabindex, arrow
   * keys), so an action button inside a cell should not also be a tab stop.
   */
  onRowActivate?: (row: TData) => void
  /** Row to reveal (e.g. the event just created): jumps to its page and scrolls it into view. */
  focusRowId?: string | null
  toolbarActions?: ReactNode
  /** Floating strip pinned above the footer, e.g. bulk actions for selected rows. */
  selectionBar?: ReactNode
  onExport?: () => void
  /**
   * Controlled selection. Supply both props when the page needs to clear the
   * selection after a bulk action; omit them to let the grid own it.
   */
  selectedRowIds?: string[]
  onSelectionChange?: (ids: string[]) => void
  rowHeight?: number
}
