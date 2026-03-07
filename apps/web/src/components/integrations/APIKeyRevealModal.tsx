import { useState } from 'react'
import { Copy, X } from 'lucide-react'

interface APIKeyRevealModalProps {
  isOpen: boolean
  apiKey: string
  onClose: () => void
}

export function APIKeyRevealModal({ isOpen, apiKey, onClose }: APIKeyRevealModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleCopy = async () => {
    await navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleDone = () => {
    const ok = window.confirm("Have you copied the API key? It can't be recovered.")
    if (ok) onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Integration created</h3>
          <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-muted" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-3 text-sm text-muted-foreground">⚠️ Copy your API key now. It won't be shown again.</p>

        <div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3">
          <code className="flex-1 break-all text-xs">{apiKey}</code>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Copy className="h-3.5 w-3.5" />
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <div className="flex justify-end">
          <button onClick={handleDone} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
