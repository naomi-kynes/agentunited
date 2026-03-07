interface ConnectionBannerProps {
  status: 'connected' | 'reconnecting' | 'disconnected'
  error?: string | null
}

export function ConnectionBanner({ status, error }: ConnectionBannerProps) {
  if (status === 'connected') return null

  const isDisconnected = status === 'disconnected'

  return (
    <div
      className={`sticky top-0 z-20 border-b px-4 py-2 text-sm ${
        isDisconnected
          ? 'border-destructive/25 bg-destructive/10 text-destructive'
          : 'border-amber-400/25 bg-amber-500/10 text-amber-700 dark:text-amber-300'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 font-medium">
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            isDisconnected ? 'bg-destructive' : 'bg-amber-500 animate-pulse'
          }`}
        />
        {isDisconnected ? (error || 'Connection lost. Trying to recover…') : 'Reconnecting…'}
      </div>
    </div>
  )
}
