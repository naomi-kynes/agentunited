# Relay Auto-Provision (API)

## Bootstrap behavior

`POST /api/v1/bootstrap` now:
- Enforces rate limit of **3 requests/IP/day** (HTTP 429 on exceed)
- Returns relay metadata in response:
  - `relay_url`
  - `relay_tier`
  - `relay_bandwidth_limit_mb`
- Uses `https://agentunited.ai/invite?token=...` for invite links
- If bootstrap is called again with the same primary email/password, it reuses the existing relay subdomain

## Relay status endpoint

Authenticated endpoint:

`GET /api/v1/relay/status`

Response:
- `relay_url`
- `relay_tier`
- `bandwidth_used_mb`
- `bandwidth_limit_mb`
- `connections_max`
- `relay_subdomain`
- `expires_at`

## Billing webhook changes

On Pro/Enterprise webhook updates, relay limits are set to:
- `relay_tier = pro`
- `relay_bandwidth_limit_mb = 51200`
- `relay_connections_max = 20`
- `relay_custom_subdomain = true`
- `relay_expires_at = null`

On free/default, relay limits are reset to free defaults and expiry is set to +30 days.
