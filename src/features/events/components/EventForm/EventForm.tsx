import { zodResolver } from '@hookform/resolvers/zod'
import * as Dialog from '@radix-ui/react-dialog'
import { CalendarPlus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { EventDraft, EventRecord } from '@/features/events/model'
import { EventFormFields } from './EventFormFields'
import { EventFormFooter } from './EventFormFooter'
import { toFormValues } from './formValues'
import { eventFormSchema, parseTimeToMinute, type EventFormValues } from './schema'

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

export function EventForm({
  open,
  mode,
  event,
  onOpenChange,
  onSubmit,
  returnFocusTo,
}: EventFormProps) {
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

  const { isDirty } = form.formState

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
              <EventFormFields form={form} />
              <EventFormFooter
                mode={mode}
                isSaving={isSaving}
                saveError={saveError}
                confirmDiscard={confirmDiscard}
                keepEditingRef={keepEditingRef}
                cancelRef={cancelRef}
                onCancel={requestClose}
                onKeepEditing={() => setConfirmDiscard(false)}
                onDiscard={close}
              />
            </form>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
