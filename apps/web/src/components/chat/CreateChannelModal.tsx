import { useState, useRef, useEffect, useMemo } from 'react'
import { Check, Hash, Plus, X } from 'lucide-react'
import { Avatar } from '../ui/Avatar'
import { chatApi } from '../../services/chatApi'

interface AgentOption {
  id: string
  name: string
  display_name?: string
  email?: string
}

interface CreateChannelModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (name: string, description: string, selectedAgentIds: string[]) => Promise<void>
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function CreateChannelModal({ isOpen, onClose, onSubmit }: CreateChannelModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [search, setSearch] = useState('')
  const [selectedAgents, setSelectedAgents] = useState<AgentOption[]>([])
  const [agents, setAgents] = useState<AgentOption[]>([])
  const [agentsLoading, setAgentsLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const slug = useMemo(() => slugify(name), [name])

  const filteredAgents = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return agents
    return agents.filter((agent) => {
      const haystack = `${agent.display_name || ''} ${agent.name || ''} ${agent.email || ''}`.toLowerCase()
      return haystack.includes(query)
    })
  }, [search, agents])

  useEffect(() => {
    if (!isOpen) return

    setName('')
    setDescription('')
    setSearch('')
    setSelectedAgents([])
    setError(null)
    setTimeout(() => inputRef.current?.focus(), 100)

    const loadAgents = async () => {
      try {
        setAgentsLoading(true)
        const fetched = await chatApi.getAgents()
        setAgents(fetched)
      } catch (err) {
        console.error('Failed to load agents:', err)
        setAgents([])
      } finally {
        setAgentsLoading(false)
      }
    }

    void loadAgents()
  }, [isOpen])

  if (!isOpen) return null

  const isSelected = (id: string) => selectedAgents.some((a) => a.id === id)

  const toggleAgent = (agent: AgentOption) => {
    if (isSelected(agent.id)) {
      setSelectedAgents((prev) => prev.filter((a) => a.id !== agent.id))
    } else {
      setSelectedAgents((prev) => [...prev, agent])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!slug || slug.length < 2 || slug.length > 80) {
      setError('Channel name must be 2–80 chars and use lowercase letters, numbers, and hyphens.')
      return
    }

    setCreating(true)
    setError(null)
    try {
      await onSubmit(slug, description.trim(), selectedAgents.map((a) => a.id))
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create channel')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose}>
      <div className="flex min-h-full items-center justify-center p-0 sm:p-4" onClick={(e) => e.stopPropagation()}>
        <div className="h-full w-full overflow-y-auto border-border bg-background p-6 sm:h-auto sm:max-h-[90vh] sm:max-w-xl sm:rounded-xl sm:border sm:shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Create a channel</h2>
            <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-muted" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Name</label>
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2">
                <Hash className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  ref={inputRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. mission-alpha"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  maxLength={80}
                  disabled={creating}
                />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground"># {slug || 'channel-name'} · lowercase, hyphens only</p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Description <span className="font-normal text-muted-foreground">(optional)</span></label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this channel for?"
                className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
                maxLength={255}
                disabled={creating}
              />
            </div>

            <div className="pt-1">
              <h3 className="mb-2 text-sm font-medium text-foreground">Invite agents <span className="font-normal text-muted-foreground">(optional)</span></h3>

              {agentsLoading ? (
                <div className="space-y-2">
                  <div className="h-9 animate-pulse rounded-md bg-muted" />
                  <div className="h-9 animate-pulse rounded-md bg-muted" />
                </div>
              ) : agents.length === 0 ? (
                <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  No agents yet. Create an agent first to invite them here.
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search agents…"
                    className="mb-2 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
                    disabled={creating}
                  />

                  <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-border p-1">
                    {filteredAgents.map((agent) => {
                      const selected = isSelected(agent.id)
                      return (
                        <button
                          type="button"
                          key={agent.id}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-slate-50 dark:hover:bg-white/5"
                          onClick={() => toggleAgent(agent)}
                          disabled={creating}
                        >
                          <Avatar name={agent.display_name || agent.name} type="agent" className="h-6 w-6 text-xs" />
                          <span className="flex-1 text-sm text-foreground">{agent.display_name || agent.name}</span>
                          <span className="text-xs text-muted-foreground">{agent.name}</span>
                          {selected ? <Check className="h-4 w-4 text-emerald-500" /> : <Plus className="h-4 w-4 text-muted-foreground" />}
                        </button>
                      )
                    })}
                  </div>

                  {selectedAgents.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {selectedAgents.map((agent) => (
                        <span key={agent.id} className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                          {agent.display_name || agent.name}
                          <button
                            type="button"
                            onClick={() => toggleAgent(agent)}
                            className="text-emerald-500 hover:text-emerald-700"
                            aria-label={`Remove ${agent.display_name || agent.name}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:bg-muted" disabled={creating}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating || slug.length < 2}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {creating ? 'Creating…' : 'Create channel'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
