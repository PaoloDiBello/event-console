import type { ColumnDef } from '@tanstack/react-table'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { formatGridDate, todayIso } from '@/shared/lib/dates'
import { DataGrid } from './DataGrid'
import { SEARCH_DEBOUNCE_MS } from './hooks/useDataGridController'
import type { DataGridProps } from './types'

// Render every row of the current page instead of measuring a scroll viewport;
// the keyboard/filter logic is what these tests are about, and jsdom has no layout.
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({
    count,
    estimateSize,
  }: {
    count: number
    estimateSize: (index: number) => number
  }) => {
    const items = Array.from({ length: count }, (_, index) => ({
      index,
      key: index,
      start: index * estimateSize(index),
      end: (index + 1) * estimateSize(index),
      size: estimateSize(index),
      lane: 0,
    }))

    return {
      getVirtualItems: () => items,
      getTotalSize: () => items.reduce((total, item) => total + item.size, 0),
      scrollToIndex: vi.fn(),
      measureElement: vi.fn(),
    }
  },
}))

interface Row {
  id: string
  name: string
  score: number
  status: 'on' | 'off'
}

const rows: Row[] = Array.from({ length: 23 }, (_, index) => ({
  id: `r${index}`,
  name: `Row ${String(index).padStart(2, '0')}`,
  score: (index * 7) % 23,
  status: index % 2 === 0 ? 'on' : 'off',
}))

const columns: ColumnDef<Row>[] = [
  { accessorKey: 'name', header: 'Name', meta: { filter: 'text' } },
  { accessorKey: 'score', header: 'Score' },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: {
      filter: 'select',
      filterOptions: [
        { value: 'on', label: 'On' },
        { value: 'off', label: 'Off' },
      ],
    },
    filterFn: 'equalsString',
  },
]

/**
 * Pretend the window is a phone (below `md`): every media query reports no
 * match, which is what the grid reads to drop columns and swap the filter row
 * for the filter sheet. Returns the restore function.
 */
function stubPhoneViewport() {
  const original = window.matchMedia
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
  return () => {
    window.matchMedia = original
  }
}

/** The selection column the registry prepends, without importing the page. */
const selectionColumns: ColumnDef<Row>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <input
        type="checkbox"
        aria-label="Select all rows on this page"
        checked={table.getIsAllPageRowsSelected()}
        onChange={(event) => table.toggleAllPageRowsSelected(event.target.checked)}
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        aria-label={`Select ${row.original.name}`}
        checked={row.getIsSelected()}
        onChange={(event) => row.toggleSelected(event.target.checked)}
      />
    ),
    enableSorting: false,
  },
  ...columns,
]

function renderGrid(overrides: Partial<DataGridProps<Row>> = {}) {
  return render(
    <DataGrid
      data={rows}
      columns={columns}
      getRowId={(row) => row.id}
      caption="Test rows"
      initialPageSize={10}
      {...overrides}
    />,
  )
}

function renderSelectionGrid(overrides: Partial<DataGridProps<Row>> = {}) {
  return render(
    <DataGrid
      data={rows}
      columns={selectionColumns}
      getRowId={(row) => row.id}
      caption="Selectable rows"
      initialPageSize={10}
      {...overrides}
    />,
  )
}

/** The header row and the filter row come before the first data row. */
function dataRows() {
  return screen.getAllByRole('row').slice(2)
}

/** The select filter is a custom menu, so the trigger is a button. */
function statusFilter() {
  return screen.getByRole('button', { name: /^Filter by Status/ })
}

/** Checkboxes, not radios: a column can hold several values at once. */
async function statusOption(option: 'On' | 'Off') {
  // The option's name carries its facet count, e.g. "On, 12 rows".
  return screen.findByRole('menuitemcheckbox', { name: new RegExp(`^${option}`) })
}

async function toggleStatus(user: UserEvent, option: 'On' | 'Off') {
  await user.click(statusFilter())
  await user.click(await statusOption(option))
  await user.keyboard('{Escape}')
}

/**
 * Wait for the search debounce to fire instead of polling for its result.
 *
 * `findBy`/`waitFor` hand the debounce timer and the filter pass a single
 * 1s budget, so a loaded machine can miss a deadline the app met. This waits on
 * the timer itself; the assertions that follow are then synchronous, with
 * nothing left to race.
 */
async function flushSearchDebounce() {
  await act(async () => {
    await new Promise((resolve) => window.setTimeout(resolve, SEARCH_DEBOUNCE_MS + 50))
  })
}

async function clearStatus(user: UserEvent) {
  await user.click(statusFilter())
  await user.click(await screen.findByRole('menuitem', { name: 'Clear' }))
}

describe('DataGrid', () => {
  it('paginates rows and reports the range to assistive tech', () => {
    renderGrid()

    expect(screen.getByText('Row 00')).toBeInTheDocument()
    expect(screen.queryByText('Row 10')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('23 rows match. Showing 1 to 10.')
  })

  it('sorts a column and exposes aria-sort', async () => {
    const user = userEvent.setup()
    renderGrid()

    const nameHeader = screen.getByRole('columnheader', { name: /Name/ })
    await user.click(within(nameHeader).getByRole('button'))

    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending')
    expect(dataRows()[0]).toHaveTextContent('Row 00')

    await user.click(within(screen.getByRole('columnheader', { name: /Name/ })).getByRole('button'))
    expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute(
      'aria-sort',
      'descending',
    )
    expect(dataRows()[0]).toHaveTextContent('Row 22')
  })

  it('filters through the global search with the deferred value', async () => {
    const user = userEvent.setup()
    renderGrid()

    await user.type(screen.getByRole('searchbox', { name: 'Search all columns' }), 'Row 07')

    await waitFor(() =>
      expect(screen.getByText(/rows? match\. Showing/)).toHaveTextContent('1 row match. Showing 1 to 1.'),
    )
    expect(screen.getByText('Row 07')).toBeInTheDocument()
    expect(screen.queryByText('Row 06')).not.toBeInTheDocument()
    // A global search is a query, not an active filter chip.
    expect(screen.queryByRole('button', { name: /^Clear \d+ filters?$/ })).not.toBeInTheDocument()
  })

  it('treats a leading slash as the search shortcut, not a query', async () => {
    const user = userEvent.setup()
    renderGrid()

    const search = screen.getByRole('searchbox', { name: 'Search all columns' })
    await user.click(search)
    await user.type(search, '/Row 07')

    expect(search).toHaveValue('Row 07')
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('1 row match.'))
  })

  it('focuses the first column filter with f', async () => {
    const user = userEvent.setup()
    renderGrid()

    await user.keyboard('f')

    const nameFilter = screen.getByRole('textbox', { name: 'Filter by Name' })
    expect(nameFilter).toHaveFocus()

    await user.type(nameFilter, 'Row 07')
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('1 row match.'))
  })

  it('changes the page size from an in-app menu', async () => {
    const user = userEvent.setup()
    renderGrid()

    expect(screen.queryByText('Row 22')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Rows per page, currently 10' }))
    await user.click(await screen.findByRole('menuitemradio', { name: '25' }))

    expect(screen.getByRole('button', { name: 'Rows per page, currently 25' })).toBeInTheDocument()
    expect(screen.getByText('Row 22')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('23 rows match. Showing 1 to 23.'),
    )
  })

  it('seeds the search and page from props', async () => {
    renderGrid({ initialGlobalFilter: 'Row 07', initialPageIndex: 0 })

    expect(screen.getByRole('searchbox', { name: 'Search all columns' })).toHaveValue('Row 07')
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('1 row match.'))
  })

  it('opens on a seeded page', () => {
    renderGrid({ initialPageIndex: 1 })

    expect(screen.getByText('Row 10')).toBeInTheDocument()
    expect(screen.queryByText('Row 00')).not.toBeInTheDocument()
  })

  it('applies controlled filters and reports removals', async () => {
    const user = userEvent.setup()
    const onColumnFiltersChange = vi.fn()
    renderGrid({
      columnFilters: [{ id: 'status', value: 'on' }],
      onColumnFiltersChange,
    })

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('12 rows match.'))
    expect(statusFilter()).toHaveAccessibleName('Filter by Status, currently On')

    await user.click(screen.getByRole('button', { name: 'Remove Status filter: On' }))

    expect(onColumnFiltersChange).toHaveBeenCalledWith([])
  })

  it('reports the applied view after a change', async () => {
    const user = userEvent.setup()
    const onViewStateChange = vi.fn()
    renderGrid({ onViewStateChange })

    await waitFor(() => expect(onViewStateChange).toHaveBeenCalled())

    await user.click(screen.getByRole('button', { name: 'Next page' }))

    await waitFor(() => {
      const last = onViewStateChange.mock.calls.at(-1)?.[0]
      expect(last).toMatchObject({ pageIndex: 1, pageSize: 10 })
    })
  })

  it('clears an active search with Escape', async () => {
    const user = userEvent.setup()
    renderGrid()

    const search = screen.getByRole('searchbox', { name: 'Search all columns' })
    await user.type(search, 'Row 07')
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('1 row match.'))

    await user.keyboard('{Escape}')

    expect(search).toHaveValue('')
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('23 rows match.'))
  })

  it('filters a column with a select', async () => {
    const user = userEvent.setup()
    renderGrid()

    await toggleStatus(user, 'On')

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('12 rows match. Showing 1 to 10.'),
    )
    expect(screen.queryByText('off')).not.toBeInTheDocument()
  })

  it('marks the current option in the select menu', async () => {
    const user = userEvent.setup()
    renderGrid()

    await toggleStatus(user, 'Off')

    await user.click(statusFilter())

    expect(await statusOption('Off')).toHaveAttribute('aria-checked', 'true')
    expect(await statusOption('On')).toHaveAttribute('aria-checked', 'false')

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('clears a select filter from its menu', async () => {
    const user = userEvent.setup()
    renderGrid()

    await toggleStatus(user, 'On')
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('12 rows match.'))

    await clearStatus(user)

    expect(statusFilter()).toHaveAccessibleName('Filter by Status')
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('23 rows match. Showing 1 to 10.'),
    )
  })

  it('filters on several values of one column at once', async () => {
    const user = userEvent.setup()
    renderGrid()

    await user.click(statusFilter())
    await user.click(await statusOption('On'))
    await user.click(await statusOption('Off'))

    // The menu stays open for the second pick instead of closing after one.
    expect(screen.getByRole('menu')).toBeInTheDocument()
    // The menu is not modal, so the result count is readable (and announced)
    // while it is still open.
    expect(screen.getByRole('status')).toHaveTextContent('23 rows match. Showing 1 to 10.')

    await user.keyboard('{Escape}')
    expect(statusFilter()).toHaveAccessibleName('Filter by Status, currently On, Off')
  })

  it('removes one selected value from its chip and keeps the rest', async () => {
    const user = userEvent.setup()
    renderGrid()

    await user.click(statusFilter())
    await user.click(await statusOption('On'))
    await user.click(await statusOption('Off'))
    await user.keyboard('{Escape}')

    await user.click(screen.getByRole('button', { name: 'Remove Status filter: On' }))

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('11 rows match.'))
    expect(screen.getByRole('button', { name: 'Remove Status filter: Off' })).toBeInTheDocument()
  })

  it('runs the facet menu entirely from the keyboard', async () => {
    const user = userEvent.setup()
    renderGrid()

    statusFilter().focus()
    await user.keyboard('{Enter}')

    // Opening puts focus on the first option, as a menu should.
    expect(await statusOption('On')).toHaveFocus()

    // Space toggles and the menu stays open for the next choice.
    await user.keyboard(' ')
    expect(await statusOption('On')).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(await statusOption('On')).toHaveFocus()

    await user.keyboard('{ArrowDown}')
    expect(await statusOption('Off')).toHaveFocus()
    await user.keyboard(' ')
    expect(await statusOption('Off')).toHaveAttribute('aria-checked', 'true')

    // Escape closes and hands focus back to the trigger.
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(statusFilter()).toHaveFocus()
    expect(screen.getByRole('status')).toHaveTextContent('23 rows match. Showing 1 to 10.')
    expect(statusFilter()).toHaveAccessibleName('Filter by Status, currently On, Off')
  })

  it('reaches Clear from the keyboard and clears every value', async () => {
    const user = userEvent.setup()
    renderGrid()

    statusFilter().focus()
    await user.keyboard('{Enter}')
    await user.keyboard(' ')
    // On is focused and checked; move to Off, check it, then step to Clear.
    await user.keyboard('{ArrowDown}')
    await user.keyboard(' ')
    await user.keyboard('{ArrowDown}')

    const clear = screen.getByRole('menuitem', { name: 'Clear' })
    expect(clear).toHaveFocus()

    await user.keyboard('{Enter}')

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(statusFilter()).toHaveAccessibleName('Filter by Status')
    expect(screen.getByRole('status')).toHaveTextContent('23 rows match. Showing 1 to 10.')
  })

  it('shows how many rows each option would leave', async () => {
    const user = userEvent.setup()
    renderGrid()

    await user.click(statusFilter())

    const on = await statusOption('On')
    const off = await statusOption('Off')
    expect(on).toHaveAccessibleName('On, 12 rows')
    expect(off).toHaveAccessibleName('Off, 11 rows')
    // Visible too, and not just in the name.
    expect(within(on).getByText('12')).toBeInTheDocument()
    expect(within(off).getByText('11')).toBeInTheDocument()
  })

  it('counts options against the other filters, not the column\'s own selection', async () => {
    const user = userEvent.setup()
    renderGrid()

    await toggleStatus(user, 'On')
    await user.click(statusFilter())

    // Filtered to On already: Off still reports the rows it would add, and On
    // reports its own total rather than the selected subset.
    expect(await statusOption('Off')).toHaveAccessibleName('Off, 11 rows')
    expect(await statusOption('On')).toHaveAccessibleName('On, 12 rows')
  })

  it('clears a text filter from the filter row itself', async () => {
    const user = userEvent.setup()
    renderGrid()

    const nameFilter = screen.getByLabelText('Filter by Name')
    await user.type(nameFilter, 'Row 0')
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('10 rows match.'))

    await user.click(screen.getByRole('button', { name: 'Clear Name filter' }))

    expect(nameFilter).toHaveValue('')
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('23 rows match. Showing 1 to 10.'),
    )
  })

  it('swaps the filter row for a filter sheet on a phone', async () => {
    const restore = stubPhoneViewport()
    try {
      const user = userEvent.setup()
      renderGrid()

      // One control per column does not fit: the row is gone, so the sheet is
      // the only way to filter without scrolling the table sideways.
      expect(screen.queryByLabelText('Filter by Name')).not.toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Filters' }))

      // Every filterable column is listed, not just the ones still rendered.
      const sheet = await screen.findByRole('dialog', { name: 'Filters' })
      expect(within(sheet).getByText('Name')).toBeInTheDocument()
      expect(within(sheet).getByText('Status')).toBeInTheDocument()

      await user.type(screen.getByLabelText('Filter by Name'), 'Row 01')
      await user.click(screen.getByRole('button', { name: 'Done' }))

      await waitFor(() =>
        expect(screen.getByRole('status')).toHaveTextContent('1 row match. Showing 1 to 1.'),
      )
      // The trigger reports what the sheet applied, since the chips sit behind
      // the closed sheet on a narrow screen.
      expect(screen.getByRole('button', { name: 'Filters, 1 applied' })).toBeInTheDocument()
    } finally {
      restore()
    }
  })

  it('hides a column from the column menu', async () => {
    const user = userEvent.setup()
    renderGrid()

    await user.click(screen.getByRole('button', { name: /Columns/ }))
    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Status' }))

    expect(screen.queryByRole('columnheader', { name: 'Status' })).not.toBeInTheDocument()
  })

  it('shows the no-match state and recovers by clearing the search', async () => {
    const user = userEvent.setup()
    renderGrid()

    await user.type(screen.getByRole('searchbox', { name: 'Search all columns' }), 'nothing-matches')
    await flushSearchDebounce()

    expect(screen.getByText('No rows match your search')).toBeInTheDocument()

    // Clearing skips the debounce, so the rows return in the same commit.
    await user.click(screen.getByRole('button', { name: 'Clear search' }))

    expect(screen.getByText('Row 00')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('23 rows match. Showing 1 to 10.')
  })

  it('clears column filters without discarding the search', async () => {
    const user = userEvent.setup()
    renderGrid()

    const search = screen.getByRole('searchbox', { name: 'Search all columns' })
    await user.type(search, 'Row')
    await toggleStatus(user, 'On')
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('12 rows match. Showing 1 to 10.'),
    )

    await user.click(screen.getByRole('button', { name: 'Clear all filters' }))

    expect(search).toHaveValue('Row')
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('23 rows match. Showing 1 to 10.'),
    )
  })

  it('clears search without discarding column filters', async () => {
    const user = userEvent.setup()
    renderGrid()

    await toggleStatus(user, 'On')
    const search = screen.getByRole('searchbox', { name: 'Search all columns' })
    await user.type(search, 'Row 0')
    await flushSearchDebounce()

    expect(screen.getByRole('status')).toHaveTextContent('5 rows match. Showing 1 to 5.')

    await user.click(screen.getByRole('button', { name: 'Clear search field' }))

    expect(statusFilter()).toHaveAccessibleName('Filter by Status, currently On')
    expect(screen.getByRole('status')).toHaveTextContent('12 rows match. Showing 1 to 10.')
  })

  it('resets both search and filters from the combined no-match state', async () => {
    const user = userEvent.setup()
    renderGrid()

    await toggleStatus(user, 'On')
    await user.type(screen.getByRole('searchbox', { name: 'Search all columns' }), 'nothing-matches')

    await screen.findByText('No rows match your search and filters')
    await user.click(screen.getByRole('button', { name: 'Clear search and filters' }))

    await screen.findByText('Row 00')
    expect(statusFilter()).toHaveAccessibleName('Filter by Status')
    expect(screen.getByRole('status')).toHaveTextContent('23 rows match. Showing 1 to 10.')
  })

  it('moves to the next page', async () => {
    const user = userEvent.setup()
    renderGrid()

    await user.click(screen.getByRole('button', { name: 'Next page' }))

    expect(await screen.findByText('Row 10')).toBeInTheDocument()
    expect(screen.queryByText('Row 00')).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /Page number/ })).toHaveValue('2')
    expect(screen.getByText('/ 3')).toBeInTheDocument()
  })

  it('jumps to a typed page number', async () => {
    const user = userEvent.setup()
    renderGrid()

    const pageInput = screen.getByRole('textbox', { name: /Page number/ })
    await user.clear(pageInput)
    await user.type(pageInput, '3{Enter}')

    expect(await screen.findByText('Row 20')).toBeInTheDocument()
    expect(screen.queryByText('Row 10')).not.toBeInTheDocument()
    expect(pageInput).toHaveValue('3')
  })

  it('clamps a typed page number and cancels with Escape', async () => {
    const user = userEvent.setup()
    renderGrid()

    const pageInput = screen.getByRole('textbox', { name: /Page number/ })
    await user.clear(pageInput)
    await user.type(pageInput, '999{Enter}')
    expect(pageInput).toHaveValue('3')
    expect(await screen.findByText('Row 20')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'First page' }))
    await user.clear(pageInput)
    await user.type(pageInput, '2')
    await user.keyboard('{Escape}')

    expect(pageInput).toHaveValue('1')
    expect(pageInput).not.toHaveFocus()
  })

  it('jumps to the page that contains a revealed row', async () => {
    renderGrid({ focusRowId: 'r22' })

    expect(await screen.findByText('Row 22')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /Page number/ })).toHaveValue('3')
  })

  it('waits for a pause in typing before running the filter pass', async () => {
    const user = userEvent.setup()
    renderGrid()

    const search = screen.getByRole('searchbox', { name: 'Search all columns' })
    await user.type(search, 'Row 07')

    // The input is urgent; the applied query trails it by a pause.
    expect(search).toHaveValue('Row 07')
    await waitFor(() =>
      expect(screen.getByText(/rows? match\. Showing/)).toHaveTextContent(
        '1 row match. Showing 1 to 1.',
      ),
    )
  })

  it('marks visible columns in the column menu', async () => {
    const user = userEvent.setup()
    renderGrid()

    const trigger = screen.getByRole('button', { name: /Columns/ })
    expect(trigger).toHaveTextContent('3/3')

    await user.click(trigger)

    const visible = screen.getByRole('menuitemcheckbox', { name: 'Status' })
    expect(visible).toHaveAttribute('aria-checked', 'true')
    expect(visible.querySelector('svg')).not.toBeNull()

    await user.click(visible)

    const hidden = screen.getByRole('menuitemcheckbox', { name: 'Status' })
    expect(hidden).toHaveAttribute('aria-checked', 'false')
    expect(hidden.querySelector('svg')).toBeNull()

    // The open menu hides the rest of the page from the accessibility tree.
    await user.keyboard('{Escape}')
    expect(screen.getByRole('button', { name: /Columns/ })).toHaveTextContent('2/3')
  })

  it('shows every column from the column menu', async () => {
    const user = userEvent.setup()
    render(
      <DataGrid
        data={rows}
        columns={columns}
        getRowId={(row) => row.id}
        caption="Test rows"
        initialPageSize={10}
        initialColumnVisibility={{ score: false }}
      />,
    )

    expect(screen.queryByRole('columnheader', { name: 'Score' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Columns/ })).toHaveTextContent('2/3')

    await user.click(screen.getByRole('button', { name: /Columns/ }))
    await user.click(screen.getByRole('menuitem', { name: 'Show all columns' }))

    expect(await screen.findByRole('columnheader', { name: 'Score' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Columns/ })).toHaveTextContent('3/3')
  })

  it('removes one filter from its chip and leaves the others alone', async () => {
    const user = userEvent.setup()
    renderGrid()

    await user.type(screen.getByLabelText('Filter by Name'), 'Row 0')
    await toggleStatus(user, 'On')

    await waitFor(() =>
      expect(screen.getByText(/rows? match\. Showing/)).toHaveTextContent(
        '5 rows match. Showing 1 to 5.',
      ),
    )

    await user.click(screen.getByRole('button', { name: 'Remove Status filter: On' }))

    await waitFor(() =>
      expect(screen.getByText(/rows? match\. Showing/)).toHaveTextContent(
        '10 rows match. Showing 1 to 10.',
      ),
    )
    expect(statusFilter()).toHaveAccessibleName('Filter by Status')
    expect(screen.getByRole('button', { name: 'Remove Name filter: Row 0' })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Remove Status filter: On' }),
    ).not.toBeInTheDocument()
  })

  it('keeps a hidden column filter removable', async () => {
    const user = userEvent.setup()
    renderGrid()

    await toggleStatus(user, 'On')
    await user.click(screen.getByRole('button', { name: /Columns/ }))
    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Status' }))
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('columnheader', { name: 'Status' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Remove Status filter: On' }))

    await waitFor(() =>
      expect(screen.getByText(/rows? match\. Showing/)).toHaveTextContent(
        '23 rows match. Showing 1 to 10.',
      ),
    )
  })

  it('labels a date filter chip with the formatted day', async () => {
    const user = userEvent.setup()
    const today = todayIso()
    render(
      <DataGrid
        data={[{ id: 'd1', name: 'Dated row', when: today }]}
        columns={[
          { accessorKey: 'name', header: 'Name', meta: { filter: 'text' } },
          { accessorKey: 'when', header: 'When', meta: { filter: 'date' } },
        ]}
        getRowId={(row) => row.id}
        caption="Dated rows"
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Filter by When' }))
    const dialog = await screen.findByRole('dialog', { name: 'Filter When by date' })
    await user.click(within(dialog).getByRole('button', { name: 'Today' }))

    expect(
      screen.getByRole('button', { name: `Remove When filter: ${formatGridDate(today)}` }),
    ).toBeInTheDocument()
  })

  it('opens a row on click and on Enter', async () => {
    const user = userEvent.setup()
    const onRowActivate = vi.fn()
    renderGrid({ onRowActivate })

    await user.click(screen.getByText('Row 01'))
    expect(onRowActivate).toHaveBeenCalledWith(rows[1])

    const firstRow = dataRows()[0]!
    firstRow.focus()
    await user.keyboard('{Enter}')

    expect(onRowActivate).toHaveBeenLastCalledWith(rows[0])
  })

  it('keeps one row in the tab order and moves it with the arrow keys', async () => {
    const user = userEvent.setup()
    renderGrid({ onRowActivate: vi.fn() })

    const rowEls = dataRows()
    expect(rowEls[0]).toHaveAttribute('tabindex', '0')
    expect(rowEls[1]).toHaveAttribute('tabindex', '-1')

    rowEls[0]!.focus()
    await user.keyboard('{ArrowDown}')

    await waitFor(() => expect(rowEls[1]).toHaveFocus())
    expect(rowEls[0]).toHaveAttribute('tabindex', '-1')
    expect(rowEls[1]).toHaveAttribute('tabindex', '0')

    await user.keyboard('{End}')
    await waitFor(() => expect(rowEls[9]).toHaveFocus())

    await user.keyboard('{ArrowDown}')
    expect(rowEls[9]).toHaveFocus()

    await user.keyboard('{Home}')
    await waitFor(() => expect(rowEls[0]).toHaveFocus())
  })

  it('leaves rows out of the tab order when they are not activatable', () => {
    renderGrid()

    expect(dataRows()[0]).not.toHaveAttribute('tabindex')
  })

  it('reports a row toggle and reflects a controlled selection', async () => {
    const user = userEvent.setup()
    const onSelectionChange = vi.fn()
    const { rerender } = renderSelectionGrid({
      selectedRowIds: [],
      onSelectionChange,
    })

    await user.click(screen.getByRole('checkbox', { name: 'Select Row 01' }))
    expect(onSelectionChange).toHaveBeenLastCalledWith(['r1'])

    // The page owns the ids, so only handing them back checks the box.
    rerender(
      <DataGrid
        data={rows}
        columns={selectionColumns}
        getRowId={(row) => row.id}
        caption="Selectable rows"
        initialPageSize={10}
        selectedRowIds={['r1']}
        onSelectionChange={onSelectionChange}
      />,
    )

    expect(screen.getByRole('checkbox', { name: 'Select Row 01' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Select Row 00' })).not.toBeChecked()
    expect(screen.getByText('Row 01').closest('tr')).toHaveAttribute('data-selected')
    expect(screen.getByText('Row 00').closest('tr')).not.toHaveAttribute('data-selected')
  })

  it('extends the selection with Shift+Arrow from the row it started on', async () => {
    const user = userEvent.setup()
    const onSelectRange = vi.fn()
    renderSelectionGrid({
      selectedRowIds: [],
      onSelectionChange: vi.fn(),
      onSelectRange,
      // Rows are only focusable in a grid that activates them.
      onRowActivate: vi.fn(),
    })

    act(() => screen.getByText('Row 00').closest('tr')!.focus())

    await user.keyboard('{Shift>}{ArrowDown}{/Shift}')
    expect(onSelectRange).toHaveBeenLastCalledWith(['r0', 'r1'])

    // A second press grows the same run instead of starting again at r1.
    await user.keyboard('{Shift>}{ArrowDown}{/Shift}')
    expect(onSelectRange).toHaveBeenLastCalledWith(['r0', 'r1', 'r2'])

    // Back up: the range shrinks to what is between the anchor and the edge.
    await user.keyboard('{Shift>}{ArrowUp}{/Shift}')
    expect(onSelectRange).toHaveBeenLastCalledWith(['r0', 'r1'])

    // Without Shift, the next run starts from where the reader now stands:
    // one step down to Row 02, then a fresh run covers just the two rows.
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{Shift>}{ArrowDown}{/Shift}')
    expect(onSelectRange).toHaveBeenLastCalledWith(['r2', 'r3'])
  })

  it('selects the whole page from the header checkbox', async () => {
    const user = userEvent.setup()
    const onSelectionChange = vi.fn()
    renderSelectionGrid({ onSelectionChange })

    const header = screen.getByRole('checkbox', { name: 'Select all rows on this page' })
    await user.click(header)

    expect(onSelectionChange).toHaveBeenLastCalledWith(rows.slice(0, 10).map((row) => row.id))
    expect(header).toBeChecked()

    await user.click(header)
    expect(onSelectionChange).toHaveBeenLastCalledWith([])
    expect(header).not.toBeChecked()
  })

  it('clears every checkbox when the controlled ids are emptied', () => {
    const onSelectionChange = vi.fn()
    const { rerender } = renderSelectionGrid({
      selectedRowIds: ['r0', 'r1'],
      onSelectionChange,
    })

    expect(screen.getByRole('checkbox', { name: 'Select Row 00' })).toBeChecked()

    rerender(
      <DataGrid
        data={rows}
        columns={selectionColumns}
        getRowId={(row) => row.id}
        caption="Selectable rows"
        initialPageSize={10}
        selectedRowIds={[]}
        onSelectionChange={onSelectionChange}
      />,
    )

    expect(screen.getByRole('checkbox', { name: 'Select Row 00' })).not.toBeChecked()
    expect(screen.queryByText('Row 00')?.closest('tr')).not.toHaveAttribute('data-selected')
  })

  it('uses meta.width as the column size', () => {
    renderGrid({
      columns: [{ accessorKey: 'name', header: 'Name', meta: { width: 120 } }],
    })

    // Without this, TanStack falls back to its 150px default and a narrow
    // utility column (selection, actions) silently reserves too much room.
    expect(document.querySelector('colgroup col')).toHaveStyle({ width: '120px' })
  })

  it('keeps one tab stop in the header and moves it with the arrow keys', async () => {
    const user = userEvent.setup()
    renderGrid()

    const sortButtons = [...document.querySelectorAll<HTMLButtonElement>('thead button[data-sort-header]')]
    expect(sortButtons).toHaveLength(3)
    // Eight sort buttons in the tab order meant eight presses before the rows;
    // only the current sort (or the first column) is a stop.
    expect(sortButtons.map((button) => button.tabIndex)).toEqual([0, -1, -1])

    sortButtons[0]!.focus()
    await user.keyboard('{ArrowRight}')
    expect(sortButtons[1]).toHaveFocus()
    await user.keyboard('{ArrowLeft}')
    expect(sortButtons[0]).toHaveFocus()
  })

  it('publishes the filtered rows and the match count for bulk selection', async () => {
    const user = userEvent.setup()
    const filteredRowsRef = { current: [] as Row[] }
    const onSelectionSummaryChange = vi.fn()
    renderSelectionGrid({ filteredRowsRef, onSelectionSummaryChange })

    expect(filteredRowsRef.current).toHaveLength(rows.length)

    await user.click(screen.getByRole('checkbox', { name: 'Select Row 00' }))
    expect(onSelectionSummaryChange).toHaveBeenLastCalledWith({
      selected: 1,
      inView: 1,
      matching: rows.length,
      pageSize: 10,
    })

    // Narrowing the match also narrows what "select all matching" means, so the
    // page can offer the rest of the filtered set rather than the whole source.
    await user.type(screen.getByRole('searchbox', { name: 'Search all columns' }), 'Row 0')
    await flushSearchDebounce()

    await waitFor(() => expect(filteredRowsRef.current).toHaveLength(10))
    expect(onSelectionSummaryChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ matching: 10 }),
    )
  })
})
