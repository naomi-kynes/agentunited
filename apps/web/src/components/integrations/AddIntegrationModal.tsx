import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import type { IntegrationPlatform } from '../../services/integrationApi'

interface AddIntegrationModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (payload: {
    name: string
    platform: IntegrationPlatform
    webhook_url: string
    events: string[]
  }) => Promise<void>
}

const EVENT_OPTIONS = [
  { id: 'message.created', label: 'message.created' },
  { id: 'channel.created', label: 'channel.created' },
  { id: 'member.joined', label: 'member.joined' },
  { id: 'agent.connected', label: 'agent.connected' },
] as const

export function AddIntegrationModal({ isOpen, onClose, onSubmit }: AddIntegrationModalProps) {
  const [name, setName] = useState('')
  const [platform, setPlatform] = useState<IntegrationPlatform>('openclaw')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [events, setEvents] = useState<string[]>(['message.created'])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(() => {
    return name.trim().length > 1 && webhookUrl.trim().startsWith('http') && events.length > 0
  }, [name, webhookUrl, events])

  if (!isOpen) return null

  const toggleEvent = (event: string) => {
    setEvents((prev) => (prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await onSubmit({
        name: name.trim(),
        platform,
        webhook_url: webhookUrl.trim(),
        events,
      })
      setName('')
      setPlatform('openclaw')
      setWebhookUrl('')
      setEvents(['message.created'])
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create integration')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose}>
      <div className="flex min-h-full items-center justify-center p-0 sm:p-4" onClick={(e) => e.stopPropagation()}>
        <div className="h-full w-full overflow-y-auto border-border bg-background p-6 sm:h-auto sm:max-h-[90vh] sm:max-w-xl sm:rounded-xl sm:border sm:shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Add integration</h2>
            <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-muted" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>

          {error && <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                placeholder="My OpenClaw Instance"
                disabled={loading}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as IntegrationPlatform)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                disabled={loading}
              >
                <option value="openclaw">OpenClaw</option>
                <option value="langgraph">LangGraph</option>
                <option value="autogen">AutoGen</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Webhook URL</label>
              <input
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                placeholder="https://example.com/webhooks/agent-united"
                disabled={loading}
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-foreground">Events to subscribe</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {EVENT_OPTIONS.map((event) => (
                  <label key={event.id} className="flex items-center gap-2 rounded-md border border-border px-2.5 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={events.includes(event.id)}
                      onChange={() => toggleEvent(event.id)}
                      disabled={loading}
                    />
                    <span>{event.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:bg-muted" disabled={loading}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit || loading}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? 'Creating…' : 'Create integration'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
