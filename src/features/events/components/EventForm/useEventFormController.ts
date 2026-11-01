import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { EventDraft, EventRecord } from '@/features/events/model'
import { toEventDraft, toFormValues } from './formValues'
import { eventFormSchema, type EventFormValues } from './schema'

interface UseEventFormControllerOptions {
  open: boolean
  /** Present in edit mode; ignored when creating. */
  event?: EventRecord | null
  onOpenChange: (open: boolean) => void
  /** Resolve to close the dialog; reject to surface a save error inside the form. */
  onSubmit: (draft: EventDraft) => Promise<void> | void
}

/**
 * The form's controller: values, submit lifecycle, discard confirmation and
 * the two focus hand-offs (first invalid field, discard prompt).
 *
 * The view below only lays out markup, which keeps the dialog easy to scan.
 */
export function useEventFormController({
  open,
  event,
  onOpenChange,
  onSubmit,
}: UseEventFormControllerOptions) {
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

  const keepEditing = () => setConfirmDiscard(false)

  const submit = form.handleSubmit(async (values) => {
    setIsSaving(true)
    setSaveError(null)

    const draft = toEventDraft(values)

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

  return {
    form,
    isSaving,
    saveError,
    confirmDiscard,
    keepEditingRef,
    cancelRef,
    close,
    requestClose,
    submit,
    keepEditing,
  }
}
