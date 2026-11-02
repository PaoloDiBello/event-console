import {
  buildSearchText,
  generateEvents,
  nextEventId,
  type EventDraft,
  type EventRecord,
} from '@/features/events/model'
import { create } from 'zustand'

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'

/**
 * One frame plus a little slack: enough for the skeleton to paint before the
 * synchronous 100k-row build, without adding noticeable startup latency.
 */
const LOAD_DELAY_MS = 120

interface EventStore {
  events: EventRecord[]
  status: LoadStatus
  error: string | null
  lastLoadedAt: number | null
  /** Load (or reload) the mock dataset. `fail` exists so the demo can show the error state on purpose. */
  load: (options?: { fail?: boolean }) => Promise<void>
  createEvent: (draft: EventDraft) => EventRecord
  updateEvent: (id: string, draft: EventDraft) => void
}

function withSearch(draft: EventDraft): Omit<EventRecord, 'id'> {
  return { ...draft, search: buildSearchText(draft) }
}

/**
 * One store for the whole demo. Both the grid and the timeline read the same
 * `events` array, which is why "add an event" needs no syncing code: there is
 * only one place for the data to land.
 */
export const useEventStore = create<EventStore>()((set, get) => ({
  events: [],
  status: 'idle',
  error: null,
  lastLoadedAt: null,

  load: async ({ fail = false } = {}) => {
    if (get().status === 'loading') return
    set({ status: 'loading', error: null })

    await new Promise((resolve) => setTimeout(resolve, LOAD_DELAY_MS))

    if (fail) {
      set({
        status: 'error',
        error: 'Could not reach the events service (simulated). Retry to reload the dataset.',
      })
      return
    }

    set({ events: generateEvents(), status: 'ready', lastLoadedAt: Date.now(), error: null })
  },

  createEvent: (draft) => {
    const event: EventRecord = { id: nextEventId(), ...withSearch(draft) }
    set((state) => ({ events: [event, ...state.events] }))
    return event
  },

  updateEvent: (id, draft) => {
    set((state) => ({
      events: state.events.map((event) =>
        event.id === id ? { ...event, ...withSearch(draft) } : event,
      ),
    }))
  },
}))

export const useEvents = () => useEventStore((state) => state.events)
export const useEventStatus = () => useEventStore((state) => state.status)
export const useEventError = () => useEventStore((state) => state.error)
