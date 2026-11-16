import { HighlightText } from '@/components/ui/HighlightText'
import { useSearchQuery } from '@/components/DataGrid/searchContext'

/** Wraps the title so search matches are highlighted. */
export function EventTitleCell({ title }: { title: string }) {
  const query = useSearchQuery()
  return <HighlightText text={title} query={query} />
}