import { getApiBaseUrl } from './apiConfig'
import { getAuthToken } from './authService'

export interface MeProfile {
  id?: string
  email?: string
  display_name?: string
  avatar_url?: string
  created_at?: string
}

function getAuthHeaders(): HeadersInit {
  const token = getAuthToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  })

  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const data = await res.json()
      message = data.message || data.error || message
    } catch {
      // ignore parse error
    }
    throw new Error(message)
  }

  return res.json()
}

function normalizeMeResponse(res: unknown): MeProfile {
  if (typeof res === 'object' && res !== null && 'user' in res) {
    const nested = (res as { user?: MeProfile }).user
    return nested ?? {}
  }

  return (res as MeProfile) ?? {}
}

export const userApi = {
  async getMe(): Promise<MeProfile> {
    const res = await request<unknown>('/api/v1/me')
    return normalizeMeResponse(res)
  },

  async updateMe(payload: { display_name?: string; avatar_url?: string }): Promise<MeProfile> {
    const res = await request<unknown>('/api/v1/me', {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    return normalizeMeResponse(res)
  },

  async updatePassword(payload: { current_password: string; new_password: string }): Promise<void> {
    await request('/api/v1/me/password', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
}
