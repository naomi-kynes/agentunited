import { getApiBaseUrl } from './apiConfig'
import { getAuthToken } from './authService'

export type IntegrationPlatform = 'openclaw' | 'langgraph' | 'autogen' | 'custom'

export interface IntegrationRecord {
  id: string
  name: string
  platform: IntegrationPlatform
  webhook_url: string
  events: string[]
  active: boolean
  last_event_at?: string | null
  created_at?: string
}

interface CreateIntegrationRequest {
  name: string
  platform: IntegrationPlatform
  webhook_url: string
  events: string[]
}

function authHeaders(): HeadersInit {
  const token = getAuthToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers: {
      ...authHeaders(),
      ...options.headers,
    },
  })

  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const data = await response.json()
      message = data.message || data.error || message
    } catch {
      // ignore parsing failure
    }
    throw new Error(message)
  }

  if (response.status === 204) return undefined as T
  return response.json()
}

export const integrationApi = {
  async list(): Promise<IntegrationRecord[]> {
    const res = await apiRequest<{ integrations?: IntegrationRecord[] } | IntegrationRecord[]>('/api/v1/integrations')
    if (Array.isArray(res)) return res
    return res.integrations || []
  },

  async create(payload: CreateIntegrationRequest): Promise<{ integration: IntegrationRecord; api_key?: string }> {
    return apiRequest<{ integration: IntegrationRecord; api_key?: string }>('/api/v1/integrations', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async remove(id: string): Promise<void> {
    await apiRequest<void>(`/api/v1/integrations/${id}`, { method: 'DELETE' })
  },
}
