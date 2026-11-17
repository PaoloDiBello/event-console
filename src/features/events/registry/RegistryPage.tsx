import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { DataGrid, type DataGridViewState } from '@/components/DataGrid'
import type { EventRecord } from '@/features/events/model'
import { useEventFeed, useEventStore } from '@/features/events/store'
import { createEventColumns, eventGlobalFilter } from './columns'
import { RegistryHeader } from './RegistryHeader'
import {
  isExactlyColumnFilter,
  readRegistryView,
  withColumnFilter,
  writeRegistryView,
  type RegistryView,
} from './registryView'
import { useRegistryStats } from './useRegistryStats'
import { useTransientValue } from '@/shared/hooks/useTransientValue'
import { exportToCsv } from '@/shared/lib/exportCsv'

interface RegistryPageProps {
  onEdit: (event: EventRecord) => void
  highlightedId: string | null
}

/** Stable reference: TanStack rebuilds its row model when `getRowId` changes. */
function getEventRowId(event: EventRecord) {
  return event.id
}

export function RegistryPage({ onEdit, highlightedId }: RegistryPageProps) {
  const { events, status, error, isLoading, reload, simulateError } = useEventFeed()
  const deleteEvents = useEventStore((s) => s.deleteEvents)
  const restoreEvents = useEventStore((s) => s.restoreEvents)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // The URL seeds the view once; after that the grid owns search, sort and
  // paging, and the page owns the filters so a metric can toggle one.
  const [seed, setSeed] = useState(() => readRegistryView(searchParams))
  const [seedKey, setSeedKey] = useState(0)
  const [columnFilters, setColumnFilters] = useState(seed.columnFilters)

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
    },
    [mirrorView],
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
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [density, setDensity] = useState<'compact' | 'comfortable' | 'spacious'>('comfortable')
  const [removedBulk, setRemovedBulk] = useState<{ event: any; index: number }[] | null>(null)
  const [bulkSuccess, setBulkSuccess] = useTransientValue<string>(6000)
  const columns = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }: { table: any }) => (
          <input
            type="checkbox"
            aria-label="Select all rows on this page"
            checked={table.getIsAllPageRowsSelected()}
            onChange={(e: any) => table.toggleAllPageRowsSelected(e.target.checked)}
          />
        ),
        cell: ({ row }: { row: any }) => (
          <input
            type="checkbox"
            aria-label={`Select ${row.original.title}`}
            checked={row.getIsSelected()}
            onChange={(e: any) => row.toggleSelected(e.target.checked)}
            onClick={(e: any) => e.stopPropagation()}
          />
        ),
        size: 40,
        enableSorting: false,
        enableColumnFilter: false,
      },
      ...createEventColumns(onEdit, { owners: stats.owners, locations: stats.locations }),
    ],
    [onEdit, stats.owners, stats.locations],
  )

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

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.length === 0) return
    const removed = deleteEvents(selectedIds)
    setRemovedBulk(removed)
    setBulkSuccess(`${removed.length} event${removed.length === 1 ? '' : 's'} deleted.`)
    setSelectedIds([])
  }, [selectedIds, deleteEvents, setBulkSuccess])

  const undoBulkDelete = useCallback(() => {
    if (!removedBulk) return
    restoreEvents(removedBulk)
    setRemovedBulk(null)
    setBulkSuccess(null)
  }, [removedBulk, restoreEvents, setBulkSuccess])

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
        {selectedIds.length > 0 ? (
          <div className="flex items-center gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm">
            <span className="font-semibold text-destructive">{selectedIds.length} selected</span>
            <button
              type="button"
              onClick={handleBulkDelete}
              className="rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-destructive/90"
            >
              Delete {selectedIds.length} selected
            </button>
            {bulkSuccess ? (
              <span className="ml-auto text-xs text-muted">
                {bulkSuccess}{' '}
                {removedBulk ? (
                  <button type="button" onClick={undoBulkDelete} className="font-medium underline">
                    Undo
                  </button>
                ) : null}
              </span>
            ) : null}
          </div>
        ) : null}
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
          initialSorting={seed.sorting}
          initialPageSize={seed.pageSize}
          initialPageIndex={seed.pageIndex}
          initialGlobalFilter={seed.globalFilter}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
          onViewStateChange={handleViewStateChange}
          // Location stays visible: its select filter only exists where the
          // column does, and a facet nobody can reach is not a facet.
          initialColumnVisibility={{ notes: false }}
          onRowActivate={onEdit}
          onExport={handleExport}
          onSelectionChange={setSelectedIds}
          rowHeight={density === 'compact' ? 32 : density === 'spacious' ? 56 : 44}
          toolbarActions={
            <div className="flex items-center gap-1">
              {(['compact', 'comfortable', 'spacious'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDensity(d)}
                  className={`rounded-sm px-2 py-1 text-xs ${density === d ? 'bg-accent/20 text-accent' : 'text-muted hover:text-ink'}`}
                >
                  {d[0].toUpperCase() + d.slice(1, 4)}
                </button>
              ))}
            </div>
          }
          focusRowId={highlightedId}
          emptyTitle="No events in the registry"
          emptyHint="Load the dataset, or add the first event with the New event button."
          getRowClassName={(event) =>
            event.id === highlightedId
              ? 'bg-accent/[0.07] shadow-[inset_2px_0_0_0_var(--color-accent)]'
              : ''
          }
        />
      </div>
    </div>
  )
}
