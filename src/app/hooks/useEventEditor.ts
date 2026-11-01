import { useCallback, useState } from 'react'
import type { EventDraft, EventRecord } from '@/features/events/model'
import { useEventStore } from '@/features/events/store'
import { useTransientValue } from '@/shared/hooks/useTransientValue'
import { formatDayShort } from '@/shared/lib/dates'

type EditorState = { mode: 'create' } | { mode: 'edit'; event: EventRecord }

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

  const [editor, setEditor] = useState<EditorState | null>(null)
  // The editor chunk is fetched on first use. Once loaded it stays mounted
  // while closed, so Radix can run its own close/focus-return sequence.
  const [editorMounted, setEditorMounted] = useState(false)
  const [success, setSuccess] = useTransientValue<string>(6000)
  const [highlightedId, setHighlightedId] = useTransientValue<string>(4000)
  /** The control that opened the editor, so closing can return focus to it. */
  const [opener, setOpener] = useState<HTMLElement | null>(null)

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

      if (editor?.mode === 'edit') {
        updateEvent(editor.event.id, draft)
        setHighlightedId(editor.event.id)
        setSuccess(saveConfirmation(draft, 'edit'))
        return
      }

      const created = createEvent(draft)
      setHighlightedId(created.id)
      setSuccess(saveConfirmation(draft, 'create'))
    },
    [createEvent, editor, updateEvent, setHighlightedId, setSuccess],
  )

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
  }
}
