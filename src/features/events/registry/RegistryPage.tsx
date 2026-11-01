import { useMemo } from 'react'
import { DataGrid } from '@/components/DataGrid'
import type { EventRecord } from '@/features/events/model'
import { useEventFeed } from '@/features/events/store'
import { createEventColumns, eventGlobalFilter } from './columns'
import { RegistryHeader } from './RegistryHeader'
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

  const columns = useMemo(() => createEventColumns(onEdit), [onEdit])
  const stats = useRegistryStats(events)

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <RegistryHeader
        status={status}
        nextWindow={stats.nextWindow}
        atRisk={stats.atRisk}
        onReload={reload}
        onSimulateError={simulateError}
      />

      <div className="min-h-0 flex-1">
        <DataGrid
          data={events}
          columns={columns}
          getRowId={getEventRowId}
          caption="Event registry"
          isLoading={isLoading}
          error={status === 'error' ? error : null}
          onRetry={reload}
          globalFilterFn={eventGlobalFilter}
          searchPlaceholder="Search 100,000 events…"
          initialSorting={[{ id: 'when', desc: true }]}
          initialPageSize={50}
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
