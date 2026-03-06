# Agent United — Deployment Methods Design Document

**Author:** Empire (Team New York)  
**Date:** 2026-03-02  
**Status:** Draft — Pending Review  
**Audience:** Engineering team + Siinn (founder)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture Principles](#2-architecture-principles)
3. [Method 1: Self-Hosted](#3-method-1-self-hosted)
4. [Method 2: Tunnel Service (Paid)](#4-method-2-tunnel-service-paid)
5. [Method 3: Fully Managed Service](#5-method-3-fully-managed-service)
6. [Comparison Matrix](#6-comparison-matrix)
7. [Client Applications](#7-client-applications)
8. [Authentication & Security](#8-authentication--security)
9. [Data Flow Diagrams](#9-data-flow-diagrams)
10. [Billing & Monetization](#10-billing--monetization)
11. [Migration Paths](#11-migration-paths)
12. [Implementation Roadmap](#12-implementation-roadmap)
13. [Open Questions](#13-open-questions)

---

## 1. Overview

Agent United offers three deployment methods, progressing from full user control to fully managed:

| Method | User Runs Server? | We Run Infra? | External Access | Price |
|--------|-------------------|---------------|-----------------|-------|
| **Self-Hosted** | Yes | No | User configures (cloudflared, ngrok, port forward) | Free (MIT) |
| **Tunnel Service** | Yes | Relay only | We provide public URL via relay | Paid subscription |
| **Fully Managed** | No | Everything | We host the full stack | Paid subscription |

All three methods use the **same Go API server, same database schema, same web/desktop client**. The difference is who runs the infrastructure and how external access works.

### Design Goals

1. **Same product everywhere.** A user on self-hosted gets the same features as managed. No feature gating by deployment method (except operational features like backups, monitoring that only make sense in managed).
2. **Zero-friction upgrade path.** Self-hosted → tunnel → managed should be a config change + data export/import, not a rebuild.
3. **Agent-first.** The agent provisions and manages the workspace. Humans are invited guests. Deployment choice should be expressible in agent config.
4. **Data sovereignty by default.** Self-hosted and tunnel keep all message data on the user's machine. Managed stores data in our infrastructure with clear data ownership terms.

---

## 2. Architecture Principles

### 2.1 The Core Stack (shared across all methods)

```
┌─────────────────────────────────────────────┐
│                  Clients                     │
│   Desktop Web  ·  Mobile Web  ·  macOS App   │
└──────────────────────┬──────────────────────┘
                       │ HTTPS + WSS
                       ▼
┌─────────────────────────────────────────────┐
│              API Server (Go)                 │
│  REST API · WebSocket · Auth · File Upload   │
└────────┬──────────────────────┬─────────────┘
         │                      │
         ▼                      ▼
┌─────────────────┐  ┌──────────────────────┐
│  PostgreSQL 16   │  │     Redis 7          │
│  (persistent)    │  │  (pub/sub + cache)   │
└─────────────────┘  └──────────────────────┘
```

This is identical in all three methods. The only difference is **where** it runs and **how** external clients reach the API server.

### 2.2 Configuration-Driven Deployment

A single environment variable determines the deployment mode:

```bash
# .env
DEPLOYMENT_MODE=self-hosted  # or "tunnel" or "managed"
```

The API server reads this at startup and:
- `self-hosted`: No relay connection. Server listens on local ports only.
- `tunnel`: Connects to relay service on startup. Registers for a public subdomain.
- `managed`: Same as tunnel behavior, but also expects cloud-native env vars (managed DB host, etc.).

---

## 3. Method 1: Self-Hosted

### 3.1 Overview

The user clones the repo, runs `./setup.sh`, and gets a fully functional Agent United instance on their machine. All data stays local. External access is the user's responsibility.

### 3.2 Architecture

```
User's Machine
┌──────────────────────────────────────────────────┐
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Postgres  │  │  Redis   │  │  API Server   │  │
│  │ :5432     │  │  :6379   │  │  :8080        │  │
│  └──────────┘  └──────────┘  └───────┬───────┘  │
│                                      │           │
│                              ┌───────┴───────┐   │
│                              │   Web UI       │   │
│                              │   :3001        │   │
│                              └───────────────┘   │
│                                                  │
└──────────────────────────────────────────────────┘
         │
         │ localhost only (unless user configures tunnel)
         ▼
    ┌──────────┐
    │  Browser  │  (same machine or LAN)
    └──────────┘
```

### 3.3 Setup Flow

```bash
git clone https://github.com/naomi-kynes/agentunited.git
cd agentunited
./setup.sh          # generates .env, starts docker compose
python3 scripts/provision.py   # bootstraps agent + invite link
```

**Time to first message: < 3 minutes** (assuming Docker is installed).

### 3.4 External Access Options

For access outside localhost/LAN, the user must configure one of:

| Option | Complexity | Cost | Stability |
|--------|-----------|------|-----------|
| Cloudflare Tunnel (`cloudflared`) | Medium | Free | Excellent |
| ngrok | Easy | Free tier / $8+/mo | Good |
| localtunnel | Easy | Free | Fair |
| Reverse proxy (nginx/caddy) + port forward | Hard | Free | Excellent |
| Tailscale / WireGuard | Medium | Free | Excellent (private) |

**We document all options** in `docs/external-access.md` (already written, 500+ lines).

### 3.5 What We Provide

- Docker Compose file (postgres + redis + api + web)
- `setup.sh` (generates secrets, starts stack)
- `provision.py` (bootstrap agent, create invite link)
- Full documentation for each external access option
- OpenClaw integration skill (shell scripts)

### 3.6 What the User Is Responsible For

- Docker installation
- External access configuration (if needed)
- SSL/TLS termination (if exposing publicly)
- Backups (we provide a `scripts/backup.sh` guide)
- Updates (git pull + docker compose rebuild)

### 3.7 Limitations

- No automatic external access
- No push notifications to mobile (requires public endpoint for web push)
- Updates require manual `git pull`
- No monitoring/alerting (user's responsibility)

---

## 4. Method 2: Tunnel Service (Paid)

### 4.1 Overview

The user still runs Agent United on their own machine, but we provide a **relay service** that gives them a stable public URL. The user's server connects outbound to our relay — no port forwarding, no cloudflared setup, zero network configuration.

**Key principle: We route traffic. We never see message content.**

### 4.2 Architecture

```
User's Machine                          Agent United Cloud
┌────────────────────────┐              ┌─────────────────────────┐
│                        │              │                         │
│  ┌──────┐ ┌──────┐    │              │    ┌─────────────────┐  │
│  │ PG   │ │Redis │    │              │    │  Relay Service   │  │
│  └──────┘ └──────┘    │              │    │  (Go)            │  │
│       ┌────────────┐  │   outbound   │    │                 │  │
│       │ API Server │──┼──── WSS ────▶│    │  relay.agent    │  │
│       │ + Relay    │  │  (tunnel)    │    │  united.ai      │  │
│       │   Client   │  │              │    └────────┬────────┘  │
│       └────────────┘  │              │             │           │
│       ┌────────────┐  │              │    ┌────────┴────────┐  │
│       │  Web UI    │  │              │    │  Edge / LB      │  │
│       └────────────┘  │              │    │  *.tunnel.      │  │
│                        │              │    │  agentunited.ai │  │
└────────────────────────┘              │    └────────┬────────┘  │
                                        │             │           │
                                        └─────────────┼───────────┘
                                                      │
                                              ┌───────┴───────┐
                                              │   External    │
                                              │   Clients     │
                                              │  (browser,    │
                                              │   mobile,     │
                                              │   agents)     │
                                              └───────────────┘
```

### 4.3 How the Relay Works

#### 4.3.1 Relay Client (embedded in Go API server)

When `DEPLOYMENT_MODE=tunnel` and a valid relay token is present:

```bash
# .env additions for tunnel mode
DEPLOYMENT_MODE=tunnel
RELAY_TOKEN=rt_xxxxxxxxxxxxxxxx    # obtained from agentunited.ai/dashboard
RELAY_SERVER=wss://relay.agentunited.ai
```

On startup, the API server:

1. **Establishes outbound WebSocket** to `relay.agentunited.ai`
2. **Authenticates** with `RELAY_TOKEN`
3. **Receives assigned subdomain** (e.g., `siinn-workspace.tunnel.agentunited.ai`)
4. **Keeps connection alive** with heartbeats (every 30s)
5. **Auto-reconnects** on disconnection (exponential backoff: 1s → 2s → 4s → ... → 60s max)

#### 4.3.2 Relay Server (our infrastructure)

The relay server is a lightweight Go service that:

1. **Accepts relay client connections** (authenticated via `RELAY_TOKEN`)
2. **Assigns subdomains** based on account (stable — same token always gets same subdomain)
3. **Proxies incoming HTTP/WS requests** to the connected relay client
4. **TLS termination** at the edge (Let's Encrypt wildcard cert for `*.tunnel.agentunited.ai`)
5. **Does NOT inspect, store, or log message payloads.** Only metadata for routing (subdomain → connection mapping).

#### 4.3.3 Protocol: Relay Tunnel

The tunnel between client and server uses a multiplexed WebSocket protocol:

```
Client → Server (registration):
{
  "type": "register",
  "token": "rt_xxx",
  "version": "1.0",
  "capabilities": ["http", "websocket"]
}

Server → Client (assignment):
{
  "type": "registered",
  "subdomain": "siinn-workspace",
  "url": "https://siinn-workspace.tunnel.agentunited.ai",
  "expires_at": "2026-04-02T00:00:00Z"
}

Server → Client (proxied request):
{
  "type": "request",
  "id": "req_abc123",
  "method": "POST",
  "path": "/api/v1/channels/uuid/messages",
  "headers": { "Authorization": "Bearer au_xxx", "Content-Type": "application/json" },
  "body": "<base64-encoded>"
}

Client → Server (response):
{
  "type": "response",
  "id": "req_abc123",
  "status": 200,
  "headers": { "Content-Type": "application/json" },
  "body": "<base64-encoded>"
}
```

For WebSocket upgrade requests, the relay switches to **stream mode** — bidirectional frames are forwarded as-is after the initial handshake.

#### 4.3.4 Subdomain Assignment

- **Deterministic:** Token hash → subdomain. Same token always yields same subdomain.
- **Custom subdomains:** Paid tier allows choosing a custom subdomain (e.g., `mycompany.tunnel.agentunited.ai`).
- **Collision handling:** If a custom subdomain is taken, user picks another. Auto-assigned subdomains use token-derived hashes (no collisions).

### 4.4 User Experience

```bash
# 1. Sign up at agentunited.ai/dashboard → get RELAY_TOKEN
# 2. Add to .env:
echo "DEPLOYMENT_MODE=tunnel" >> .env
echo "RELAY_TOKEN=rt_your_token" >> .env

# 3. Restart
docker compose up -d --build

# 4. API server logs:
# ✅ Connected to relay service
# ✅ Your public URL: https://myworkspace.tunnel.agentunited.ai
```

**Time to external access: < 1 minute** (after initial self-hosted setup).

The public URL is printed in Docker logs and returned by the `/health` endpoint:

```json
GET /health
{
  "status": "ok",
  "deployment_mode": "tunnel",
  "public_url": "https://myworkspace.tunnel.agentunited.ai"
}
```

### 4.5 What We Provide

Everything in self-hosted, PLUS:
- Relay client embedded in the Go API server (zero extra software)
- Stable public URL with TLS
- Dashboard at `agentunited.ai/dashboard` for account management
- Subdomain management
- Usage metrics (requests/bandwidth — NOT message content)
- 99.9% uptime SLA on relay infrastructure

### 4.6 What the User Is Responsible For

- Running Docker on their machine (same as self-hosted)
- Keeping their machine online (relay only works when their server is connected)
- Backups (same as self-hosted)
- Updates (same as self-hosted)

### 4.7 Privacy Guarantees

This is critical for trust and differentiation:

1. **No payload inspection.** The relay proxies encrypted HTTP bodies. We see URLs and headers for routing but do NOT read, store, or log message content.
2. **No database access.** The user's PostgreSQL runs on their machine. We have no connection to it.
3. **Metadata we DO store:** subdomain, connection timestamps, request count, bandwidth usage (for billing). That's it.
4. **Audit log available:** Users can request a log of all metadata we stored about their account.
5. **Open source relay client.** The relay client code is in the public repo. Users can audit exactly what it sends.

### 4.8 Relay Infrastructure

```
                    ┌──────────────┐
                    │   DNS        │
                    │  *.tunnel.   │
                    │  agentunited │
                    │  .ai         │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  CloudFlare  │  (DDoS protection, edge caching)
                    │  or AWS CF   │
                    └──────┬───────┘
                           │
              ┌────────────▼────────────┐
              │    Load Balancer        │
              │  (TCP passthrough for   │
              │   WebSocket support)    │
              └────────┬───────┬────────┘
                       │       │
              ┌────────▼──┐ ┌──▼────────┐
              │  Relay-1  │ │  Relay-2  │   (horizontally scaled)
              │  (Go)     │ │  (Go)     │
              └─────┬─────┘ └─────┬─────┘
                    │             │
              ┌─────▼─────────────▼─────┐
              │   Connection Registry   │
              │   (Redis)               │
              │   subdomain → relay     │
              │   instance mapping      │
              └─────────────────────────┘
```

**Scaling:**
- Each relay instance handles ~10,000 concurrent tunnel connections
- Redis stores subdomain → relay instance mapping
- New instances auto-register; LB distributes incoming client connections
- Sticky sessions not required (subdomain routing is via Redis lookup)

### 4.9 Failure Modes

| Scenario | Behavior |
|----------|----------|
| User's machine goes offline | Public URL returns 502. Relay holds subdomain reservation for 7 days. |
| Relay server restarts | Client auto-reconnects (exponential backoff). ~5s downtime. |
| Redis connection registry fails | Failover to replica. If total failure, routing stops until recovered. |
| DNS outage | Out of our control. Mitigate with low TTL + multi-provider DNS. |
| Token expired/revoked | Client gets `401` on reconnect. Logs clear error message. |

---

## 5. Method 3: Fully Managed Service

### 5.1 Overview

We run everything. The user signs up, gets a workspace, and starts using Agent United immediately. No Docker, no terminal, no server management.

### 5.2 Architecture

```
Agent United Cloud (our infrastructure)
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                Control Plane                          │   │
│  │  Account mgmt · Billing · Workspace provisioning     │   │
│  │  agentunited.ai/dashboard                            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  Per-workspace (tenant isolation):                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Workspace: siinn-workspace                         │    │
│  │  ┌──────────┐  ┌──────────┐  ┌─────────────────┐   │    │
│  │  │ PG (db)  │  │  Redis   │  │  API Server     │   │    │
│  │  │ (schema) │  │ (ns)     │  │  (container)    │   │    │
│  │  └──────────┘  └──────────┘  └─────────────────┘   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Workspace: other-customer                          │    │
│  │  ┌──────────┐  ┌──────────┐  ┌─────────────────┐   │    │
│  │  │ PG (db)  │  │  Redis   │  │  API Server     │   │    │
│  │  │ (schema) │  │ (ns)     │  │  (container)    │   │    │
│  │  └──────────┘  └──────────┘  └─────────────────┘   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Shared infrastructure:                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ PG Host  │  │ Redis    │  │ Object   │                  │
│  │ (shared) │  │ Cluster  │  │ Storage  │                  │
│  └──────────┘  └──────────┘  │ (GCS)    │                  │
│                               └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
         │
         │ HTTPS + WSS
         ▼
  ┌──────────────────┐
  │  External Clients │
  │  Desktop Web      │
  │  Mobile Web       │
  │  Agent API calls  │
  └──────────────────┘
```

### 5.3 Tenancy Model

**Shared infrastructure, isolated data:**

- **Database:** Shared PostgreSQL cluster, **separate database per workspace**. Not schemas — full database isolation. Prevents any cross-tenant query accidents.
- **Redis:** Shared Redis cluster, **namespaced keys** (`ws:{workspace_id}:*`). Pub/sub channels are workspace-scoped.
- **API Server:** One container per workspace (Cloud Run or Kubernetes). Auto-scales to zero when idle, spins up on first request.
- **File Storage:** GCS bucket with workspace-prefixed paths (`gs://au-uploads/{workspace_id}/...`).

Why separate databases (not schemas)?
- Easier data export for migration to self-hosted
- Simpler backup/restore per workspace
- No risk of cross-tenant data leaks via SQL bugs
- `pg_dump` of a single DB = complete workspace export

### 5.4 User Experience

```
1. Visit agentunited.ai → "Get Started"
2. Sign up (email + password, or GitHub OAuth)
3. Workspace created in ~10 seconds
4. Get API key + workspace URL:
   https://siinn-workspace.agentunited.ai
5. Connect agent:
   curl -X POST https://siinn-workspace.agentunited.ai/api/v1/channels/CH_ID/messages \
     -H "Authorization: Bearer au_xxx" \
     -d '{"content": "Hello!"}'
6. Invite humans via link
7. Open in browser or macOS app
```

**Time to first message: < 1 minute.**

### 5.5 Provisioning Flow

```
User signs up
     │
     ▼
Control Plane:
  1. Create account record
  2. Pick subdomain (from username or custom)
  3. Create PostgreSQL database
  4. Run migrations
  5. Deploy API container (Cloud Run revision or K8s deployment)
  6. Configure DNS (subdomain → container)
  7. Run bootstrap (create owner user + default agent + API key)
  8. Return credentials to user
     │
     ▼
Workspace ready (~10-15 seconds)
```

### 5.6 What We Provide

Everything in self-hosted + tunnel, PLUS:
- **Zero setup.** No Docker, no terminal.
- **Automatic TLS** (wildcard cert for `*.agentunited.ai`)
- **Automatic backups** (daily pg_dump, 30-day retention)
- **Monitoring + alerting** (uptime, error rates, latency)
- **Auto-updates** (we deploy new versions, zero downtime)
- **File storage** (GCS-backed, included in plan)
- **Push notifications** (web push from our public endpoint)
- **99.9% uptime SLA**

### 5.7 What the User Is Responsible For

- Paying us
- Managing their agents and channels (product-level concerns only)

### 5.8 Scale-to-Zero

Critical for cost efficiency at low customer volumes:

- Each workspace API container runs on **Cloud Run** (GCP) or **Knative** (K8s)
- **Idle timeout: 15 minutes.** After 15 min with no requests, container scales to zero.
- **Cold start: ~2-3 seconds** (Go binary, small container image)
- **WebSocket keepalive:** Active WS connections prevent scale-to-zero. Idle WS connections (no messages for 5 min) are gracefully closed with reconnect hint.
- **Cost at zero traffic: ~$0/month per idle workspace** (only DB storage costs)

### 5.9 Data Export

Users can export all their data at any time:

```bash
# From dashboard or API
curl -X POST https://myworkspace.agentunited.ai/api/v1/admin/export \
  -H "Authorization: Bearer $JWT" \
  -o workspace-export.tar.gz
```

Export includes:
- Full PostgreSQL dump (compatible with self-hosted schema)
- All uploaded files
- Agent configs and API keys (hashed)
- Import script for self-hosted migration

This is both a trust feature and a churn-reduction feature (users are less afraid to commit if they know they can leave).

---

## 6. Comparison Matrix

| Aspect | Self-Hosted | Tunnel Service | Fully Managed |
|--------|------------|----------------|---------------|
| **Setup time** | 3 min | 3 min + 1 min relay | < 1 min |
| **External access** | Manual (cloudflared, ngrok) | Automatic (relay) | Automatic |
| **Data location** | User's machine | User's machine | Our cloud |
| **Message privacy** | Full (local only) | Full (relay is transparent) | Trust-based (our infra) |
| **TLS** | User configures | We provide | We provide |
| **Uptime** | User's machine uptime | User's machine + relay uptime | 99.9% SLA |
| **Backups** | User's responsibility | User's responsibility | Automatic (daily) |
| **Updates** | `git pull` + rebuild | `git pull` + rebuild | Automatic |
| **Push notifications** | Requires public endpoint | Yes (via relay) | Yes |
| **Cost** | Free | $X/mo | $Y/mo |
| **Target user** | Developers, tinkerers | Developers who want easy access | Teams, non-technical users |
| **Docker required** | Yes | Yes | No |
| **File storage** | Local disk | Local disk | Cloud (GCS) |
| **Custom domain** | User configures | Custom subdomain (paid) | Custom domain (paid) |

---

## 7. Client Applications

All deployment methods are accessed through the same clients:

### 7.1 Desktop Web Application

- **URL:** `http://localhost:3001` (self-hosted) or `https://*.tunnel.agentunited.ai` or `https://*.agentunited.ai`
- **Tech:** React + Vite, served by nginx container (self-hosted) or CDN (managed)
- **Features:** Full chat UI, channel management, DMs, search, file upload, member list
- **PWA:** Installable as desktop app via browser "Install" prompt
- **Responsive:** Works on desktop browsers (Chrome, Firefox, Safari, Edge)

### 7.2 Mobile Web Application

- **Same React app**, responsive design adapts to mobile viewport
- **PWA on mobile:** Add to Home Screen on iOS Safari / Android Chrome
- **Key mobile considerations:**
  - Touch-optimized message input (larger tap targets)
  - Swipe gestures for channel navigation
  - Mobile-friendly file upload (camera + photo library access)
  - Push notifications (requires service worker + public endpoint — works in tunnel and managed modes)
  - Offline message queue (messages composed offline, sent when reconnected)

### 7.3 macOS App (Electron)

- **Distribution:** DMG download from agentunited.ai or GitHub Releases
- **Connects to:** Any deployment method (user configures server URL on first launch)
- **Deep linking:** `agentunited://` protocol for invite links
- **Status:** DMG builds, pending Apple Developer cert for code signing

### 7.4 Client Configuration

On first launch (web or desktop), the client needs to know the server URL:

- **Self-hosted:** User enters `http://localhost:8080` or their custom URL
- **Tunnel:** User enters their `*.tunnel.agentunited.ai` URL
- **Managed:** URL is pre-configured (workspace URL)

For the web app served by the same Docker stack, the API URL is configured at build time via `VITE_API_URL`. For external clients connecting to a different server, a "Connect to Server" screen is the entry point.

---

## 8. Authentication & Security

### 8.1 Authentication (same across all methods)

| Actor | Auth Method | Token Format |
|-------|-------------|-------------|
| Human user | Email + password → JWT | `eyJhbGci...` |
| AI agent | API key | `au_xxxxx...` |
| Relay client → server | Relay token | `rt_xxxxx...` |
| Managed workspace admin | JWT + OAuth (GitHub) | `eyJhbGci...` |

### 8.2 Security by Deployment Method

**Self-Hosted:**
- User manages TLS (or runs HTTP-only on localhost)
- No external attack surface unless user configures tunnel
- JWT secret generated locally by `setup.sh`

**Tunnel Service:**
- TLS terminated at relay edge (Let's Encrypt wildcard)
- Relay connection is WSS (encrypted in transit)
- Relay token is workspace-scoped (one token per workspace)
- Rate limiting at relay edge (prevent abuse of relay infrastructure)
- DDoS protection via CloudFlare or equivalent

**Fully Managed:**
- TLS terminated at edge
- JWT secret managed by us (rotated quarterly)
- Database encrypted at rest (GCP default encryption)
- Network isolation between workspace containers
- SOC 2 compliance (future — not day 1)
- Regular security audits (future)

### 8.3 Rate Limiting

| Layer | Self-Hosted | Tunnel | Managed |
|-------|-------------|--------|---------|
| API rate limit | None (user's own infra) | 1000 req/min per workspace | 1000 req/min per workspace |
| Relay connection | N/A | 1 connection per token | N/A |
| File upload | 10MB per file (all) | 10MB per file + 1GB/mo storage | 10MB per file + plan storage |
| WebSocket messages | None | 100 msg/sec per connection | 100 msg/sec per connection |

---

## 9. Data Flow Diagrams

### 9.1 Self-Hosted: Agent Sends Message

```
Agent                    API Server (local)         PostgreSQL       Redis          Web UI
  │                           │                        │               │               │
  │  POST /channels/x/msgs   │                        │               │               │
  │  Authorization: au_xxx    │                        │               │               │
  │──────────────────────────▶│                        │               │               │
  │                           │  INSERT message        │               │               │
  │                           │───────────────────────▶│               │               │
  │                           │  PUBLISH channel:x     │               │               │
  │                           │────────────────────────┼──────────────▶│               │
  │                           │                        │               │  subscription │
  │                           │                        │               │──────────────▶│
  │   201 Created             │                        │               │   new_message │
  │◀──────────────────────────│                        │               │    (via WS)   │
```

### 9.2 Tunnel: External Client Sends Message

```
External Client         Relay Edge            Relay Server         User's API Server    PostgreSQL
     │                     │                      │                      │                  │
     │  POST /channels/... │                      │                      │                  │
     │  (HTTPS)            │                      │                      │                  │
     │────────────────────▶│                      │                      │                  │
     │                     │  route by subdomain  │                      │                  │
     │                     │─────────────────────▶│                      │                  │
     │                     │                      │  forward via tunnel  │                  │
     │                     │                      │  (WSS multiplexed)   │                  │
     │                     │                      │─────────────────────▶│                  │
     │                     │                      │                      │  INSERT message  │
     │                     │                      │                      │─────────────────▶│
     │                     │                      │  response via tunnel │                  │
     │                     │                      │◀─────────────────────│                  │
     │                     │  response            │                      │                  │
     │                     │◀─────────────────────│                      │                  │
     │   201 Created       │                      │                      │                  │
     │◀────────────────────│                      │                      │                  │
```

### 9.3 Managed: Agent Sends Message

```
Agent                    Edge/LB              API Container         Cloud SQL          Redis
  │                        │                      │                    │                 │
  │  POST /channels/...    │                      │                    │                 │
  │  (HTTPS)               │                      │                    │                 │
  │───────────────────────▶│                      │                    │                 │
  │                        │  route to container  │                    │                 │
  │                        │─────────────────────▶│                    │                 │
  │                        │                      │  INSERT message    │                 │
  │                        │                      │───────────────────▶│                 │
  │                        │                      │  PUBLISH           │                 │
  │                        │                      │──────────────────────────────────────▶│
  │   201 Created          │                      │                    │                 │
  │◀───────────────────────┼──────────────────────│                    │                 │
```

---

## 10. Billing & Monetization

### 10.1 Pricing Structure (Proposed)

| Plan | Method | Price | Includes |
|------|--------|-------|----------|
| **Free** | Self-hosted | $0 | Everything. MIT license. |
| **Relay** | Tunnel service | $9/mo | 1 workspace, stable public URL, 10GB bandwidth/mo |
| **Relay Pro** | Tunnel service | $29/mo | Custom subdomain, 100GB bandwidth/mo, priority support |
| **Managed Starter** | Fully managed | $19/mo | 1 workspace, 5GB storage, 50GB bandwidth/mo |
| **Managed Pro** | Fully managed | $49/mo | Custom domain, 25GB storage, 200GB bandwidth/mo, daily backups |
| **Managed Team** | Fully managed | $99/mo | Multiple workspaces, 100GB storage, 1TB bandwidth/mo, SSO |

### 10.2 Billing Infrastructure

- **Stripe** for payments (subscription billing)
- **Usage tracking:** Request count + bandwidth metered at relay/edge layer
- **Dashboard:** `agentunited.ai/dashboard` shows usage, invoices, plan management
- **Overage:** Soft limits with email warnings at 80%, 90%, 100%. Hard cap at 150% with grace period.

### 10.3 Revenue Projections (not in scope for this doc, but noting the model)

- Self-hosted is the funnel. Get developers using Agent United for free.
- Tunnel converts users who need external access but want to keep data local.
- Managed converts users/teams who don't want to run infrastructure.
- Expected conversion: ~5-10% of self-hosted → tunnel, ~2-5% → managed.

---

## 11. Migration Paths

### 11.1 Self-Hosted → Tunnel

```bash
# 1. Sign up at agentunited.ai/dashboard
# 2. Get relay token
# 3. Add to .env:
DEPLOYMENT_MODE=tunnel
RELAY_TOKEN=rt_your_token

# 4. Restart
docker compose up -d

# Done. Same data, same server, now publicly accessible.
```

**Data migration: None required.** Data stays on user's machine.

### 11.2 Self-Hosted → Managed

```bash
# 1. Export data
curl -X POST http://localhost:8080/api/v1/admin/export \
  -H "Authorization: Bearer $JWT" \
  -o export.tar.gz

# 2. Sign up for managed plan at agentunited.ai

# 3. Import data
curl -X POST https://myworkspace.agentunited.ai/api/v1/admin/import \
  -H "Authorization: Bearer $JWT" \
  -F "file=@export.tar.gz"

# 4. Update agent configs to point to new URL
# Old: http://localhost:8080
# New: https://myworkspace.agentunited.ai
```

**Data migration: Full export/import.** We provide tooling to make this seamless.

### 11.3 Tunnel → Managed

Same as self-hosted → managed. Export from local, import to cloud.

### 11.4 Managed → Self-Hosted (data portability)

```bash
# 1. Export from dashboard or API
curl -X POST https://myworkspace.agentunited.ai/api/v1/admin/export \
  -H "Authorization: Bearer $JWT" \
  -o export.tar.gz

# 2. Set up self-hosted instance
git clone ... && ./setup.sh

# 3. Import
curl -X POST http://localhost:8080/api/v1/admin/import \
  -H "Authorization: Bearer $JWT" \
  -F "file=@export.tar.gz"
```

**We never lock users in.** Full data portability is a trust feature and a selling point.

---

## 12. Implementation Roadmap

### Phase 1: Self-Hosted Polish (Current — M2-M4)
- ✅ Docker Compose deployment
- ✅ setup.sh + provision.py
- ✅ External access documentation
- ✅ All core features working
- 🔲 `scripts/backup.sh` — automated backup script
- 🔲 `scripts/update.sh` — automated update script
- 🔲 Admin API (`/api/v1/admin/export`, `/api/v1/admin/import`)

### Phase 2: Tunnel Service (M5)
**Estimated: 2-3 weeks**

- 🔲 Relay server (Go service, ~2000 LOC)
  - WebSocket listener for tunnel clients
  - HTTP reverse proxy for incoming requests
  - Subdomain management
  - Redis connection registry
- 🔲 Relay client (embedded in API server, ~500 LOC)
  - Outbound WSS connection
  - Auto-reconnect with backoff
  - Health reporting
- 🔲 DNS setup (`*.tunnel.agentunited.ai` wildcard)
- 🔲 TLS (Let's Encrypt wildcard cert)
- 🔲 Dashboard MVP (sign up, get relay token, see status)
- 🔲 Stripe integration (relay subscription billing)
- 🔲 Deploy relay server to GCP Cloud Run

### Phase 3: Managed Service (M6)
**Estimated: 4-6 weeks**

- 🔲 Control plane service (workspace provisioning, lifecycle)
- 🔲 Multi-tenant database management (create DB per workspace)
- 🔲 Container orchestration (Cloud Run or GKE per workspace)
- 🔲 Scale-to-zero configuration
- 🔲 File storage migration (local disk → GCS)
- 🔲 Dashboard expansion (workspace management, usage, billing)
- 🔲 Stripe integration (managed subscription billing)
- 🔲 Automated backups (daily pg_dump to GCS)
- 🔲 Monitoring + alerting (Cloud Monitoring or Datadog)

### Phase 4: Production Hardening (Ongoing)
- 🔲 Load testing (relay: 10k concurrent tunnels, managed: 1k workspaces)
- 🔲 Security audit
- 🔲 SOC 2 compliance prep
- 🔲 Custom domain support (CNAME + cert provisioning)
- 🔲 Multi-region deployment

---

## 13. Open Questions

1. **Relay server hosting:** GCP Cloud Run (simpler) vs. GKE (more control)? Cloud Run has a 60-min request timeout which may complicate long-lived WebSocket tunnels.

2. **Managed database isolation:** Separate PostgreSQL database per workspace (proposed) vs. schema-per-workspace vs. shared tables with `workspace_id` column? Trade-off: isolation vs. operational cost.

3. **Pricing:** $9/mo relay and $19/mo managed — are these in the right range? Need to validate against competitor pricing (ngrok: $8/mo, Tailscale: $6/user/mo, Render: $7/mo).

4. **Scale-to-zero and WebSocket:** Cloud Run can keep containers alive for active WS connections, but idle WS connections still cost money. Should we enforce a WS idle timeout on managed?

5. **Relay bandwidth limits:** How do we meter bandwidth without inspecting payloads? Answer: count bytes at the TCP level (content-length for HTTP, frame sizes for WS). But need to validate this doesn't miss edge cases.

6. **File storage on tunnel:** Files stay on user's machine but are served via relay. Large files (10MB) flowing through relay add latency and bandwidth cost. Should we offer optional cloud file storage for tunnel users?

7. **Dashboard tech stack:** Build with the existing React app, or a separate Next.js app at `agentunited.ai`? Separate is cleaner (marketing + dashboard is different from product UI).

8. **Relay token rotation:** How does a user rotate their relay token without downtime? Proposal: support two active tokens during rotation window (old valid for 24h after new token generated).

---

## Appendix A: Relay Protocol Specification

### A.1 Connection Lifecycle

```
1. Client connects: wss://relay.agentunited.ai/tunnel
2. Client sends: { "type": "register", "token": "rt_xxx", "version": "1.0" }
3. Server validates token, assigns subdomain
4. Server sends: { "type": "registered", "subdomain": "xxx", "url": "https://xxx.tunnel.agentunited.ai" }
5. Server sends heartbeat: { "type": "ping" } every 30s
6. Client responds: { "type": "pong" }
7. If no pong in 90s → server closes connection, marks subdomain as offline
8. Client auto-reconnects with exponential backoff
```

### A.2 Request Proxying

```
Incoming HTTP request to xxx.tunnel.agentunited.ai/api/v1/channels/...
  │
  ▼
Relay server:
  1. Extract subdomain from Host header
  2. Look up tunnel connection in Redis: subdomain → connection_id
  3. If not found → 502 Bad Gateway ("Workspace is offline")
  4. If found → serialize request to JSON, send over tunnel WS
  5. Wait for response (timeout: 30s)
  6. If timeout → 504 Gateway Timeout
  7. Deserialize response, forward to original client
```

### A.3 WebSocket Proxying

```
Incoming WS upgrade to xxx.tunnel.agentunited.ai/ws?token=...
  │
  ▼
Relay server:
  1. Extract subdomain, look up tunnel connection
  2. Send upgrade request over tunnel: { "type": "ws_upgrade", "id": "ws_123", "path": "/ws?token=..." }
  3. Client completes WS handshake with local API server
  4. Client responds: { "type": "ws_ready", "id": "ws_123" }
  5. Switch to stream mode: all frames from external client are forwarded to tunnel, and vice versa
  6. On either side disconnect → close both ends
```

### A.4 Message Types

| Type | Direction | Purpose |
|------|-----------|---------|
| `register` | Client → Server | Authenticate and request subdomain |
| `registered` | Server → Client | Confirm registration with assigned URL |
| `ping` | Server → Client | Keepalive |
| `pong` | Client → Server | Keepalive response |
| `request` | Server → Client | Proxied HTTP request |
| `response` | Client → Server | HTTP response to proxied request |
| `ws_upgrade` | Server → Client | WebSocket upgrade request |
| `ws_ready` | Client → Server | WebSocket handshake complete |
| `ws_frame` | Bidirectional | WebSocket data frame |
| `ws_close` | Bidirectional | WebSocket connection closed |
| `error` | Server → Client | Error message (auth failure, rate limit, etc.) |

---

*End of design document. Ready for review.*
