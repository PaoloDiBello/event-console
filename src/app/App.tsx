import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Navigate, Route, Routes } from 'react-router-dom'
import type { EventDraft, EventRecord } from '@/data/types'
import { formatDayShort } from '@/lib/dates'
import { AppHeader } from '@/app/AppHeader'
import { useEventStore } from '@/store/events'

// Routes and the editor are split out so the initial shell does not download
// the table, the timeline and the form stack before it can paint.
const GridPage = lazy(() =>
  import('@/app/pages/GridPage').then((module) => ({ default: module.GridPage })),
)
const TimelinePage = lazy(() =>
  import('@/app/pages/TimelinePage').then((module) => ({ default: module.TimelinePage })),
)
const EventForm = lazy(() =>
  import('@/components/EventForm').then((module) => ({ default: module.EventForm })),
)

type EditorState = { mode: 'create' } | { mode: 'edit'; event: EventRecord }

function RouteFallback() {
  return (
    <div
      role="status"
      className="flex h-full items-center justify-center rounded-lg border border-line bg-surface/60"
    >
      <Loader2 aria-hidden="true" className="size-4 animate-spin text-faint" />
      <span className="ml-2 text-xs text-muted">Loading view…</span>
    </div>
  )
}

/** Stand-in for a network round-trip so the form's saving state is visible. */
function simulateLatency(ms = 380) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function App() {
  const load = useEventStore((state) => state.load)
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
    void load()
  }, [load])

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

  // "n" opens the create form from anywhere outside a text field.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'n' || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) {
        return
      }
      event.preventDefault()
      openEditor({ mode: 'create' })
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [openEditor])

  async function handleSubmit(draft: EventDraft) {
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
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <AppHeader onNewEvent={openCreate} />

      <main className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col px-3 py-4 sm:px-4">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route
              path="/grid"
              element={<GridPage onEdit={openEdit} highlightedId={highlightedId} />}
            />
            <Route path="/timeline" element={<TimelinePage onEdit={openEdit} />} />
            <Route path="*" element={<Navigate to="/grid" replace />} />
          </Routes>
        </Suspense>
      </main>

      {editorMounted ? (
        <Suspense fallback={null}>
          <EventForm
            open={editor !== null}
            mode={editor?.mode ?? 'create'}
            event={editor?.mode === 'edit' ? editor.event : null}
            returnFocusTo={opener}
            onOpenChange={(open) => {
              if (!open) closeEditor()
            }}
            onSubmit={handleSubmit}
          />
        </Suspense>
      ) : null}

      {/*
       * Success region: always mounted, polite live region. The message appears
       * after the dialog closes, so the user hears confirmation wherever focus
       * was returned to.
       */}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed right-4 bottom-20 z-50 flex justify-end px-1 sm:bottom-24"
      >
        {success ? (
          <div className="pointer-events-auto flex max-w-lg items-center gap-2.5 rounded-md border border-accent/30 bg-[#0b1716] px-4 py-2.5 text-xs text-ink shadow-2xl shadow-black/60">
            <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-accent" />
            {success}
          </div>
        ) : null}
      </div>
    </div>
  )
}
