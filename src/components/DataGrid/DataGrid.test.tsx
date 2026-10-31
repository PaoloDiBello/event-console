import type { ColumnDef } from '@tanstack/react-table'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
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
  })

  it('filters a column with a select', async () => {
    const user = userEvent.setup()
    renderGrid()

    await user.selectOptions(screen.getByLabelText('Filter by Status'), 'on')

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('12 rows match. Showing 1 to 10.'),
    )
    expect(screen.queryByText('off')).not.toBeInTheDocument()
  })

  it('hides a column from the column menu', async () => {
    const user = userEvent.setup()
    renderGrid()

    await user.click(screen.getByRole('button', { name: /Columns/ }))
    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Status' }))

    expect(screen.queryByRole('columnheader', { name: 'Status' })).not.toBeInTheDocument()
  })

  it('shows the no-match state and recovers by clearing filters', async () => {
    const user = userEvent.setup()
    renderGrid()

    await user.type(screen.getByRole('searchbox', { name: 'Search all columns' }), 'nothing-matches')

    await screen.findByText('No rows match these filters')
    await user.click(screen.getByRole('button', { name: 'Clear filters' }))

    await screen.findByText('Row 00')
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
})
