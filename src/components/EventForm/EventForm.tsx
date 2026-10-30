import { zodResolver } from '@hookform/resolvers/zod'
import * as Dialog from '@radix-ui/react-dialog'
import { AlertTriangle, CalendarPlus, Loader2, Save, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { EventDraft, EventRecord } from '@/data/types'
import {
  EVENT_CATEGORIES,
  EVENT_PRIORITIES,
  EVENT_STATUSES,
  PRIORITY_LABEL,
  STATUS_LABEL,
} from '@/data/types'
import { formatMinute, todayIso } from '@/lib/dates'
import { isRealIsoDay, DURATION_OPTIONS, eventFormSchema, parseTimeToMinute, type EventFormValues } from './schema'
import { Field } from './Field'
import { inputClass, selectClass } from './styles'

export interface EventFormProps {
  open: boolean
  mode: 'create' | 'edit'
  /** Present in edit mode; ignored when creating. */
  event?: EventRecord | null
  onOpenChange: (open: boolean) => void
  /** Resolve to close the dialog; reject to surface a save error inside the form. */
  onSubmit: (draft: EventDraft) => Promise<void> | void
  /** The control that opened the dialog: focus returns here on close. */
  returnFocusTo?: HTMLElement | null
}

function toFormValues(event?: EventRecord | null): EventFormValues {
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

export function EventForm({ open, mode, event, onOpenChange, onSubmit, returnFocusTo }: EventFormProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const keepEditingRef = useRef<HTMLButtonElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const wasConfirming = useRef(false)

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: toFormValues(event),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    // The requirement, straight from react-hook-form: on a failed submit, focus
    // moves to the first field whose validation failed.
    shouldFocusError: true,
  })

  const { errors, isDirty } = form.formState

  useEffect(() => {
    // Reopening on a different event must start from that event's values.
    // Opening state (saving/discard/save error) is cleared by close().
    if (open) form.reset(toFormValues(event))
  }, [open, event, form])

  const close = () => {
    form.reset(toFormValues(event))
    setConfirmDiscard(false)
    setSaveError(null)
    onOpenChange(false)
  }

  const requestClose = () => {
    if (isSaving) return
    // Escape or Cancel while the prompt is up means "keep editing".
    if (confirmDiscard) {
      setConfirmDiscard(false)
      return
    }
    if (isDirty) {
      setConfirmDiscard(true)
      return
    }
    close()
  }

  // The prompt replaces the action row, so move focus onto it and put it back
  // on Cancel when the prompt is dismissed.
  useEffect(() => {
    if (confirmDiscard) {
      wasConfirming.current = true
      keepEditingRef.current?.focus()
    } else if (wasConfirming.current) {
      wasConfirming.current = false
      cancelRef.current?.focus()
    }
  }, [confirmDiscard])

  const submit = form.handleSubmit(async (values) => {
    setIsSaving(true)
    setSaveError(null)

    const draft: EventDraft = {
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

    try {
      await onSubmit(draft)
      form.reset(toFormValues({ ...draft, id: event?.id ?? 'draft', search: '' }))
      onOpenChange(false)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save the event. Try again.')
    } finally {
      setIsSaving(false)
    }
  })

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) requestClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay fixed inset-0 z-40 bg-black/65 backdrop-blur-[3px]" />
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
          <Dialog.Content
            className="dialog-content pointer-events-auto max-h-[calc(100dvh-2rem)] w-full max-w-[720px] overflow-y-auto rounded-lg border border-line-strong bg-surface shadow-2xl shadow-black/70"
            aria-describedby="event-form-description"
            onOpenAutoFocus={(event) => {
              // Skip the close button and land on the first real field.
              event.preventDefault()
              form.setFocus('title')
            }}
            onCloseAutoFocus={(event) => {
              // The opener is usually outside the dialog (a toolbar or row
              // button), so Radix's trigger heuristic cannot find it.
              if (!returnFocusTo?.isConnected) return
              event.preventDefault()
              returnFocusTo.focus({ preventScroll: true })
            }}
          >
            <div className="flex items-start gap-4 border-b border-line px-5 py-4">
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-sm border border-accent/30 bg-accent/10">
                <CalendarPlus aria-hidden="true" className="size-4 text-accent" />
              </span>
              <div className="min-w-0 flex-1">
                <Dialog.Title className="text-sm font-semibold text-ink">
                  {mode === 'create' ? 'New event' : 'Edit event'}
                </Dialog.Title>
                <Dialog.Description id="event-form-description" className="mt-1 text-xs text-muted">
                  {mode === 'create'
                    ? 'Adds the event to the registry and to the agenda. Title and date are required.'
                    : 'Changes are applied to both the registry and the agenda.'}
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close dialog"
                  className="rounded-xs p-1.5 text-faint transition-colors hover:bg-raised hover:text-ink"
                >
                  <X aria-hidden="true" className="size-4" />
                </button>
              </Dialog.Close>
            </div>

            <form noValidate onSubmit={submit}>
              <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
                <Field label="Title" htmlFor="title" required error={errors.title?.message} className="sm:col-span-2">
                  <input
                    id="title"
                    type="text"
                    autoComplete="off"
                    placeholder="e.g. Deploy billing-api v3.2.0 to production"
                    aria-required="true"
                    aria-invalid={Boolean(errors.title)}
                    aria-describedby={errors.title ? 'title-error' : undefined}
                    className={inputClass}
                    {...form.register('title')}
                  />
                </Field>

                <Field
                  label="Date"
                  htmlFor="date"
                  required
                  error={errors.date?.message}
                  hint={!errors.date ? 'Local calendar day' : undefined}
                >
                  <input
                    id="date"
                    type="date"
                    aria-required="true"
                    aria-invalid={Boolean(errors.date)}
                    aria-describedby={errors.date ? 'date-error' : 'date-hint'}
                    className={inputClass}
                    {...form.register('date', {
                      validate: (value) => isRealIsoDay(value) || 'Enter a valid date, e.g. 2026-10-29',
                    })}
                  />
                </Field>

                <Field label="Start time" htmlFor="startTime" error={errors.startTime?.message}>
                  <input
                    id="startTime"
                    type="time"
                    step={300}
                    aria-invalid={Boolean(errors.startTime)}
                    aria-describedby={errors.startTime ? 'startTime-error' : undefined}
                    className={inputClass}
                    {...form.register('startTime')}
                  />
                </Field>

                <Field label="Duration" htmlFor="durationMin" error={errors.durationMin?.message}>
                  <select
                    id="durationMin"
                    className={selectClass}
                    aria-invalid={Boolean(errors.durationMin)}
                    aria-describedby={errors.durationMin ? 'durationMin-error' : undefined}
                    {...form.register('durationMin')}
                  >
                    {DURATION_OPTIONS.map((minutes) => (
                      <option key={minutes} value={minutes}>
                        {minutes} minutes
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Category" htmlFor="category" error={errors.category?.message}>
                  <select
                    id="category"
                    className={selectClass}
                    aria-invalid={Boolean(errors.category)}
                    aria-describedby={errors.category ? 'category-error' : undefined}
                    {...form.register('category')}
                  >
                    {EVENT_CATEGORIES.map((category) => (
                      <option key={category} value={category} className="capitalize">
                        {category}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Status" htmlFor="status" error={errors.status?.message}>
                  <select
                    id="status"
                    className={selectClass}
                    aria-invalid={Boolean(errors.status)}
                    aria-describedby={errors.status ? 'status-error' : undefined}
                    {...form.register('status')}
                  >
                    {EVENT_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {STATUS_LABEL[status]}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Priority" htmlFor="priority" error={errors.priority?.message}>
                  <select
                    id="priority"
                    className={selectClass}
                    aria-invalid={Boolean(errors.priority)}
                    aria-describedby={errors.priority ? 'priority-error' : undefined}
                    {...form.register('priority')}
                  >
                    {EVENT_PRIORITIES.map((priority) => (
                      <option key={priority} value={priority}>
                        {PRIORITY_LABEL[priority]}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Owner" htmlFor="owner" error={errors.owner?.message}>
                  <input
                    id="owner"
                    type="text"
                    autoComplete="off"
                    placeholder="Unassigned"
                    aria-invalid={Boolean(errors.owner)}
                    aria-describedby={errors.owner ? 'owner-error' : undefined}
                    className={inputClass}
                    {...form.register('owner')}
                  />
                </Field>

                <Field label="Location" htmlFor="location" error={errors.location?.message}>
                  <input
                    id="location"
                    type="text"
                    autoComplete="off"
                    placeholder="Remote"
                    aria-invalid={Boolean(errors.location)}
                    aria-describedby={errors.location ? 'location-error' : undefined}
                    className={inputClass}
                    {...form.register('location')}
                  />
                </Field>

                <Field label="Notes" htmlFor="notes" error={errors.notes?.message} className="sm:col-span-2">
                  <textarea
                    id="notes"
                    rows={2}
                    placeholder="Optional context for the attendees…"
                    aria-invalid={Boolean(errors.notes)}
                    aria-describedby={errors.notes ? 'notes-error' : undefined}
                    className={`${inputClass} h-auto resize-y py-2`}
                    {...form.register('notes')}
                  />
                </Field>
              </div>

              <div className="border-t border-line bg-raised/40 px-5 py-3">
                {saveError ? (
                  <p role="alert" className="mb-3 flex items-start gap-2 rounded-sm border border-rose/25 bg-rose/10 px-2.5 py-2 text-[11px] text-rose">
                    <AlertTriangle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
                    {saveError}
                  </p>
                ) : null}

                {confirmDiscard ? (
                  <div className="flex flex-wrap items-center gap-2 rounded-sm border border-amber/25 bg-amber/[0.07] px-2.5 py-2">
                    <p className="mr-auto text-[11px] text-amber">Discard your unsaved changes?</p>
                    <button
                      type="button"
                      ref={keepEditingRef}
                      onClick={() => setConfirmDiscard(false)}
                      className="h-8 rounded-xs border border-line bg-canvas px-3 text-[11px] font-medium text-ink hover:border-line-strong"
                    >
                      Keep editing
                    </button>
                    <button
                      type="button"
                      onClick={close}
                      className="h-8 rounded-xs border border-rose/30 bg-rose/10 px-3 text-[11px] font-medium text-rose hover:bg-rose/15"
                    >
                      Discard changes
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      ref={cancelRef}
                      onClick={requestClose}
                      disabled={isSaving}
                      className="h-9 rounded-sm border border-line bg-canvas px-4 text-xs font-medium text-muted transition-colors hover:border-line-strong hover:text-ink disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="inline-flex h-9 items-center gap-2 rounded-sm border border-accent/40 bg-accent/15 px-4 text-xs font-semibold text-accent transition-colors hover:bg-accent/20 disabled:opacity-60"
                    >
                      {isSaving ? (
                        <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
                      ) : (
                        <Save aria-hidden="true" className="size-3.5" />
                      )}
                      {isSaving ? 'Saving…' : mode === 'create' ? 'Create event' : 'Save changes'}
                    </button>
                  </div>
                )}
              </div>
            </form>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
