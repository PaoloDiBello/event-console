import type { VisibilityState } from '@tanstack/react-table'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  DataGrid,
  type DataGridColumn,
  type DataGridViewState,
  type SelectionSummary,
} from '@/components/DataGrid'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import type { EventRecord } from '@/features/events/model'
import { useEventFeed } from '@/features/events/store'
import { exportToCsv } from '@/shared/lib/exportCsv'
import { usePersistentState } from '@/shared/hooks/usePersistentState'
import { BulkActionBar } from './BulkActionBar'
import { BulkDeleteDialog } from './BulkDeleteDialog'
import { DensityMenu } from './DensityMenu'
import { isRowDensity, ROW_HEIGHT, type RowDensity } from './density'
import { createEventColumns, eventGlobalFilter } from './columns'
import { RegistryHeader } from './RegistryHeader'
import { SortMenu } from './SortMenu'
import {
  isExactlyColumnFilter,
  readRegistryView,
  withColumnFilter,
  writeRegistryView,
  type RegistryView,
} from './registryView'
import { useRegistryStats } from './useRegistryStats'

interface RegistryPageProps {
  onEdit: (event: EventRecord) => void
  /** Remove the selected records through the app's shared delete + undo path. */
  onBulkDelete: (ids: string[]) => void
  highlightedId: string | null
}

/** Stable reference: TanStack rebuilds its row model when `getRowId` changes. */
function getEventRowId(event: EventRecord) {
  return event.id
}

/**
 * Where "my console" lives. Versioned so a future shape can move on without
 * reading the old one, and separate from the URL: search, filters, sort and
 * page are shareable view state, density and columns are personal taste.
 */
const DENSITY_KEY = 'event-console:v1:registry.density'
const COLUMNS_KEY = 'event-console:v1:registry.columns'

/**
 * Notes is long-form and relevance has no cells, so both start hidden.
 * Location stays visible: its filter only exists where the column does.
 */
const DEFAULT_COLUMN_VISIBILITY: VisibilityState = { notes: false, relevance: false }

function isColumnVisibility(value: unknown): boolean {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  return Object.values(value as Record<string, unknown>).every(
    (entry) => typeof entry === 'boolean',
  )
}

export function RegistryPage({ onEdit, onBulkDelete, highlightedId }: RegistryPageProps) {
  const { events, status, error, isLoading, reload, simulateError } = useEventFeed()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // The URL seeds the view once; after that the grid owns search, sort and
  // paging, and the page owns the filters so a metric can toggle one.
  const [seed, setSeed] = useState(() => readRegistryView(searchParams))
  const [seedKey, setSeedKey] = useState(0)
  const [columnFilters, setColumnFilters] = useState(seed.columnFilters)
  // Sorting is controlled so the toolbar menu and the header arrows write to
  // the same state, and so a hidden sort column can still be chosen.
  const [sorting, setSorting] = useState(seed.sorting)
  // The page owns the selection so a bulk delete can clear the checkboxes,
  // not just hide the action bar. The grid reports every toggle back here.
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [confirmOpen, setConfirmOpen] = useState(false)
  // What the last reload kept: the columns you chose, not the ones we guessed.
  const [columnVisibility, setColumnVisibility] = usePersistentState<VisibilityState>(
    COLUMNS_KEY,
    DEFAULT_COLUMN_VISIBILITY,
    isColumnVisibility,
  )
  // The grid reports how much of the selection the current filters still show,
  // so the bulk bar and the confirm dialog can say what the action will touch.
  const [selection, setSelection] = useState<SelectionSummary>({ selected: 0, inView: 0 })

  const viewRef = useRef<RegistryView>(seed)
  const lastUrlRef = useRef(searchParams.toString())
  const mirrorView = useCallback(
    (next: Partial<RegistryView>) => {
      viewRef.current = { ...viewRef.current, ...next }
      const params = writeRegistryView(viewRef.current)
      const serialized = params.toString()
      // Replacing history with an identical URL would still re-render the
      // route, so only write when the view actually changed.
      if (serialized === lastUrlRef.current) return
      lastUrlRef.current = serialized
      setSearchParams(params, { replace: true })
    },
    [setSearchParams],
  )

  // A nav click or the browser's Back button can change the URL without the
  // grid knowing. When that happens, adopt the link's view and remount the
  // grid so its internal search/sort/page state matches it again.
  useEffect(() => {
    const current = searchParams.toString()
    if (current === lastUrlRef.current) return
    const next = readRegistryView(searchParams)
    lastUrlRef.current = current
    viewRef.current = next
    setSeed(next)
    setColumnFilters(next.columnFilters)
    setSelectedIds([])
    setSeedKey((key) => key + 1)
  }, [searchParams])

  const handleViewStateChange = useCallback(
    (state: DataGridViewState) => {
      mirrorView({
        globalFilter: state.globalFilter,
        columnFilters: state.columnFilters,
        sorting: state.sorting,
        pageIndex: state.pageIndex,
        pageSize: state.pageSize,
      })
      setColumnVisibility(state.columnVisibility)
    },
    [mirrorView, setColumnVisibility],
  )

  // The metric shows one number, so it may only read as pressed when the
  // status filter is exactly that value — not when at-risk is one of several.
  const atRiskActive = isExactlyColumnFilter(columnFilters, 'status', 'at_risk')
  const toggleAtRisk = useCallback(() => {
    setColumnFilters((current) =>
      isExactlyColumnFilter(current, 'status', 'at_risk')
        ? withColumnFilter(current, 'status', null)
        : withColumnFilter(current, 'status', ['at_risk']),
    )
  }, [])

  const stats = useRegistryStats(events)
  const [density, setDensity] = usePersistentState<RowDensity>(
    DENSITY_KEY,
    'comfortable',
    isRowDensity,
  )
  const columns = useMemo<DataGridColumn<EventRecord>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all rows on this page"
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected()}
            onChange={(event) => table.toggleAllPageRowsSelected(event.target.checked)}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Select ${row.original.title}`}
            checked={row.getIsSelected()}
            onChange={(event) => row.toggleSelected(event.target.checked)}
            onClick={(event) => event.stopPropagation()}
          />
        ),
        enableSorting: false,
        enableColumnFilter: false,
        enableHiding: false,
        enableResizing: false,
        meta: { width: 32, align: 'center', hideable: false, compact: true },
      },
      ...createEventColumns(onEdit, { owners: stats.owners, locations: stats.locations }),
    ],
    [onEdit, stats.owners, stats.locations],
  )

  // Only the rows the dialog is about to name; built on open so ticking a
  // checkbox does not walk the 100k-row set on every click.
  const selectedEvents = useMemo(() => {
    if (!confirmOpen || selectedIds.length === 0) return []
    const wanted = new Set(selectedIds)
    return events.filter((event) => wanted.has(event.id))
  }, [confirmOpen, events, selectedIds])

  const handleExport = useCallback(() => {
    exportToCsv(
      events,
      [
        { id: 'title', header: 'Event', accessor: (e) => e.title },
        { id: 'when', header: 'When', accessor: (e) => `${e.date} ${String(e.startMinute).padStart(4, '0')}` },
        { id: 'category', header: 'Category', accessor: (e) => e.category },
        { id: 'status', header: 'Status', accessor: (e) => e.status },
        { id: 'priority', header: 'Priority', accessor: (e) => e.priority },
        { id: 'owner', header: 'Owner', accessor: (e) => e.owner },
        { id: 'duration', header: 'Length (min)', accessor: (e) => String(e.durationMin) },
        { id: 'location', header: 'Location', accessor: (e) => e.location },
        { id: 'notes', header: 'Notes', accessor: (e) => e.notes ?? '' },
      ],
      'events.csv',
    )
  }, [events])

  // Selected rows that the current search and filters no longer show. The
  // selection is kept on purpose, so the count has to cover the whole of it.
  const outsideCount = Math.max(0, selectedIds.length - selection.inView)

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.length === 0) return
    setConfirmOpen(true)
  }, [selectedIds.length])

  const confirmBulkDelete = useCallback(() => {
    if (selectedIds.length === 0) return
    onBulkDelete(selectedIds)
    setSelectedIds([])
    setConfirmOpen(false)
  }, [onBulkDelete, selectedIds])

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <RegistryHeader
        status={status}
        nextWindow={stats.nextWindow}
        atRisk={stats.atRisk}
        atRiskActive={atRiskActive}
        onToggleAtRisk={toggleAtRisk}
        onOpenAgenda={() => navigate('/timeline')}
        onReload={reload}
        onSimulateError={simulateError}
      />

      <div className="min-h-0 flex-1">
        <DataGrid
          key={seedKey}
          data={events}
          columns={columns}
          getRowId={getEventRowId}
          caption="Event registry"
          isLoading={isLoading}
          error={status === 'error' ? error : null}
          onRetry={reload}
          globalFilterFn={eventGlobalFilter}
          searchPlaceholder="Search 100,000 events…"
          sorting={sorting}
          onSortingChange={setSorting}
          initialPageSize={seed.pageSize}
          initialPageIndex={seed.pageIndex}
          initialGlobalFilter={seed.globalFilter}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
          onViewStateChange={handleViewStateChange}
          // Seeded from the stored preference, then owned by the grid; every
          // change is reported back through `onViewStateChange`.
          initialColumnVisibility={columnVisibility}
          onRowActivate={onEdit}
          onExport={handleExport}
          selectedRowIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onSelectionSummaryChange={setSelection}
          selectionBar={
            selectedIds.length > 0 ? (
              <BulkActionBar
                count={selectedIds.length}
                outsideCount={outsideCount}
                onClear={() => setSelectedIds([])}
                onDelete={handleBulkDelete}
              />
            ) : undefined
          }
          rowHeight={ROW_HEIGHT[density]}
          toolbarActions={
            <>
              {/* The default order is a hidden column, so without this menu the
                  only way out of it would be to hand-edit the URL. */}
              <SortMenu value={sorting} onValueChange={setSorting} />
              <DensityMenu value={density} onValueChange={setDensity} />
            </>
          }
          focusRowId={highlightedId}
          emptyTitle="No events in the registry"
          emptyHint="The dataset is empty. Reload it, or create the first event."
          emptyAction={<Button onClick={reload}>Reload the dataset</Button>}
          getRowClassName={(event) =>
            event.id === highlightedId
              ? 'bg-accent/[0.07] shadow-[inset_2px_0_0_0_var(--color-accent)]'
              : ''
          }
        />
      </div>

      <BulkDeleteDialog
        open={confirmOpen}
        events={selectedEvents}
        outsideCount={outsideCount}
        onOpenChange={setConfirmOpen}
        onConfirm={confirmBulkDelete}
      />
    </div>
  )
}
