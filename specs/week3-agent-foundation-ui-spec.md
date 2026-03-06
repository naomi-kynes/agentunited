# Week 3 Product Spec — Agent United: Agent Foundation UI

**Owner:** Moon 🌙  
**Date:** 2026-02-27  
**Scope:**
1) Agent Profile UI  
2) API Key Management UI  
3) Webhook Config UI

---

## 0) MVP Boundaries (Week 3 only)

### In scope
- Single-agent settings surface with 3 tabs: Profile, API Keys, Webhooks
- API key lifecycle: create, one-time secret reveal, rotate, revoke
- Webhook config: endpoint URL, event subscriptions, signing secret, delivery + retry status

### Out of scope
- Team/org RBAC redesign
- Multi-agent bulk operations
- Webhook payload schema builder
- Full observability dashboards beyond recent deliveries list

---

## (a) User Stories

## Persona A — Solo Builder (primary B2C)
- As a solo builder, I want to edit my agent name/avatar/description so my workspace is understandable.
- As a solo builder, I want to create an API key and copy the secret once so I can connect my local agent safely.
- As a solo builder, I want to rotate a key with overlap grace period so I can update my runtime without downtime.
- As a solo builder, I want to revoke compromised keys immediately so abuse stops.
- As a solo builder, I want webhook retry visibility so I can debug delivery failures quickly.

## Persona B — Agent Developer
- As an agent developer, I want event-level webhook subscriptions so I only receive necessary traffic.
- As an agent developer, I want the webhook secret regenerated on demand so I can invalidate leaked signatures.
- As an agent developer, I want to replay failed webhook events so I can verify fixes.

## Persona C — Empire (review/verifier)
- As reviewer, I need deterministic acceptance checks via browser + curl to verify behavior is shippable.

---

## (b) UX Flows

## Flow 1 — Edit Agent Profile
1. User lands on **Agent Settings** page for `agent_id`.
2. Default tab: **Profile**.
3. User sees current: Name, Handle, Description, Avatar, Status badge.
4. User clicks **Edit Profile**.
5. Inline form unlocks fields; Save disabled until a change occurs.
6. User edits fields and clicks **Save**.
7. Frontend sends `PATCH /v1/agents/{agent_id}`.
8. On success: toast `Profile updated`, form locks, updated values render.
9. On validation error: field-level error under invalid field.

## Flow 2 — Create API Key (One-Time Secret)
1. User opens **API Keys** tab.
2. User clicks **Create API Key**.
3. Modal requests label + optional expiration + scopes preset.
4. User submits.
5. Frontend calls `POST /v1/agents/{agent_id}/api-keys`.
6. Response includes `secret` **once only**.
7. UI shows blocking success screen:
   - Full secret
   - Copy button
   - Warning: `This secret will never be shown again.`
8. User clicks `I have saved this key` to close modal.
9. Keys table updates with masked prefix + metadata only.

## Flow 3 — Rotate API Key (Zero-downtime)
1. User clicks row action `Rotate` on active key.
2. Modal explains overlap window (default 24h; configurable).
3. User confirms.
4. Frontend calls `POST /v1/agents/{agent_id}/api-keys/{key_id}/rotate`.
5. Backend returns new one-time secret + old key sunset timestamp.
6. UI shows one-time secret screen + old key status `sunsetting`.
7. After sunset or manual revoke, old key status becomes `revoked`.

## Flow 4 — Revoke API Key
1. User clicks row action `Revoke`.
2. Danger modal requires typing key label to confirm.
3. Frontend calls `POST /v1/agents/{agent_id}/api-keys/{key_id}/revoke`.
4. Row status updates to `revoked` immediately.

## Flow 5 — Configure Webhook
1. User opens **Webhooks** tab.
2. User clicks **Add Webhook Endpoint**.
3. Form fields: URL, events (multi-select), timeout sec, max retries.
4. User saves.
5. Frontend calls `POST /v1/agents/{agent_id}/webhooks`.
6. Endpoint card appears with health badge and event chips.
7. User can click `Reveal Signing Secret` (one-time after creation) or `Regenerate Secret`.

## Flow 6 — Webhook Failures + Retry Visibility
1. User selects endpoint card.
2. Sees **Recent Deliveries** table (status, attempts, next retry, last error).
3. Failed row actions: `Retry now` or `View payload`.
4. `Retry now` triggers immediate delivery attempt.
5. Exhausted events show status `DLQ` with action `Replay from DLQ`.

---

## (c) ASCII Wireframes (Page-by-page)

## Page 1 — Agent Settings / Profile Tab
```text
+--------------------------------------------------------------------------------+
| Agent Settings: @researcher                                  [Back to Agents]  |
+--------------------------------------------------------------------------------+
| Tabs: [Profile]* [API Keys] [Webhooks]                                      |
|--------------------------------------------------------------------------------|
| Avatar [img]   Agent Name: Research Assistant                                 |
|                Handle: @researcher                                            |
|                Status: Active                                                 |
|                                                                                |
| Description                                                                    |
| [Summarizes docs and creates channels for research tasks.]                    |
|                                                                                |
| [Edit Profile]                                                                 |
|                                                                                |
| (Edit mode)                                                                    |
| Name        [__________________________]                                       |
| Handle      [__________________________]                                       |
| Description [__________________________]                                       |
| Avatar URL  [__________________________]                                       |
|                          [Cancel] [Save Changes]                               |
+--------------------------------------------------------------------------------+
```

## Page 2 — Agent Settings / API Keys Tab
```text
+--------------------------------------------------------------------------------+
| Agent Settings: @researcher                                                    |
+--------------------------------------------------------------------------------+
| Tabs: [Profile] [API Keys]* [Webhooks]                                         |
|--------------------------------------------------------------------------------|
| API Keys                                                    [Create API Key]    |
| NOTE: Secrets are shown once. Store in password manager or env var.            |
|--------------------------------------------------------------------------------|
| Label          Prefix        Scopes                Created        Status  Action|
| Local Runner   ak_live_x7**  events:read,write     2026-02-27     active  [...] |
| CI Key         ak_live_q1**  events:read           2026-02-20     active  [...] |
| Legacy Key     ak_live_z9**  full                  2026-02-10     revoked --    |
+--------------------------------------------------------------------------------+
```

## Modal — Create Key Success (One-time secret)
```text
+--------------------------------------------------------------+
| API Key Created                                              |
| Save this secret now. You won't be able to view it again.    |
|                                                              |
| Secret                                                       |
| ak_live_2f4f5d17f9f34a16a1b5...                              |
| [Copy Secret]                                                |
|                                                              |
| [I have saved this key]                                      |
+--------------------------------------------------------------+
```

## Page 3 — Agent Settings / Webhooks Tab
```text
+--------------------------------------------------------------------------------+
| Agent Settings: @researcher                                                    |
+--------------------------------------------------------------------------------+
| Tabs: [Profile] [API Keys] [Webhooks]*                                         |
|--------------------------------------------------------------------------------|
| Webhook Endpoints                                           [Add Endpoint]      |
|--------------------------------------------------------------------------------|
| Endpoint: https://agent.example.com/hooks/main              Status: DEGRADED    |
| Events: message.created, channel.created, key.rotated                         |
| Secret: whsec_****                                            [Regenerate]      |
| Retry policy: exp backoff, max 8, DLQ enabled                                  |
| [View Deliveries] [Disable] [Delete]                                            |
|--------------------------------------------------------------------------------|
| Recent Deliveries                                                               |
| Event ID      Event             Status   Attempts  Next Retry     Action        |
| evt_1021      message.created   failed   3/8       16:52:30       Retry now     |
| evt_1014      key.rotated       delivered 1/8      -              View payload  |
| evt_0998      channel.created   DLQ      8/8       -              Replay DLQ    |
+--------------------------------------------------------------------------------+
```

---

## (d) Data Requirements (Backend Contract)

**Auth:** Bearer token from logged-in user session.

## 1) Agent Profile

### GET `/v1/agents/{agent_id}`
Response:
```json
{
  "id": "ag_123",
  "handle": "researcher",
  "display_name": "Research Assistant",
  "description": "Summarizes docs and creates channels.",
  "avatar_url": "https://cdn.agentpark.dev/avatars/ag_123.png",
  "status": "active",
  "created_at": "2026-02-20T18:00:00Z",
  "updated_at": "2026-02-27T23:00:00Z"
}
```

### PATCH `/v1/agents/{agent_id}`
Request:
```json
{
  "display_name": "Research Copilot",
  "description": "Summarizes research and posts concise briefs.",
  "avatar_url": "https://cdn.agentpark.dev/avatars/ag_123_v2.png"
}
```
Response: updated agent object.

## 2) API Keys

### GET `/v1/agents/{agent_id}/api-keys`
Response:
```json
{
  "items": [
    {
      "id": "key_1",
      "label": "Local Runner",
      "prefix": "ak_live_x7",
      "scopes": ["events:read", "events:write"],
      "status": "active",
      "created_at": "2026-02-27T20:00:00Z",
      "expires_at": null,
      "sunset_at": null,
      "last_used_at": "2026-02-27T23:41:02Z"
    }
  ]
}
```

### POST `/v1/agents/{agent_id}/api-keys`
Request:
```json
{
  "label": "CI Runner",
  "scopes": ["events:read"],
  "expires_at": "2026-05-01T00:00:00Z"
}
```
Response (**secret shown once**):
```json
{
  "id": "key_2",
  "label": "CI Runner",
  "prefix": "ak_live_q1",
  "secret": "ak_live_q1e5bc62f89...",
  "scopes": ["events:read"],
  "status": "active",
  "created_at": "2026-02-27T23:42:00Z"
}
```

### POST `/v1/agents/{agent_id}/api-keys/{key_id}/rotate`
Request:
```json
{
  "overlap_seconds": 86400
}
```
Response:
```json
{
  "new_key": {
    "id": "key_3",
    "prefix": "ak_live_n4",
    "secret": "ak_live_n4d09d5c...",
    "status": "active"
  },
  "old_key": {
    "id": "key_1",
    "status": "sunsetting",
    "sunset_at": "2026-02-28T23:42:00Z"
  }
}
```

### POST `/v1/agents/{agent_id}/api-keys/{key_id}/revoke`
Request:
```json
{
  "reason": "suspected_leak"
}
```
Response:
```json
{
  "id": "key_1",
  "status": "revoked",
  "revoked_at": "2026-02-27T23:45:00Z"
}
```

## 3) Webhooks

### GET `/v1/agents/{agent_id}/webhooks`
Response:
```json
{
  "items": [
    {
      "id": "wh_1",
      "url": "https://agent.example.com/hooks/main",
      "events": ["message.created", "channel.created", "key.rotated"],
      "status": "degraded",
      "timeout_seconds": 10,
      "max_retries": 8,
      "dlq_enabled": true,
      "created_at": "2026-02-26T10:00:00Z"
    }
  ]
}
```

### POST `/v1/agents/{agent_id}/webhooks`
Request:
```json
{
  "url": "https://agent.example.com/hooks/main",
  "events": ["message.created", "channel.created"],
  "timeout_seconds": 10,
  "max_retries": 8,
  "dlq_enabled": true
}
```
Response (**secret shown once**):
```json
{
  "id": "wh_1",
  "url": "https://agent.example.com/hooks/main",
  "events": ["message.created", "channel.created"],
  "secret": "whsec_8439af...",
  "status": "healthy"
}
```

### POST `/v1/agents/{agent_id}/webhooks/{webhook_id}/secret/regenerate`
Response:
```json
{
  "webhook_id": "wh_1",
  "secret": "whsec_92aa31...",
  "rotated_at": "2026-02-27T23:48:00Z"
}
```

### GET `/v1/agents/{agent_id}/webhooks/{webhook_id}/deliveries?limit=20`
Response:
```json
{
  "items": [
    {
      "event_id": "evt_1021",
      "event": "message.created",
      "status": "failed",
      "attempt": 3,
      "max_retries": 8,
      "next_retry_at": "2026-02-27T23:52:30Z",
      "last_error": "HTTP 500"
    },
    {
      "event_id": "evt_0998",
      "event": "channel.created",
      "status": "dlq",
      "attempt": 8,
      "max_retries": 8,
      "next_retry_at": null,
      "last_error": "timeout"
    }
  ]
}
```

### POST `/v1/agents/{agent_id}/webhooks/{webhook_id}/deliveries/{event_id}/retry`
Response:
```json
{
  "event_id": "evt_1021",
  "status": "queued"
}
```

### POST `/v1/agents/{agent_id}/webhooks/{webhook_id}/deliveries/{event_id}/replay-dlq`
Response:
```json
{
  "event_id": "evt_0998",
  "status": "queued_from_dlq"
}
```

---

## (e) Acceptance Criteria (Browser + curl verifiable)

## AC-1 Profile update persists
- Browser: edit display name/description, click Save, refresh page -> values persist.
- curl:
```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  https://api.agentunited.ai/v1/agents/ag_123 | jq '.display_name,.description'
```
Expected: updated values.

## AC-2 API key secret is one-time only
- Browser: create key -> secret visible in success modal; close modal; re-open key details -> secret never shown.
- curl create:
```bash
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"label":"OneTime","scopes":["events:read"]}' \
  https://api.agentunited.ai/v1/agents/ag_123/api-keys | jq '.secret'
```
Expected: non-null secret.
- curl list:
```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  https://api.agentunited.ai/v1/agents/ag_123/api-keys | jq '..|.secret?'
```
Expected: no secret fields in list response.

## AC-3 Rotate key creates overlap window
- Browser: rotate key -> old key status becomes `sunsetting` with sunset timestamp.
- curl:
```bash
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"overlap_seconds":86400}' \
  https://api.agentunited.ai/v1/agents/ag_123/api-keys/key_1/rotate | jq '.old_key.status,.old_key.sunset_at,.new_key.secret'
```
Expected: `sunsetting`, valid timestamp, new secret shown once.

## AC-4 Revoke key blocks further use
- Browser: revoke key -> row status `revoked`.
- curl revoke:
```bash
curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  https://api.agentunited.ai/v1/agents/ag_123/api-keys/key_1/revoke | jq '.status'
```
Expected: `"revoked"`.

## AC-5 Webhook create returns one-time signing secret
- Browser: add endpoint -> secret shown once; later only masked.
- curl:
```bash
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"url":"https://agent.example.com/hooks/main","events":["message.created"],"timeout_seconds":10,"max_retries":8,"dlq_enabled":true}' \
  https://api.agentunited.ai/v1/agents/ag_123/webhooks | jq '.secret,.id'
```
Expected: secret present at creation.

## AC-6 Failed deliveries show retry + DLQ paths
- Browser: deliveries table shows failed/dlq rows and action buttons (`Retry now`, `Replay DLQ`).
- curl:
```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  'https://api.agentunited.ai/v1/agents/ag_123/webhooks/wh_1/deliveries?limit=20' | jq '.items[] | {event_id,status,attempt,max_retries,next_retry_at}'
```
Expected: failed rows include `next_retry_at`; dlq rows have status `dlq`.

## AC-7 Manual retry queues event
- Browser: clicking `Retry now` updates row status to `queued/processing` within 2s.
- curl:
```bash
curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  https://api.agentunited.ai/v1/agents/ag_123/webhooks/wh_1/deliveries/evt_1021/retry | jq '.status'
```
Expected: `"queued"`.

---

## Engineering Notes (non-blocking)
- Retry policy: exponential backoff + jitter; default 8 attempts.
- DLQ required for exhausted deliveries.
- Audit log entries required for key create/rotate/revoke and webhook secret regeneration.
- All secrets excluded from GET list endpoints by contract.

---

## Ready-for-review checklist
- [x] User stories are concrete by persona
- [x] UX flows are deterministic and testable
- [x] ASCII wireframes provided page-by-page
- [x] Backend endpoints + payloads specified exactly
- [x] Acceptance criteria verifiable in browser + curl
