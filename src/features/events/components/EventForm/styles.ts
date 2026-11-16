/** Shared control styles, kept out of the component files so Fast Refresh stays intact. */
export const inputClass =
  // text-base below sm: iOS Safari zooms the page when a focused control is
  // under 16px, which shifts the dialog every time a field is tapped.
  'h-9 w-full rounded-sm border border-line bg-canvas px-2.5 text-base text-ink placeholder:text-faint/70 transition-colors focus:border-accent/60 focus:outline-none aria-[invalid=true]:border-rose/60 sm:text-sm'
