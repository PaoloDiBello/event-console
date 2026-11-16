import { cn } from '@/shared/lib/cn'

interface HighlightTextProps {
  text: string
  query: string
  className?: string
}

/**
 * Wraps substrings matching `query` in a `<mark>` so search results are
 * visually locatable inside dense cells. Case-insensitive; returns the plain
 * text when there is no query or no match.
 */
export function HighlightText({ text, query, className }: HighlightTextProps) {
  const trimmed = query.trim()
  if (!trimmed) return <>{text}</>

  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
  const lowerQuery = trimmed.toLowerCase()

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === lowerQuery ? (
          <mark
            key={index}
            className={cn('rounded-[2px] bg-accent/25 px-0.5 text-ink', className)}
          >
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  )
}