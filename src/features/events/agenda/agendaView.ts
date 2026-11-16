import { parseIsoDay, shiftIsoDay, toIsoDay, todayIso } from '@/shared/lib/dates'
import { TIMELINE_SCOPES, type TimelineScope } from './agendaData'

/**
 * The agenda view is shareable too, and it uses the same `q` parameter as the
 * registry. The two views are lenses on one data set, so switching lenses keeps
 * the search — a link to `/timeline?q=billing` means the same thing as
 * `/grid?q=billing`, just arranged by day.
 *
 * Reading is strict: an unknown window, a day outside the 45-day horizon, or a
 * malformed date falls back to something a control can actually produce.
 */

const DEFAULT_SCOPE: TimelineScope = 45
const MAX_QUERY_LENGTH = 80

export interface AgendaView {
  query: string
  scope: TimelineScope
  atRiskOnly: boolean
  /** The day the jump control points at. */
  day: string
}

function isScope(value: number): value is TimelineScope {
  return (TIMELINE_SCOPES as readonly number[]).includes(value)
}

/** A scope that contains `day`, widened only when the link points past it. */
function scopeForDay(day: string, scope: TimelineScope, today: string): TimelineScope {
  if (day < shiftIsoDay(today, scope)) return scope
  return (
    TIMELINE_SCOPES.find((days) => day < shiftIsoDay(today, days)) ??
    TIMELINE_SCOPES[TIMELINE_SCOPES.length - 1]!
  )
}

function isIsoDay(value: string): boolean {
  return toIsoDay(parseIsoDay(value)) === value
}

export function readAgendaView(params: URLSearchParams, today = todayIso()): AgendaView {
  const query = (params.get('q') ?? '').slice(0, MAX_QUERY_LENGTH)

  const rawScope = Number(params.get('window'))
  const requestedScope = isScope(rawScope) ? rawScope : DEFAULT_SCOPE

  const lastDay = shiftIsoDay(today, TIMELINE_SCOPES[TIMELINE_SCOPES.length - 1]! - 1)
  const rawDay = params.get('day')
  const day =
    rawDay !== null && isIsoDay(rawDay) && rawDay >= today && rawDay <= lastDay ? rawDay : today

  return {
    query,
    scope: scopeForDay(day, requestedScope, today),
    atRiskOnly: params.get('at') === 'risk',
    day,
  }
}

/** Keep the default view out of the URL so plain `/timeline` stays canonical. */
export function writeAgendaView(view: AgendaView, today = todayIso()): URLSearchParams {
  const params = new URLSearchParams()

  if (view.query !== '') params.set('q', view.query)
  if (view.scope !== DEFAULT_SCOPE) params.set('window', String(view.scope))
  if (view.atRiskOnly) params.set('at', 'risk')
  if (view.day !== today) params.set('day', view.day)

  return params
}
