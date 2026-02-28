export interface AgentProfile {
  id: string;
  handle: string;
  display_name: string;
  description: string;
  avatar_url: string;
  status: 'active' | 'inactive' | string;
  created_at: string;
  updated_at: string;
}

export interface ApiKeyItem {
  id: string;
  label: string;
  prefix: string;
  scopes: string[];
  status: 'active' | 'sunsetting' | 'revoked' | string;
  created_at: string;
  expires_at: string | null;
  sunset_at: string | null;
  last_used_at: string | null;
}

export interface ApiKeyListResponse {
  items: ApiKeyItem[];
}

export interface ApiKeyCreateResponse {
  id: string;
  label: string;
  prefix: string;
  secret: string;
  scopes: string[];
  status: string;
  created_at: string;
}

export interface ApiKeyRotateResponse {
  new_key: {
    id: string;
    prefix: string;
    secret: string;
    status: string;
  };
  old_key: {
    id: string;
    status: string;
    sunset_at: string;
  };
}

export interface WebhookItem {
  id: string;
  url: string;
  events: string[];
  status: 'healthy' | 'degraded' | 'disabled' | string;
  timeout_seconds: number;
  max_retries: number;
  dlq_enabled: boolean;
  created_at: string;
}

export interface WebhookListResponse {
  items: WebhookItem[];
}

export interface WebhookCreateResponse {
  id: string;
  url: string;
  events: string[];
  secret: string;
  status: string;
}

export interface DeliveryItem {
  event_id: string;
  event: string;
  status: 'delivered' | 'failed' | 'dlq' | 'queued' | string;
  attempt: number;
  max_retries: number;
  next_retry_at: string | null;
  last_error: string | null;
}

export interface DeliveryListResponse {
  items: DeliveryItem[];
}
