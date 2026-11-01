import { useCallback } from 'react'
import type { EventRecord } from '@/features/events/model'
import {
  useEventError,
  useEventStatus,
  useEvents,
  useEventStore,
  type LoadStatus,
} from './events'

export interface EventFeed {
  events: EventRecord[]
  status: LoadStatus
  error: string | null
  /** The first load has not completed yet: show the skeleton. */
  isLoading: boolean
  reload: () => void
  simulateError: () => void
}

/**
 * The only place pages read the event feed from the store.
 *
 * Both views need the same loading rule and the same reload action; keeping
 * them here means a new page cannot drift from the grid's definition of
 * "loading".
 */
export function useEventFeed(): EventFeed {
  const events = useEvents()
  const status = useEventStatus()
  const error = useEventError()
  const load = useEventStore((state) => state.load)

  const reload = useCallback(() => {
    void load()
  }, [load])

  const simulateError = useCallback(() => {
    void load({ fail: true })
  }, [load])

  return {
    events,
    status,
    error,
    isLoading: status === 'loading' || status === 'idle',
    reload,
    simulateError,
  }
}
