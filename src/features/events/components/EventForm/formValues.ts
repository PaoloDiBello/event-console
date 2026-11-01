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
