const numberFormatter = new Intl.NumberFormat('en-GB')

export function formatCount(value: number): string {
  return numberFormatter.format(value)
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? singular : plural
}
