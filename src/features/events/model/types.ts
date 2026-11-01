/**
 * Domain model for the demo.
 *
 * A few deliberate choices:
 * - `date` is a local calendar day in `yyyy-MM-dd` form. It sorts correctly as a
 *   plain string (no Date objects in the hot path) and round-trips into
 *   <input type="date"> without timezone surprises.
 * - `startMinute` is minutes from midnight instead of a Date. Cheap to compare,
 *   cheap to format, and avoids constructing 100k Date instances.
 * - `search` is a precomputed lowercase haystack. Global filtering touches this
 *   one string instead of re-concatenating six fields for every keystroke.
 */
export const EVENT_CATEGORIES = [
  'meeting',
  'deploy',
  'incident',
  'maintenance',
  'release',
  'review',
] as const

export const EVENT_STATUSES = [
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
  'at_risk',
] as const

export const EVENT_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const

export type EventCategory = (typeof EVENT_CATEGORIES)[number]
export type EventStatus = (typeof EVENT_STATUSES)[number]
export type EventPriority = (typeof EVENT_PRIORITIES)[number]

export interface EventRecord {
  id: string
  title: string
  /** Local calendar day, `yyyy-MM-dd`. */
  date: string
  /** Minutes from midnight, 0–1439. */
  startMinute: number
  durationMin: number
  category: EventCategory
  status: EventStatus
  priority: EventPriority
  owner: string
  location: string
  notes?: string
  /** Precomputed lowercase haystack for global search. */
  search: string
}

export type EventDraft = Omit<EventRecord, 'id' | 'search'>

export const STATUS_LABEL: Record<EventStatus, string> = {
  scheduled: 'Scheduled',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  at_risk: 'At risk',
}

export const PRIORITY_LABEL: Record<EventPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

/** Human labels + badge classes live together so grid and timeline cannot drift. */
export const STATUS_TONE: Record<EventStatus, string> = {
  scheduled: 'border-sky/30 bg-sky/10 text-sky',
  in_progress: 'border-amber/30 bg-amber/10 text-amber',
  completed: 'border-lime/25 bg-lime/10 text-lime',
  cancelled: 'border-line-strong bg-raised text-faint',
  at_risk: 'border-rose/30 bg-rose/10 text-rose',
}

export const PRIORITY_TONE: Record<EventPriority, string> = {
  critical: 'text-rose',
  high: 'text-amber',
  medium: 'text-sky',
  low: 'text-faint',
}

export const CATEGORY_TONE: Record<EventCategory, string> = {
  meeting: 'text-violet',
  deploy: 'text-sky',
  incident: 'text-rose',
  maintenance: 'text-amber',
  release: 'text-lime',
  review: 'text-accent',
}
