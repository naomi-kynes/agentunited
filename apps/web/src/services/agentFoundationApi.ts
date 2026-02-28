import type {
  AgentProfile,
  ApiKeyCreateResponse,
  ApiKeyListResponse,
  ApiKeyRotateResponse,
  DeliveryListResponse,
  WebhookCreateResponse,
  WebhookListResponse,
} from '../types/agentFoundation';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://api.agentunited.ai';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth-token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const err = (await response.json()) as { message?: string; error?: string };
      message = err.message ?? err.error ?? message;
    } catch {
      // keep default
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export const agentFoundationApi = {
  getAgent: (agentId: string) => request<AgentProfile>(`/v1/agents/${agentId}`),

  updateAgent: (agentId: string, payload: Partial<Pick<AgentProfile, 'display_name' | 'description' | 'avatar_url'>>) =>
    request<AgentProfile>(`/v1/agents/${agentId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  getApiKeys: (agentId: string) => request<ApiKeyListResponse>(`/v1/agents/${agentId}/api-keys`),

  createApiKey: (agentId: string, payload: { label: string; scopes: string[]; expires_at: string | null }) =>
    request<ApiKeyCreateResponse>(`/v1/agents/${agentId}/api-keys`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  rotateApiKey: (agentId: string, keyId: string, overlap_seconds: number) =>
    request<ApiKeyRotateResponse>(`/v1/agents/${agentId}/api-keys/${keyId}/rotate`, {
      method: 'POST',
      body: JSON.stringify({ overlap_seconds }),
    }),

  revokeApiKey: (agentId: string, keyId: string, reason: string) =>
    request<{ id: string; status: string; revoked_at: string }>(`/v1/agents/${agentId}/api-keys/${keyId}/revoke`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  getWebhooks: (agentId: string) => request<WebhookListResponse>(`/v1/agents/${agentId}/webhooks`),

  createWebhook: (
    agentId: string,
    payload: {
      url: string;
      events: string[];
      timeout_seconds: number;
      max_retries: number;
      dlq_enabled: boolean;
    },
  ) =>
    request<WebhookCreateResponse>(`/v1/agents/${agentId}/webhooks`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  regenerateWebhookSecret: (agentId: string, webhookId: string) =>
    request<{ webhook_id: string; secret: string; rotated_at: string }>(
      `/v1/agents/${agentId}/webhooks/${webhookId}/secret/regenerate`,
      { method: 'POST' },
    ),

  getDeliveries: (agentId: string, webhookId: string, limit = 20) =>
    request<DeliveryListResponse>(`/v1/agents/${agentId}/webhooks/${webhookId}/deliveries?limit=${limit}`),

  retryDelivery: (agentId: string, webhookId: string, eventId: string) =>
    request<{ event_id: string; status: string }>(
      `/v1/agents/${agentId}/webhooks/${webhookId}/deliveries/${eventId}/retry`,
      { method: 'POST' },
    ),

  replayDlq: (agentId: string, webhookId: string, eventId: string) =>
    request<{ event_id: string; status: string }>(
      `/v1/agents/${agentId}/webhooks/${webhookId}/deliveries/${eventId}/replay-dlq`,
      { method: 'POST' },
    ),
};
