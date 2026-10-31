import { useCallback, useEffect, useState } from 'react'
import type { EventDraft, EventRecord } from '@/features/events/model'
import { useEventStore } from '@/features/events/store'
import { formatDayShort } from '@/shared/lib/dates'

type EditorState = { mode: 'create' } | { mode: 'edit'; event: EventRecord }

/** Stand-in for a network round-trip so the form's saving state is visible. */
function simulateLatency(ms = 380) {
  return new Promise((resolve) => setTimeout(resolve, ms))
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
  const [success, setSuccess] = useState<string | null>(null)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  /** The control that opened the editor, so closing can return focus to it. */
  const [opener, setOpener] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!success) return
    const timer = window.setTimeout(() => setSuccess(null), 6000)
    return () => window.clearTimeout(timer)
  }, [success])

  useEffect(() => {
    if (!highlightedId) return
    const timer = window.setTimeout(() => setHighlightedId(null), 4000)
    return () => window.clearTimeout(timer)
  }, [highlightedId])

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
        setSuccess(`Event “${draft.title}” updated for ${formatDayShort(draft.date)}.`)
        return
      }

      const created = createEvent(draft)
      setHighlightedId(created.id)
      setSuccess(
        `Event “${draft.title}” created for ${formatDayShort(draft.date)} and added to the agenda.`,
      )
    },
    [createEvent, editor, updateEvent],
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
