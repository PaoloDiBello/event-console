import type { EventDraft, EventRecord } from '@/features/events/model'
import { formatMinute, todayIso } from '@/shared/lib/dates'
import { DURATION_OPTIONS, parseTimeToMinute, type EventFormValues } from './schema'

/** Map an existing event onto editable form values, with safe defaults. */
export function toFormValues(event?: EventRecord | null): EventFormValues {
  const duration = event ? String(event.durationMin) : '60'
  return {
    title: event?.title ?? '',
    date: event?.date ?? todayIso(),
    startTime: event ? formatMinute(event.startMinute) : '09:00',
    durationMin: (DURATION_OPTIONS as readonly string[]).includes(duration)
      ? (duration as EventFormValues['durationMin'])
      : '60',
    category: event?.category ?? 'meeting',
    status: event?.status ?? 'scheduled',
    priority: event?.priority ?? 'medium',
    owner: event?.owner ?? '',
    location: event?.location ?? '',
    notes: event?.notes ?? '',
  }
}

export interface EndEstimate {
  /** Ready to render: `Ends 11:00` or `Ends 01:30 (next day)`. */
  label: string
  /** The event runs past midnight, so it no longer ends on its own day. */
  spills: boolean
}

/**
 * What the start time plus the duration add up to, so the form can show the
 * end time instead of leaving the user to do the arithmetic. Returns null for
 * an incomplete time, which is what the field holds while it is being typed.
 */
export function describeEnd(startTime: string, duration: string): EndEstimate | null {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)) return null
  const end = parseTimeToMinute(startTime) + Number(duration)
  if (!Number.isFinite(end)) return null
  return {
    label: `Ends ${formatMinute(end % 1440)}${end >= 1440 ? ' (next day)' : ''}`,
    spills: end >= 1440,
  }
}

/**
 * Map validated form values onto the domain draft. This is a pure function so
 * the trim/default rules can be tested without mounting the dialog.
 */
export function toEventDraft(values: EventFormValues): EventDraft {
  return {
    title: values.title.trim(),
    date: values.date,
    startMinute: parseTimeToMinute(values.startTime),
    durationMin: Number(values.durationMin),
    category: values.category,
    status: values.status,
    priority: values.priority,
    owner: values.owner.trim() || 'Unassigned',
    location: values.location.trim() || 'Remote',
    ...(values.notes.trim() ? { notes: values.notes.trim() } : {}),
  }
}
