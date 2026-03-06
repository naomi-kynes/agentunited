import { getApiBaseUrl } from './apiConfig';

export type TunnelPlanId = 'tunnel_lite' | 'tunnel_pro';

export interface CheckoutSessionResponse {
  checkout_url: string;
}

export interface SubdomainCheckResponse {
  available: boolean;
  reason?: string;
  normalized?: string;
}

export interface PairingStatus {
  code: string;
  expires_at?: string;
  qr_svg?: string;
  pairing_url?: string;
}

function getAuthToken(): string | null {
  return localStorage.getItem('auth-token');
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${await response.text()}`);
  }

  return response.json() as Promise<T>;
}

export const dashboardApi = {
  createTunnelCheckout(plan: TunnelPlanId, subdomain?: string): Promise<CheckoutSessionResponse> {
    return request<CheckoutSessionResponse>('/api/v1/billing/checkout', {
      method: 'POST',
      body: JSON.stringify({
        plan,
        subdomain,
        product: 'tunnel',
      }),
    });
  },

  createBillingPortalSession(): Promise<{ url: string }> {
    return request<{ url: string }>('/api/v1/billing/portal', {
      method: 'POST',
      body: JSON.stringify({ return_path: '/dashboard/tunnel' }),
    });
  },

  checkSubdomainAvailability(rawName: string): Promise<SubdomainCheckResponse> {
    return request<SubdomainCheckResponse>(`/api/v1/tunnel/subdomain/check?name=${encodeURIComponent(rawName)}`);
  },

  saveSubdomainSelection(name: string): Promise<{ subdomain: string }> {
    return request<{ subdomain: string }>('/api/v1/tunnel/subdomain', {
      method: 'POST',
      body: JSON.stringify({ subdomain: name }),
    });
  },

  getPairingStatus(): Promise<PairingStatus> {
    return request<PairingStatus>('/api/v1/pairing/code');
  },

  refreshPairingCode(): Promise<PairingStatus> {
    return request<PairingStatus>('/api/v1/pairing/code');
  },
};
