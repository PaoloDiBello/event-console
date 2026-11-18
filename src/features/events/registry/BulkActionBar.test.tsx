import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { BulkActionBar } from './BulkActionBar'

function renderBar(overrides: Partial<Parameters<typeof BulkActionBar>[0]> = {}) {
  const props = {
    count: 50,
    matching: 9513,
    pageSize: 50,
    onSelectAll: vi.fn(),
    onClear: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  }
  render(<BulkActionBar {...props} />)
  return props
}

describe('BulkActionBar', () => {
  it('offers the rest of the match once the page is selected', async () => {
    const user = userEvent.setup()
    const props = renderBar()

    // The header checkbox can only reach the page; the bar is where the other
    // 9,463 rows become reachable.
    await user.click(screen.getByRole('button', { name: 'Select all 9,513 matching' }))
    expect(props.onSelectAll).toHaveBeenCalledOnce()

    expect(screen.getByRole('button', { name: 'Delete 50 selected events' })).toBeInTheDocument()
    expect(screen.getByText('selected')).toBeInTheDocument()
  })

  it('stays quiet while only part of the page is ticked', () => {
    renderBar({ count: 3 })

    expect(screen.queryByRole('button', { name: /^Select all/ })).not.toBeInTheDocument()
  })

  it('drops the offer once everything matching is selected', () => {
    renderBar({ count: 9513 })

    expect(screen.queryByRole('button', { name: /^Select all/ })).not.toBeInTheDocument()
  })

  it('writes large counts with separators', () => {
    renderBar({ count: 9513 })

    // "Delete 9513 events" is a number to parse; "9,513" is a count to read.
    expect(screen.getByText('9,513')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete 9,513 selected events' })).toBeInTheDocument()
  })
})
