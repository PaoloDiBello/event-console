import { useCallback, useState } from 'react'
import type { EventDraft, EventRecord } from '@/features/events/model'
import { useEventStore } from '@/features/events/store'
import { useTransientValue } from '@/shared/hooks/useTransientValue'
import { formatDayShort } from '@/shared/lib/dates'

type EditorState = { mode: 'create' } | { mode: 'edit'; event: EventRecord }

type UndoAction =
  | { kind: 'delete'; event: EventRecord; index: number }
  | { kind: 'bulkDelete'; items: { event: EventRecord; index: number }[] }
  | { kind: 'create'; eventId: string }
  | { kind: 'update'; previous: EventRecord }

/** Stand-in for a network round-trip so the form's saving state is visible. */
function simulateLatency(ms = 380) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function saveConfirmation(draft: EventDraft, mode: 'create' | 'edit'): string {
  const day = formatDayShort(draft.date)
  return mode === 'edit'
    ? `Event “${draft.title}” updated for ${day}.`
    : `Event “${draft.title}” created for ${day} and added to the agenda.`
}

/**
 * Owns the editor's ephemeral UI state: which event is open, focus return,
 * success feedback and the row highlight. The store remains the source of
 * truth for the event data itself.
 */
export function useEventEditor() {
  const createEvent = useEventStore((state) => state.createEvent)
  const updateEvent = useEventStore((state) => state.updateEvent)
  const deleteEvent = useEventStore((state) => state.deleteEvent)
  const deleteEvents = useEventStore((state) => state.deleteEvents)
  const restoreEvent = useEventStore((state) => state.restoreEvent)
  const restoreEvents = useEventStore((state) => state.restoreEvents)

  const [editor, setEditor] = useState<EditorState | null>(null)
  // The editor chunk is fetched on first use. Once loaded it stays mounted
  // while closed, so Radix can run its own close/focus-return sequence.
  const [editorMounted, setEditorMounted] = useState(false)
  const [success, setSuccess] = useTransientValue<string>(6000)
  const [highlightedId, setHighlightedId] = useTransientValue<string>(4000)
  /** The control that opened the editor, so closing can return focus to it. */
  const [opener, setOpener] = useState<HTMLElement | null>(null)
  /** What the last action changed, held only for as long as the toast lives. */
  const [undo, setUndo] = useState<UndoAction | null>(null)

  const openEditor = useCallback((state: EditorState) => {
    const active = document.activeElement
    setOpener(active instanceof HTMLElement ? active : null)
    setEditorMounted(true)
    setEditor(state)
  }, [])

  const closeEditor = useCallback(() => {
    setEditor(null)
  }, [])

  const openCreate = useCallback(() => {
    openEditor({ mode: 'create' })
  }, [openEditor])

  const openEdit = useCallback(
    (event: EventRecord) => {
      openEditor({ mode: 'edit', event })
    },
    [openEditor],
  )

  const handleSubmit = useCallback(
    async (draft: EventDraft) => {
      await simulateLatency()

      setUndo(null)

      if (editor?.mode === 'edit') {
        const previous = editor.event
        updateEvent(editor.event.id, draft)
        setHighlightedId(editor.event.id)
        setSuccess(saveConfirmation(draft, 'edit'))
        setUndo({ kind: 'update', previous })
        return
      }

      const created = createEvent(draft)
      setHighlightedId(created.id)
      setSuccess(saveConfirmation(draft, 'create'))
      setUndo({ kind: 'create', eventId: created.id })
    },
    [createEvent, editor, updateEvent, setHighlightedId, setSuccess],
  )

  const handleDelete = useCallback(
    (event: EventRecord) => {
      const removed = deleteEvent(event.id)
      if (!removed) return
      setUndo({ kind: 'delete', event: removed.event, index: removed.index })
      setSuccess(`Event “${event.title}” deleted.`)
    },
    [deleteEvent, setSuccess],
  )

  /**
   * Bulk delete shares the single-delete toast and undo slot, so both paths
   * confirm the same way and the undo affordance never has to live in the page
   * that happened to start the action.
   */
  const handleBulkDelete = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return
      const removed = deleteEvents(ids)
      if (removed.length === 0) return
      setUndo({ kind: 'bulkDelete', items: removed })
      setSuccess(
        removed.length === 1
          ? `Event “${removed[0]!.event.title}” deleted.`
          : `${removed.length} events deleted.`,
      )
    },
    [deleteEvents, setSuccess],
  )

  /**
   * Put the toast away. The undo it carried goes with it: an affordance the
   * user cannot see is worse than no affordance, because a later click would
   * seem to do something unrelated.
   */
  const dismissSuccess = useCallback(() => {
    setSuccess(null)
    setUndo(null)
  }, [setSuccess])

  const undoAction = useCallback(() => {
    if (!undo) return
    if (undo.kind === 'delete') {
      restoreEvent(undo.event, undo.index)
      setHighlightedId(undo.event.id)
      setSuccess(`Event “${undo.event.title}” restored.`)
    } else if (undo.kind === 'bulkDelete') {
      restoreEvents(undo.items)
      const first = undo.items[0]?.event
      // Unlike a single restore, do not jump the grid to the first restored
      // row: a bulk undo is about putting the records back, not about moving
      // the reader away from wherever they were.
      setSuccess(
        undo.items.length === 1
          ? `Event “${first?.title}” restored.`
          : `${undo.items.length} events restored.`,
      )
    } else if (undo.kind === 'create') {
      const removed = deleteEvent(undo.eventId)
      if (removed) {
        setSuccess('Event creation undone.')
      }
    } else if (undo.kind === 'update') {
      const { previous } = undo
      updateEvent(previous.id, {
        title: previous.title,
        date: previous.date,
        startMinute: previous.startMinute,
        durationMin: previous.durationMin,
        category: previous.category,
        status: previous.status,
        priority: previous.priority,
        owner: previous.owner,
        location: previous.location,
        notes: previous.notes,
      })
      setHighlightedId(previous.id)
      setSuccess(`Event “${previous.title}” reverted.`)
    }
    setUndo(null)
  }, [undo, deleteEvent, restoreEvent, restoreEvents, updateEvent, setHighlightedId, setSuccess])

  return {
    editor,
    editorMounted,
    success,
    highlightedId,
    opener,
    openCreate,
    openEdit,
    closeEditor,
    handleSubmit,
    handleDelete,
    handleBulkDelete,
    dismissSuccess,
    /** Undo affordance for the toast, present only after a create, update, or delete. */
    undoAction: undo ? { label: 'Undo', onClick: undoAction } : undefined,
  }
}
