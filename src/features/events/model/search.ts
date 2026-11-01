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

/** Normalize a user query once when scanning many rows. */
export function normalizeSearchQuery(query: string): string {
  return query.trim().toLowerCase()
}

/** Test a pre-normalized query against a record's haystack. */
export function matchesNormalizedSearch(
  event: Pick<EventRecord, 'search'>,
  needle: string,
): boolean {
  return needle === '' || event.search.includes(needle)
}

/** Convenience for one-off checks, such as TanStack's global filter callback. */
export function matchesSearch(event: Pick<EventRecord, 'search'>, query: string): boolean {
  return matchesNormalizedSearch(event, normalizeSearchQuery(query))
}
