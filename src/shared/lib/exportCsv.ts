/**
 * Export an array of rows to a CSV file and trigger a download.
 */
export function exportToCsv<TData>(
  rows: readonly TData[],
  columns: readonly { id: string; header: string; accessor: (row: TData) => string }[],
  filename = 'export.csv',
): void {
  const header = columns.map((c) => `"${c.header.replace(/"/g, '""')}"`).join(',')
  const body = rows
    .map((row) =>
      columns
        .map((c) => `"${String(c.accessor(row)).replace(/"/g, '""')}"`)
        .join(','),
    )
    .join('\n')
  const csv = `${header}\n${body}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}