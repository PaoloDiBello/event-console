import type {
  EventCategory,
  EventPriority,
  EventRecord,
  EventStatus,
} from './types'
import { buildSearchText } from './search'
import { shiftIsoDay, todayIso } from '@/shared/lib/dates'

/**
 * Deterministic mock data.
 *
 * The PRNG is seeded, so the same 100,000 rows appear on every reload. That
 * makes screenshots, perf numbers and "did the new row land in the same place?"
 * checks reproducible instead of luck.
 *
 * Shape of the dataset:
 * - 100,000 events total (the grid shows all of them)
 * - 10,400 of them fall inside the next 45 days (the timeline's default window)
 * - the other 89,600 are history, going back ~4 years
 */
export const DATASET_SIZE = 100_000
export const AGENDA_WINDOW_DAYS = 45
export const AGENDA_EVENT_COUNT = 10_400
export const DATASET_SEED = 0x5eed

/** Small, fast, seedable PRNG (mulberry32). Same seed → same dataset. */
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Rng = () => number

function pick<T>(rng: Rng, values: readonly T[]): T {
  return values[Math.floor(rng() * values.length)] as T
}

function totalWeight(entries: readonly (readonly [unknown, number])[]): number {
  return entries.reduce((sum, [, weight]) => sum + weight, 0)
}

function weighted<T>(
  rng: Rng,
  entries: readonly (readonly [T, number])[],
  total: number,
): T {
  let roll = rng() * total
  for (const [value, weight] of entries) {
    roll -= weight
    if (roll <= 0) return value
  }
  return entries[entries.length - 1]![0]
}

const SERVICES = [
  'billing-api',
  'identity',
  'checkout',
  'search',
  'notifications',
  'gateway',
  'analytics',
  'ledger',
  'scheduler',
  'media',
  'inventory',
  'pricing',
  'edge-cache',
  'data-warehouse',
  'web-app',
  'mobile-api',
  'reporting',
  'webhooks',
] as const

const TEAMS = [
  'Platform',
  'Payments',
  'Identity',
  'Growth',
  'SRE',
  'Data',
  'Core',
  'Checkout',
  'Security',
  'Mobile',
] as const

const PEOPLE = [
  'Nora Haddad',
  'Dragos Ilie',
  'Aziz Rahman',
  'Mira Okafor',
  'Tom Beckett',
  'Priya Nair',
  'Lena Vogt',
  'Sam Whitfield',
  'Yuki Tanaka',
  'Elena Costa',
  'Jonas Berg',
  'Fatima Zahra',
  'Owen Pryce',
  'Ana Sousa',
] as const

const LOCATIONS = [
  'Remote',
  'Zoom',
  'HQ · Room 4',
  'HQ · Room 12',
  'eu-west-1',
  'us-east-1',
  'ap-south-1',
  'War room',
  'Slack · #incidents',
  'Customer site',
] as const

const ENVIRONMENTS = ['production', 'staging', 'eu-west-1', 'us-east-1'] as const

const DURATIONS = [15, 30, 30, 45, 60, 60, 90, 120, 180] as const

const NOTES = [
  'Agenda shared in the team doc.',
  'On-call engineer is the point of contact.',
  'Requires a change-freeze exception.',
  'Follow-up ticket already open.',
  'Client asked to join the first 15 minutes.',
  'Rollback plan verified in staging.',
  'Depends on the identity migration landing first.',
  'Recording will be posted in the channel.',
] as const

const CATEGORY_WEIGHTS = [
  ['meeting', 30],
  ['deploy', 18],
  ['incident', 12],
  ['maintenance', 15],
  ['release', 12],
  ['review', 13],
] as const satisfies readonly (readonly [EventCategory, number])[]

const STATUS_FUTURE = [
  ['scheduled', 80],
  ['at_risk', 12],
  ['in_progress', 5],
  ['cancelled', 3],
] as const satisfies readonly (readonly [EventStatus, number])[]

const STATUS_PAST = [
  ['completed', 70],
  ['cancelled', 10],
  ['at_risk', 9],
  ['in_progress', 5],
  ['scheduled', 6],
] as const satisfies readonly (readonly [EventStatus, number])[]

const PRIORITIES = [
  ['low', 35],
  ['medium', 35],
  ['high', 22],
  ['critical', 8],
] as const satisfies readonly (readonly [EventPriority, number])[]

// Weight totals are invariant; compute them once instead of once per row.
const CATEGORY_TOTAL = totalWeight(CATEGORY_WEIGHTS)
const STATUS_FUTURE_TOTAL = totalWeight(STATUS_FUTURE)
const STATUS_PAST_TOTAL = totalWeight(STATUS_PAST)
const PRIORITY_TOTAL = totalWeight(PRIORITIES)

function makeTitle(rng: Rng, category: EventCategory): string {
  const service = pick(rng, SERVICES)
  const team = pick(rng, TEAMS)
  const env = pick(rng, ENVIRONMENTS)
  const version = `v${2 + Math.floor(rng() * 4)}.${Math.floor(rng() * 20)}.${Math.floor(rng() * 10)}`

  switch (category) {
    case 'meeting':
      return pick(rng, [
        `${team} weekly sync`,
        `${team} planning`,
        `Design review · ${service}`,
        `1:1 with ${pick(rng, PEOPLE).split(' ')[0]}`,
        `Quarterly roadmap · ${team}`,
      ])
    case 'deploy':
      return `Deploy ${service} ${version} to ${env}`
    case 'incident':
      return pick(rng, [
        `${service} latency spike`,
        `${service} error rate above SLO`,
        `Partial outage · ${service}`,
        `${service} queue backlog`,
      ])
    case 'maintenance':
      return pick(rng, [
        `Rotate ${service} credentials`,
        `${service} database failover drill`,
        `Patch window · ${env}`,
        `${service} index rebuild`,
      ])
    case 'release':
      return `Release ${service} ${version}`
    case 'review':
      return pick(rng, [
        `Postmortem · ${service}`,
        `${team} retro`,
        `Architecture review · ${service}`,
        `Security review · ${service}`,
      ])
  }
}

function makeEvent(rng: Rng, id: string, date: string, isFuture: boolean): EventRecord {
  const category = weighted(rng, CATEGORY_WEIGHTS, CATEGORY_TOTAL)
  const title = makeTitle(rng, category)
  const owner = pick(rng, PEOPLE)
  const location = pick(rng, LOCATIONS)
  const status = weighted(
    rng,
    isFuture ? STATUS_FUTURE : STATUS_PAST,
    isFuture ? STATUS_FUTURE_TOTAL : STATUS_PAST_TOTAL,
  )
  const priority = weighted(rng, PRIORITIES, PRIORITY_TOTAL)
  const notes = rng() < 0.22 ? pick(rng, NOTES) : undefined

  const event: EventRecord = {
    id,
    title,
    date,
    // Between 06:00 and 21:00 — an international on-call rota, not a coin flip
    // across the whole clock.
    startMinute: 6 * 60 + Math.floor((rng() * 15 * 60) / 5) * 5,
    durationMin: pick(rng, DURATIONS),
    category,
    status,
    priority,
    owner,
    location,
    ...(notes ? { notes } : {}),
    search: '',
  }

  // Fill the local row in place; spreading would allocate a second 100k-row set.
  event.search = buildSearchText(event)
  return event
}

/**
 * Builds the full dataset synchronously (~200 ms for 100k rows on a laptop).
 * The store calls this behind a small artificial delay so the grid's loading
 * state is real rather than decorative.
 */
export function generateEvents(seed = DATASET_SEED): EventRecord[] {
  const rng = mulberry32(seed)
  const today = todayIso()
  const events: EventRecord[] = new Array(DATASET_SIZE)

  // Dates repeat across thousands of rows. Precompute each offset once instead
  // of parsing and formatting an ISO day for every event.
  const futureDates = new Array<string>(AGENDA_WINDOW_DAYS)
  for (let offset = 0; offset < AGENDA_WINDOW_DAYS; offset += 1) {
    futureDates[offset] = shiftIsoDay(today, offset)
  }

  // Agenda window first so the timeline gets an exact, predictable slice.
  for (let i = 0; i < AGENDA_EVENT_COUNT; i += 1) {
    const offset = Math.floor(rng() * AGENDA_WINDOW_DAYS)
    events[i] = makeEvent(
      rng,
      `evt_${i.toString(36).padStart(5, '0')}`,
      futureDates[offset]!,
      true,
    )
  }

  // History: ~4 years back, excluding today so the "past" status mix stays honest.
  const archiveDays = 1460
  const archiveDates = new Array<string>(archiveDays)
  for (let offset = 0; offset < archiveDays; offset += 1) {
    archiveDates[offset] = shiftIsoDay(today, -(offset + 1))
  }
  for (let i = AGENDA_EVENT_COUNT; i < DATASET_SIZE; i += 1) {
    const offset = Math.floor(rng() * archiveDays)
    events[i] = makeEvent(
      rng,
      `evt_${i.toString(36).padStart(5, '0')}`,
      archiveDates[offset]!,
      false,
    )
  }

  return events
}

let sequence = DATASET_SIZE

/** Stable unique id for events created in the demo (no crypto dependency needed). */
export function nextEventId(): string {
  sequence += 1
  return `evt_new_${sequence.toString(36)}`
}
