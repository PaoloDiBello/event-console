import type { ColumnDef } from '@tanstack/react-table'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { formatGridDate, todayIso } from '@/shared/lib/dates'
import { DataGrid } from './DataGrid'

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

function renderGrid(focusRowId?: string) {
  return render(
    <DataGrid
      data={rows}
      columns={columns}
      getRowId={(row) => row.id}
      caption="Test rows"
      initialPageSize={10}
      focusRowId={focusRowId}
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

async function chooseStatus(user: UserEvent, option: 'All' | 'On' | 'Off') {
  await user.click(statusFilter())
  await user.click(await screen.findByRole('menuitemradio', { name: option }))
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

    await chooseStatus(user, 'On')

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('12 rows match. Showing 1 to 10.'),
    )
    expect(screen.queryByText('off')).not.toBeInTheDocument()
  })

  it('marks the current option in the select menu', async () => {
    const user = userEvent.setup()
    renderGrid()

    await chooseStatus(user, 'Off')

    await user.click(statusFilter())

    expect(await screen.findByRole('menuitemradio', { name: 'Off' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(screen.getByRole('menuitemradio', { name: 'All' })).toHaveAttribute(
      'aria-checked',
      'false',
    )

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('resets a select filter from the All option', async () => {
    const user = userEvent.setup()
    renderGrid()

    await chooseStatus(user, 'On')
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('12 rows match.'))

    await chooseStatus(user, 'All')

    expect(statusFilter()).toHaveAccessibleName('Filter by Status')
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('23 rows match. Showing 1 to 10.'),
    )
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

    await screen.findByText('No rows match your search')
    await user.click(screen.getByRole('button', { name: 'Clear search' }))

    await screen.findByText('Row 00')
  })

  it('clears column filters without discarding the search', async () => {
    const user = userEvent.setup()
    renderGrid()

    const search = screen.getByRole('searchbox', { name: 'Search all columns' })
    await user.type(search, 'Row')
    await chooseStatus(user, 'On')
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('12 rows match. Showing 1 to 10.'),
    )

    await user.click(screen.getByRole('button', { name: 'Clear 1 filter' }))

    expect(search).toHaveValue('Row')
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('23 rows match. Showing 1 to 10.'),
    )
  })

  it('clears search without discarding column filters', async () => {
    const user = userEvent.setup()
    renderGrid()

    await chooseStatus(user, 'On')
    const search = screen.getByRole('searchbox', { name: 'Search all columns' })
    await user.type(search, 'Row 0')
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('5 rows match. Showing 1 to 5.'),
    )

    await user.click(screen.getByRole('button', { name: 'Clear search field' }))
    expect(statusFilter()).toHaveAccessibleName('Filter by Status, currently On')
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('12 rows match. Showing 1 to 10.'),
    )
  })

  it('resets both search and filters from the combined no-match state', async () => {
    const user = userEvent.setup()
    renderGrid()

    await chooseStatus(user, 'On')
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
    renderGrid('r22')

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
    await chooseStatus(user, 'On')

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

    await chooseStatus(user, 'On')
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
})
