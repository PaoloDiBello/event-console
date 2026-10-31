import { Loader2 } from 'lucide-react'

export function AgendaSkeleton() {
  return (
    <div className="flex h-full flex-col gap-2 rounded-lg border border-line bg-surface/60 p-4">
      <p className="mb-1 inline-flex items-center gap-2 font-mono text-[10px] tracking-widest text-faint uppercase">
        <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
        Loading agenda
      </p>
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="h-16 animate-pulse rounded-md border border-line/70 bg-raised/60"
          style={{ opacity: 1 - index * 0.12 }}
        />
      ))}
    </div>
  )
}
