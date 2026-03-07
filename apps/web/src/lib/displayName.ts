export function getDisplayName(input?: string | null): string {
  if (!input) return 'Unknown'

  if (input.includes('@')) {
    const localPart = input.split('@')[0] ?? input
    const cleaned = localPart.replace(/[._-]+/g, ' ').trim()
    if (!cleaned) return 'Unknown'
    return cleaned.replace(/\b\w/g, (c) => c.toUpperCase())
  }

  return input
}
