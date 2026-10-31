import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { EventDraft } from '@/features/events/model'
import { DATASET_SIZE } from '@/features/events/model'
import { useEventStore } from './events'

const draft: EventDraft = {
  title: 'Deploy billing-api',
  date: '2026-11-02',
  startMinute: 9 * 60,
  durationMin: 60,
  category: 'deploy',
  status: 'scheduled',
  priority: 'high',
  owner: 'Nora Haddad',
  location: 'eu-west-1',
}

describe('event store', () => {
  beforeEach(() => {
    useEventStore.setState({
      events: [],
      status: 'idle',
      error: null,
      lastLoadedAt: null,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('loads the dataset after the simulated latency', async () => {
    vi.useFakeTimers()
    const loading = useEventStore.getState().load()
    expect(useEventStore.getState().status).toBe('loading')

    await vi.advanceTimersByTimeAsync(500)
    await loading

    const state = useEventStore.getState()
    expect(state.status).toBe('ready')
    expect(state.events).toHaveLength(DATASET_SIZE)
    expect(state.lastLoadedAt).not.toBeNull()
    vi.useRealTimers()
  })

  it('surfaces a load error and recovers on retry', async () => {
    vi.useFakeTimers()
    const failing = useEventStore.getState().load({ fail: true })
    await vi.advanceTimersByTimeAsync(500)
    await failing

    expect(useEventStore.getState().status).toBe('error')
    expect(useEventStore.getState().error).toMatch(/simulated/i)

    const retry = useEventStore.getState().load()
    await vi.advanceTimersByTimeAsync(500)
    await retry

    expect(useEventStore.getState().status).toBe('ready')
    expect(useEventStore.getState().error).toBeNull()
    vi.useRealTimers()
  })

  it('creates a searchable event at the front of the list', () => {
    useEventStore.setState({ events: [], status: 'ready' })

    const created = useEventStore.getState().createEvent(draft)

    expect(created.id).toMatch(/^evt_new_/)
    expect(created.search).toContain('deploy billing-api')
    expect(created.search).toContain('nora haddad')
    expect(useEventStore.getState().events[0]).toBe(created)
  })

  it('updates the record and rebuilds its search haystack', () => {
    useEventStore.setState({ events: [], status: 'ready' })
    const created = useEventStore.getState().createEvent(draft)

    useEventStore
      .getState()
      .updateEvent(created.id, { ...draft, title: 'Release billing-api', priority: 'critical' })

    const updated = useEventStore.getState().events[0]!
    expect(updated.id).toBe(created.id)
    expect(updated.title).toBe('Release billing-api')
    expect(updated.search).toContain('release billing-api')
    expect(updated.search).toContain('critical')
  })
})
