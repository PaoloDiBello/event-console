import { Pencil } from 'lucide-react'
import type { EventRecord } from '@/features/events/model'
import {
  EVENT_CATEGORIES,
  EVENT_PRIORITIES,
  EVENT_STATUSES,
  PRIORITY_LABEL,
  STATUS_LABEL,
} from '@/features/events/model'
import type { DataGridColumn } from '@/components/DataGrid'
import { formatGridDate, formatMinute } from '@/shared/lib/dates'
import { CategoryLabel, PriorityLabel, StatusBadge } from '@/features/events/components/EventLabels'

/**
 * String columns use TanStack's simple `text` comparator instead of the
 * default `auto`/`alphanumeric` natural sort. The natural sort runs a regex
 * over both values for every comparison; at 100k rows that is millions of
 * regex passes and freezes the UI for seconds. `text` is a plain
 * case-insensitive comparison and stays interactive.
 *
 * Status / priority are stored as words, which would sort alphabetically into
 * nonsense — explicit rank maps keep those columns meaningful. `when` compares
 * the numeric parts directly so a new event does not force a full date parse.
 */
const STATUS_RANK: Record<EventRecord['status'], number> = {
  at_risk: 0,
  in_progress: 1,
  scheduled: 2,
  completed: 3,
  cancelled: 4,
}

const PRIORITY_RANK: Record<EventRecord['priority'], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

export function createEventColumns(onEdit: (event: EventRecord) => void): DataGridColumn<EventRecord>[] {
  return [
    {
      id: 'title',
      accessorKey: 'title',
      header: 'Event',
      sortingFn: 'text',
      meta: { filter: 'text', width: 268 },
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink" title={row.original.title}>
            {row.original.title}
          </p>
          <p className="truncate font-mono text-[10px] text-faint">
            {row.original.id} · {row.original.location}
          </p>
        </div>
      ),
    },
    {
      // One column, two sortable pieces of information: ISO day + zero-padded
      // minute sorts chronologically as a plain string. `sortValue` lets the
      // grid compute that key once per row instead of once per comparison.
      id: 'when',
      accessorFn: (event) => `${event.date}T${String(event.startMinute).padStart(4, '0')}`,
      header: 'When',
      meta: {
        filter: 'date',
        width: 132,
        sortValue: (event) => `${event.date}T${String(event.startMinute).padStart(4, '0')}`,
      },
      filterFn: (row, _columnId, value) => row.original.date === value,
      cell: ({ row }) => (
        <div className="leading-tight">
          <p className="tnum font-mono text-xs text-muted">{formatGridDate(row.original.date)}</p>
          <p className="tnum font-mono text-[10px] text-faint">
            {formatMinute(row.original.startMinute)}
          </p>
        </div>
      ),
    },
    {
      id: 'category',
      accessorKey: 'category',
      header: 'Category',
      sortingFn: 'text',
      meta: {
        filter: 'select',
        width: 120,
        filterOptions: EVENT_CATEGORIES.map((value) => ({ value, label: value })),
      },
      filterFn: 'equalsString',
      cell: ({ row }) => <CategoryLabel category={row.original.category} />,
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      meta: {
        filter: 'select',
        width: 126,
        filterOptions: EVENT_STATUSES.map((value) => ({ value, label: STATUS_LABEL[value] })),
        sortValue: (event) => STATUS_RANK[event.status],
      },
      filterFn: 'equalsString',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'priority',
      accessorKey: 'priority',
      header: 'Priority',
      meta: {
        filter: 'select',
        width: 104,
        filterOptions: EVENT_PRIORITIES.map((value) => ({ value, label: PRIORITY_LABEL[value] })),
        sortValue: (event) => PRIORITY_RANK[event.priority],
      },
      filterFn: 'equalsString',
      cell: ({ row }) => <PriorityLabel priority={row.original.priority} />,
    },
    {
      id: 'owner',
      accessorKey: 'owner',
      header: 'Owner',
      sortingFn: 'text',
      meta: { filter: 'text', width: 132 },
      cell: ({ row }) => <span className="truncate text-xs text-muted">{row.original.owner}</span>,
    },
    {
      id: 'duration',
      accessorKey: 'durationMin',
      header: 'Length',
      meta: { width: 88, align: 'right' },
      cell: ({ row }) => (
        <span className="tnum font-mono text-xs text-faint">{row.original.durationMin}m</span>
      ),
    },
    {
      id: 'location',
      accessorKey: 'location',
      header: 'Location',
      sortingFn: 'text',
      meta: { filter: 'text', width: 140 },
      cell: ({ row }) => <span className="truncate text-xs text-faint">{row.original.location}</span>,
    },
    {
      id: 'notes',
      accessorKey: 'notes',
      header: 'Notes',
      sortingFn: 'text',
      meta: { filter: 'text', width: 240 },
      cell: ({ row }) => (
        <span className="truncate text-xs text-faint" title={row.original.notes}>
          {row.original.notes ?? '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      enableHiding: false,
      meta: { width: 44, align: 'right' },
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => onEdit(row.original)}
          aria-label={`Edit ${row.original.title}`}
          className="inline-flex size-7 items-center justify-center rounded-xs border border-transparent text-faint opacity-0 transition-all group-hover:opacity-100 hover:border-line-strong hover:bg-canvas hover:text-accent focus-visible:opacity-100"
        >
          <Pencil aria-hidden="true" className="size-3.5" />
        </button>
      ),
    },
  ]
}

/** Every text field is already lower-cased into `search` at write time. */
export function eventGlobalFilter(row: { original: EventRecord }, _columnId: string, value: unknown): boolean {
  return row.original.search.includes(String(value).toLowerCase())
}
