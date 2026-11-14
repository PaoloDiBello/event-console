import type { ColumnFiltersState, SortingState } from '@tanstack/react-table'
import { DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/DataGrid/types'
import { EVENT_CATEGORIES, EVENT_PRIORITIES, EVENT_STATUSES } from '@/features/events/model'
import { parseIsoDay, toIsoDay } from '@/shared/lib/dates'

/**
 * The registry view is shareable: search, filters, sort, page and page size all
 * round-trip through the URL. Reading is deliberately strict — a stale or
 * hand-edited link must never put the grid into a state its controls cannot
 * express, so unknown columns, values and page sizes are dropped instead of
 * trusted.
 */

/** Columns that render a filter control. Only these can appear in a link. */
const FILTER_IDS = ['title', 'when', 'category', 'status', 'priority', 'owner'] as const
type FilterId = (typeof FILTER_IDS)[number]

const TEXT_FILTER_IDS = new Set<FilterId>(['title', 'owner'])
const MAX_TEXT_LENGTH = 80

/** Sortable columns, including the ones without a filter. */
const SORT_IDS = new Set([
  'title',
  'when',
  'category',
  'status',
  'priority',
  'owner',
  'duration',
  'location',
  'notes',
])

const PAGE_SIZES = new Set<number>(DEFAULT_PAGE_SIZE_OPTIONS)
const DEFAULT_SORTING: SortingState = [{ id: 'when', desc: true }]
const DEFAULT_PAGE_SIZE = 50

export interface RegistryView {
  globalFilter: string
  columnFilters: ColumnFiltersState
  sorting: SortingState
  pageIndex: number
  pageSize: number
}

export const DEFAULT_REGISTRY_VIEW: RegistryView = {
  globalFilter: '',
  columnFilters: [],
  sorting: DEFAULT_SORTING,
  pageIndex: 0,
  pageSize: DEFAULT_PAGE_SIZE,
}

function isFilterId(id: string): id is FilterId {
  return (FILTER_IDS as readonly string[]).includes(id)
}

function isAllowedValue(id: FilterId, value: string): boolean {
  if (value.length === 0) return false
  if (TEXT_FILTER_IDS.has(id)) return value.length <= MAX_TEXT_LENGTH
  if (id === 'when') return toIsoDay(parseIsoDay(value)) === value
  if (id === 'category') return (EVENT_CATEGORIES as readonly string[]).includes(value)
  if (id === 'status') return (EVENT_STATUSES as readonly string[]).includes(value)
  if (id === 'priority') return (EVENT_PRIORITIES as readonly string[]).includes(value)
  return false
}

function readSorting(params: URLSearchParams): SortingState {
  const raw = params.get('sort')
  if (!raw) return DEFAULT_SORTING
  const [id, direction] = raw.split(':')
  if (!id || !SORT_IDS.has(id) || (direction !== 'asc' && direction !== 'desc')) {
    return DEFAULT_SORTING
  }
  return [{ id, desc: direction === 'desc' }]
}

function readPositiveInteger(raw: string | null, fallback: number): number {
  const value = Number(raw)
  return Number.isInteger(value) && value >= 1 ? value : fallback
}

export function readRegistryView(params: URLSearchParams): RegistryView {
  const columnFilters: ColumnFiltersState = []
  for (const id of FILTER_IDS) {
    const value = params.get(id)
    if (value !== null && isAllowedValue(id, value)) columnFilters.push({ id, value })
  }

  const query = params.get('q') ?? ''
  const rawSize = Number(params.get('size'))

  return {
    globalFilter: query.slice(0, MAX_TEXT_LENGTH),
    columnFilters,
    sorting: readSorting(params),
    pageIndex: readPositiveInteger(params.get('page'), 1) - 1,
    pageSize: PAGE_SIZES.has(rawSize) ? rawSize : DEFAULT_PAGE_SIZE,
  }
}

/** Keep the default view out of the URL so the plain `/grid` stays canonical. */
export function writeRegistryView(view: RegistryView): URLSearchParams {
  const params = new URLSearchParams()

  if (view.globalFilter !== '') params.set('q', view.globalFilter)

  for (const filter of view.columnFilters) {
    if (typeof filter.value !== 'string') continue
    if (!isFilterId(filter.id) || !isAllowedValue(filter.id, filter.value)) continue
    params.set(filter.id, filter.value)
  }

  const sort = view.sorting[0]
  const isDefaultSort = sort !== undefined && sort.id === DEFAULT_SORTING[0]!.id && sort.desc
  if (sort && !isDefaultSort) params.set('sort', `${sort.id}:${sort.desc ? 'desc' : 'asc'}`)

  if (view.pageIndex > 0) params.set('page', String(view.pageIndex + 1))
  if (view.pageSize !== DEFAULT_PAGE_SIZE) params.set('size', String(view.pageSize))

  return params
}

/** `?status=at_risk` → the filter a quick-filter metric should toggle. */
export function hasColumnFilter(filters: ColumnFiltersState, id: string, value: string): boolean {
  return filters.some((filter) => filter.id === id && filter.value === value)
}

/** Replace a column's filter with `value`, or remove it when `value` is null. */
export function withColumnFilter(
  filters: ColumnFiltersState,
  id: string,
  value: string | null,
): ColumnFiltersState {
  const rest = filters.filter((filter) => filter.id !== id)
  return value === null ? rest : [...rest, { id, value }]
}
