import type { EventRecord } from './types'

type SearchableEvent = Pick<
  EventRecord,
  'title' | 'owner' | 'location' | 'category' | 'status' | 'priority' | 'date'
>

/**
 * The single definition of the global-search haystack.
 *
 * Generation and the store both call this, so an event created through the form
 * is searchable exactly like a seeded one.
 */
export function buildSearchText(event: SearchableEvent): string {
  return `${event.title} ${event.owner} ${event.location} ${event.category} ${event.status} ${event.priority} ${event.date}`.toLowerCase()
}
