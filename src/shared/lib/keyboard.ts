/**
 * Elements that own the keyboard. Global single-key shortcuts must never run
 * while one of these is focused, and overlays must not change the view behind
 * the user.
 */
const SHORTCUT_BLOCKERS =
  'input, textarea, select, [contenteditable="true"], [role="dialog"], [role="menu"], [role="listbox"]'

export function isShortcutBlocked(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest(SHORTCUT_BLOCKERS))
}

export function hasCommandModifier(event: KeyboardEvent): boolean {
  return event.metaKey || event.ctrlKey || event.altKey
}
