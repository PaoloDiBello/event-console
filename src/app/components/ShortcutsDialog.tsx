import * as Dialog from '@radix-ui/react-dialog'
import { Keyboard, X } from 'lucide-react'
import { Kbd } from '@/components/ui/Kbd'

interface ShortcutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Shortcut {
  keys: string[]
  label: string
}

const GROUPS: { title: string; shortcuts: Shortcut[] }[] = [
  {
    title: 'Anywhere',
    shortcuts: [
      { keys: ['N'], label: 'New event' },
      { keys: ['G'], label: 'Go to the registry' },
      { keys: ['T'], label: 'Go to the agenda' },
      { keys: ['?'], label: 'Show this panel' },
    ],
  },
  {
    title: 'Registry',
    shortcuts: [
      { keys: ['/'], label: 'Focus search' },
      { keys: ['F'], label: 'Focus the first column filter' },
      { keys: ['Esc'], label: 'Clear search, or leave the field' },
    ],
  },
  {
    title: 'Agenda',
    shortcuts: [
      { keys: ['↑', '↓'], label: 'Move between events' },
      { keys: ['←', '→'], label: 'Jump to the previous or next day' },
      { keys: ['Home', 'End'], label: 'First or last event in the window' },
      { keys: ['↵'], label: 'Edit the focused event' },
    ],
  },
]

/**
 * One place to discover every shortcut. The individual hints live next to the
 * controls they describe; this panel is for the ones you would otherwise have
 * to find by accident.
 */
export function ShortcutsDialog({ open, onOpenChange }: ShortcutsDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay fixed inset-0 z-40 bg-black/65 backdrop-blur-[3px]" />
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
          <Dialog.Content
            className="dialog-content pointer-events-auto max-h-[calc(100dvh-2rem)] w-full max-w-[560px] overflow-y-auto rounded-lg border border-line-strong bg-surface shadow-2xl shadow-black/70"
            aria-describedby="shortcuts-description"
          >
            <div className="flex items-start gap-4 border-b border-line px-5 py-4">
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-sm border border-accent/30 bg-accent/10">
                <Keyboard aria-hidden="true" className="size-4 text-accent" />
              </span>
              <div className="min-w-0 flex-1">
                <Dialog.Title className="text-sm font-semibold text-ink">
                  Keyboard shortcuts
                </Dialog.Title>
                <Dialog.Description id="shortcuts-description" className="mt-1 text-xs text-muted">
                  Move through the console without reaching for the mouse. Shortcuts are ignored
                  while a field, menu or dialog has focus.
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close keyboard shortcuts"
                  className="rounded-xs p-1.5 text-faint transition-colors hover:bg-raised hover:text-ink"
                >
                  <X aria-hidden="true" className="size-4" />
                </button>
              </Dialog.Close>
            </div>

            <div className="divide-y divide-line/70 px-5 py-2">
              {GROUPS.map((group) => (
                <section key={group.title} className="py-3 first:pt-2 last:pb-3">
                  <h2 className="font-mono text-[10px] tracking-[0.14em] text-faint uppercase">
                    {group.title}
                  </h2>
                  <dl className="mt-2 space-y-1.5">
                    {group.shortcuts.map((shortcut) => (
                      <div
                        key={shortcut.label}
                        className="flex items-center justify-between gap-4 text-xs"
                      >
                        <dt className="text-muted">{shortcut.label}</dt>
                        <dd className="flex shrink-0 items-center gap-1">
                          {shortcut.keys.map((key) => (
                            <Kbd key={key} className="inline-flex h-5 min-w-5 px-1">
                              {key}
                            </Kbd>
                          ))}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-3 text-[11px] text-faint">
              <Kbd className="inline-flex h-5 min-w-5 px-1">?</Kbd>
              <span>opens this panel</span>
              <span aria-hidden="true" className="text-line-strong">
                ·
              </span>
              <Kbd className="inline-flex h-5 min-w-5 px-1">Esc</Kbd>
              <span>closes it</span>
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
