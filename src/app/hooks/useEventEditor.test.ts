import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import type { EventDraft } from '@/features/events/model'
import { useEventStore } from '@/features/events/store'
import { useEventEditor } from './useEventEditor'

function draft(title: string): EventDraft {
  return {
    title,
    date: '2026-11-18',
    startMinute: 9 * 60,
    durationMin: 30,
    category: 'deploy',
    status: 'scheduled',
    priority: 'medium',
    owner: 'Nora Haddad',
    location: 'eu-west-1',
  }
}

describe('useEventEditor', () => {
  beforeEach(() => {
    useEventStore.setState({ events: [], status: 'ready', error: null })
  })

  it('bulk deletes through the shared toast and undo path', () => {
    const store = useEventStore.getState()
    const first = store.createEvent(draft('First'))
    const second = store.createEvent(draft('Second'))
    const third = store.createEvent(draft('Third'))
    const { result } = renderHook(() => useEventEditor())

    act(() => result.current.handleBulkDelete([first.id, second.id]))

    expect(useEventStore.getState().events.map((event) => event.id)).toEqual([third.id])
    expect(result.current.success).toBe('2 events deleted.')
    expect(result.current.undoAction?.label).toBe('Undo')

    act(() => result.current.undoAction?.onClick())

    // The store restores every record to the index it came from.
    expect(useEventStore.getState().events.map((event) => event.id)).toEqual([
      third.id,
      second.id,
      first.id,
    ])
    expect(result.current.success).toBe('2 events restored.')
  })

  it('names a single deleted event instead of counting', () => {
    const store = useEventStore.getState()
    const only = store.createEvent(draft('Only event'))
    const { result } = renderHook(() => useEventEditor())

    act(() => result.current.handleBulkDelete([only.id]))

    expect(result.current.success).toBe('Event “Only event” deleted.')
  })
})
