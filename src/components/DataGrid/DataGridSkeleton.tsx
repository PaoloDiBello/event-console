import type { Column } from '@tanstack/react-table'

interface DataGridSkeletonProps<TData> {
  columns: readonly Column<TData, unknown>[]
  rowHeight: number
  rowCount?: number
}

export function DataGridSkeleton<TData>({
  columns,
  rowHeight,
  rowCount = 10,
}: DataGridSkeletonProps<TData>) {
  return (
    <>
      {Array.from({ length: rowCount }, (_, rowIndex) => (
        <tr key={`skeleton-${rowIndex}`} style={{ height: rowHeight }}>
          {columns.map((column, columnIndex) => (
            <td key={column.id} className="border-b border-line/60 px-3">
              <div
                className="h-2.5 animate-pulse rounded-full bg-line/80"
                style={{ width: `${45 + ((rowIndex * 13 + columnIndex * 29) % 45)}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
