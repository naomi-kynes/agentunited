import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, Plus, Plug } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { AddIntegrationModal } from '../components/integrations/AddIntegrationModal'
import { APIKeyRevealModal } from '../components/integrations/APIKeyRevealModal'
import { integrationApi, type IntegrationRecord } from '../services/integrationApi'

function statusLabel(record: IntegrationRecord): { dot: string; text: string } {
  if (!record.active) return { dot: 'bg-slate-400', text: 'Inactive' }
  if (!record.last_event_at) return { dot: 'bg-emerald-500', text: 'No events received yet' }
  return { dot: 'bg-emerald-500', text: `Last event: ${new Date(record.last_event_at).toLocaleString()}` }
}

export function IntegrationSettingsPage() {
  const [integrations, setIntegrations] = useState<IntegrationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [revealedApiKey, setRevealedApiKey] = useState<string>('')

  const hasIntegrations = useMemo(() => integrations.length > 0, [integrations.length])

  const loadIntegrations = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await integrationApi.list()
      setIntegrations(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load integrations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadIntegrations()
  }, [])

  const handleCreate = async (payload: {
    name: string
    platform: 'openclaw' | 'langgraph' | 'autogen' | 'custom'
    webhook_url: string
    events: string[]
  }) => {
    const result = await integrationApi.create(payload)
    setIntegrations((prev) => [result.integration, ...prev])
    if (result.api_key) {
      setRevealedApiKey(result.api_key)
    }
  }

  const handleDelete = async (id: string) => {
    const ok = window.confirm('Revoke this integration? This cannot be undone.')
    if (!ok) return

    await integrationApi.remove(id)
    setIntegrations((prev) => prev.filter((item) => item.id !== id))
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <Link to="/chat" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ChevronLeft className="h-4 w-4" />
        Back to chat
      </Link>

      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Integrations</h1>
          <p className="mt-1 text-sm text-muted-foreground">Connect external platforms and agent frameworks.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-20 animate-pulse rounded-lg border border-border bg-card" />
          <div className="h-20 animate-pulse rounded-lg border border-border bg-card" />
        </div>
      ) : error ? (
        <Card>
          <p className="text-sm text-destructive">{error}</p>
          <button onClick={loadIntegrations} className="mt-3 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Retry</button>
        </Card>
      ) : !hasIntegrations ? (
        <Card className="py-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/35 bg-emerald-500/10">
            <Plug className="h-5 w-5 text-emerald-600" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">No integrations yet</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Connect OpenClaw, LangGraph, AutoGen, or any custom platform to route events automatically.
          </p>
          <button onClick={() => setShowAddModal(true)} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Add integration
          </button>
        </Card>
      ) : (
        <div className="space-y-3">
          {integrations.map((integration) => {
            const status = statusLabel(integration)
            return (
              <Card key={integration.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-foreground">{integration.name}</h3>
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                        {integration.platform}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Webhook: {integration.webhook_url}</p>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className={`inline-block h-2 w-2 rounded-full ${status.dot}`} />
                      {status.text}
                    </div>
                  </div>

                  <button
                    onClick={() => void handleDelete(integration.id)}
                    className="rounded-md border border-destructive/30 px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                  >
                    Revoke
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <AddIntegrationModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreate}
      />

      <APIKeyRevealModal
        isOpen={Boolean(revealedApiKey)}
        apiKey={revealedApiKey}
        onClose={() => setRevealedApiKey('')}
      />
    </div>
  )
}
