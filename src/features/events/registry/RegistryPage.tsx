import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { DataGrid, type DataGridViewState } from '@/components/DataGrid'
import type { EventRecord } from '@/features/events/model'
import { useEventFeed } from '@/features/events/store'
import { createEventColumns, eventGlobalFilter } from './columns'
import { RegistryHeader } from './RegistryHeader'
import {
  hasColumnFilter,
  readRegistryView,
  withColumnFilter,
  writeRegistryView,
  type RegistryView,
} from './registryView'
import { useRegistryStats } from './useRegistryStats'

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

  const atRiskActive = hasColumnFilter(columnFilters, 'status', 'at_risk')
  const toggleAtRisk = useCallback(() => {
    setColumnFilters((current) =>
      hasColumnFilter(current, 'status', 'at_risk')
        ? withColumnFilter(current, 'status', null)
        : withColumnFilter(current, 'status', 'at_risk'),
    )
  }, [])

  const columns = useMemo(() => createEventColumns(onEdit), [onEdit])
  const stats = useRegistryStats(events)

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
          initialSorting={seed.sorting}
          initialPageSize={seed.pageSize}
          initialPageIndex={seed.pageIndex}
          initialGlobalFilter={seed.globalFilter}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
          onViewStateChange={handleViewStateChange}
          initialColumnVisibility={{ location: false, notes: false }}
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
