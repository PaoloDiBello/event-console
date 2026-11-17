import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { EventDraft, EventRecord } from '@/features/events/model'
import { toEventDraft, toFormValues } from './formValues'
import { eventFormSchema, type EventFormValues } from './schema'

interface EventFormControllerOptions {
  open: boolean
  /** Present in edit mode; ignored when creating. */
  event?: EventRecord | null
  onOpenChange: (open: boolean) => void
  /** Resolve to close the dialog; reject to surface a save error inside the form. */
  onSubmit: (draft: EventDraft) => Promise<void> | void
  /** Called with the record once the user confirms deletion. */
  onDelete?: (event: EventRecord) => void
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
  onDelete,
}: EventFormControllerOptions) {
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const keepEditingRef = useRef<HTMLButtonElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const deleteRef = useRef<HTMLButtonElement>(null)
  const cancelDeleteRef = useRef<HTMLButtonElement>(null)
  const wasConfirming = useRef(false)
  const wasConfirmingDelete = useRef(false)

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: toFormValues(event),
    // Validate a field once it is left, so a wrong value is caught while the
    // user is still next to it instead of all at once on submit.
    mode: 'onTouched',
    reValidateMode: 'onChange',
    // The requirement, straight from react-hook-form: on a failed submit, focus
    // moves to the first field whose validation failed.
    shouldFocusError: true,
  })

  const { isDirty } = form.formState
  // `form.clearErrors` is stable, so depending on it keeps the effect below
  // tied to the prompt opening rather than to every render.
  const { clearErrors } = form

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
      // The blur that opened this prompt validates asynchronously; clear once
      // more after it settles so the prompt cannot appear with a field error
      // the user is in the middle of discarding.
      clearErrors()
      keepEditingRef.current?.focus()
    } else if (wasConfirming.current) {
      wasConfirming.current = false
      cancelRef.current?.focus()
    }
  }, [clearErrors, confirmDiscard])

  // Same focus contract as the discard prompt: land on the safe answer, and
  // put focus back on Delete when the prompt is dismissed.
  useEffect(() => {
    if (confirmingDelete) {
      wasConfirmingDelete.current = true
      cancelDeleteRef.current?.focus()
    } else if (wasConfirmingDelete.current) {
      wasConfirmingDelete.current = false
      deleteRef.current?.focus()
    }
  }, [confirmingDelete])

  const close = () => {
    form.reset(toFormValues(event))
    setConfirmDiscard(false)
    setConfirmingDelete(false)
    setSaveError(null)
    onOpenChange(false)
  }

  const requestClose = () => {
    if (isSaving) return
    // Leaving is not submitting. Blur validation fires the moment focus leaves
    // the auto-focused title — which is exactly what clicking the X does — so
    // without this the close path argues about a field the user is abandoning
    // anyway. Anything still wrong is reported again on the next change or on
    // submit.
    form.clearErrors()
    // Escape or Cancel while either prompt is up means "back to the form".
    if (confirmingDelete) {
      setConfirmingDelete(false)
      return
    }
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

  const requestDelete = () => {
    if (isSaving || !event) return
    setConfirmDiscard(false)
    setConfirmingDelete(true)
  }

  const confirmDelete = () => {
    if (!event) return
    const target = event
    setConfirmingDelete(false)
    close()
    onDelete?.(target)
  }

  const submit = form.handleSubmit(async (values) => {
    setIsSaving(true)
    setSaveError(null)

    const draft = toEventDraft(values)

    try {
      await onSubmit(draft)
      // Close directly: the save succeeded, so there is no dirty state to
      // protect and no need to re-enter the discard prompt. `close` also
      // clears the transient prompts and the save-error region.
      close()
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
    confirmingDelete,
    keepEditingRef,
    cancelRef,
    deleteRef,
    cancelDeleteRef,
    close,
    requestClose,
    submit,
    keepEditing,
    requestDelete,
    cancelDelete: () => setConfirmingDelete(false),
    confirmDelete,
  }
}
