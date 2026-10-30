import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { TimelineGroup } from './types'
import { Timeline } from './Timeline'

// jsdom has no layout: render the whole flattened list and exercise the
// roving-tabindex / announcement behaviour.
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => {
    const items = Array.from({ length: count }, (_, index) => ({
      index,
      key: index,
      start: index * 84,
      end: (index + 1) * 84,
      size: 84,
      lane: 0,
    }))

    return {
      getVirtualItems: () => items,
      getTotalSize: () => items.length * 84,
      scrollToIndex: vi.fn(),
      measureElement: vi.fn(),
    }
  },
}))

interface Item {
  id: string
  title: string
  status: string
}

const groups: TimelineGroup<Item>[] = [
  {
    key: '2026-10-29',
    label: 'Thursday, 29 October',
    shortLabel: 'Today',
    items: [
      { id: 'a', title: 'Alpha', status: 'scheduled' },
      { id: 'b', title: 'Beta', status: 'scheduled' },
    ],
  },
  {
    key: '2026-10-30',
    label: 'Friday, 30 October',
    shortLabel: 'Tomorrow',
    items: [{ id: 'c', title: 'Gamma', status: 'at risk' }],
  },
]

function renderTimeline() {
  const onActivate = vi.fn()
  render(
    <Timeline
      groups={groups}
      getItemId={(item) => item.id}
      getItemLabel={(item) => `${item.title}, ${item.status}`}
      renderItem={(item) => <span>{item.title}</span>}
      onItemActivate={onActivate}
      ariaLabel="Agenda"
    />,
  )
  return { onActivate }
}

describe('Timeline', () => {
  it('keeps exactly one item in the tab order', () => {
    renderTimeline()
    const items = screen.getAllByRole('button')

    expect(items).toHaveLength(3)
    expect(items.filter((item) => item.tabIndex === 0)).toHaveLength(1)
  })

  it('moves between items with the arrow keys and announces each move', async () => {
    const user = userEvent.setup()
    renderTimeline()
    const items = screen.getAllByRole('button')

    act(() => items[0]!.focus())
    expect(screen.getByRole('status')).toHaveTextContent('Today: Alpha, scheduled, 1 of 2')

    await user.keyboard('{ArrowDown}')
    expect(items[1]).toHaveFocus()
    expect(screen.getByRole('status')).toHaveTextContent('Today: Beta, scheduled, 2 of 2')

    await user.keyboard('{ArrowRight}')
    expect(items[2]).toHaveFocus()
    expect(screen.getByRole('status')).toHaveTextContent('Tomorrow: Gamma, at risk, 1 of 1')

    await user.keyboard('{ArrowLeft}')
    expect(items[0]).toHaveFocus()

    await user.keyboard('{End}')
    expect(items[2]).toHaveFocus()

    await user.keyboard('{Home}')
    expect(items[0]).toHaveFocus()
  })

  it('activates the focused item with Enter', async () => {
    const user = userEvent.setup()
    const { onActivate } = renderTimeline()

    act(() => screen.getAllByRole('button')[1]!.focus())
    await user.keyboard('{Enter}')

    expect(onActivate).toHaveBeenCalledWith(groups[0]!.items[1])
  })
})
