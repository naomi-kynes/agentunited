# Agent United — User Journey & Payment Architecture
## Methods 2 (Tunnel) & 3 (Managed): End-to-End Deep Dive

**Author:** Empire 🗽 (with Moon's product lens)  
**Date:** 2026-03-03  
**Status:** Draft — For Siinn's Review  
**Companion doc:** `deployment-methods-design.md`

---

## Table of Contents

1. [Method 2: Tunnel Service — User Journey](#1-method-2-tunnel-service--user-journey)
2. [Method 3: Fully Managed — User Journey](#2-method-3-fully-managed--user-journey)
3. [Payment Architecture (Stripe)](#3-payment-architecture-stripe)
4. [Dashboard Pages Required](#4-dashboard-pages-required)
5. [User Effort Comparison](#5-user-effort-comparison)

---

## 1. Method 2: Tunnel Service — User Journey

### Design Principle: Zero Manual Work After Payment

The user's agent is already running on their machine. After the human signs up and pays, **the agent handles everything else** — receiving the relay token, configuring the tunnel, restarting services, and verifying the connection. The human never touches a terminal, never edits .env, never copy-pastes a token. Magic.

### Persona
Developer who already has Agent United self-hosted and working on localhost. Wants their agent accessible from the internet without configuring cloudflared/ngrok.

### Prerequisites
- Agent United self-hosted, running via Docker Compose
- Credit card (for payment)
- That's it. No terminal needed.

---

### Step-by-Step Journey

#### Step 1: Discover the Tunnel Service (0 min — passive)
**Where:** The agent surfaces it, or the user sees it in the web UI.

**Agent-initiated (preferred):** The agent detects it's running in self-hosted mode with no external access and proactively suggests:

> "I'm only reachable on your local network right now. Want me to set up a public URL so you (and others) can reach me from anywhere? It's $9/mo and I'll handle the entire setup."

**UI-initiated:** Banner in the web UI sidebar:
```
┌─────────────────────────────────────┐
│ 🌐 Want access from anywhere?      │
│ Your agent can set up a public URL. │
│ [Enable External Access — $9/mo]    │
└─────────────────────────────────────┘
```

**User effort:** Zero — they encounter it naturally.

---

#### Step 2: Human Clicks "Enable" → Pricing & Sign-Up (2 min)
**What they see:** In-app modal or redirect to `agentunited.ai/tunnel`

```
┌─────────────────────────────────────────────────────┐
│  Agent United Tunnel                                │
│                                                     │
│  Get a public URL for your self-hosted instance.    │
│  Your data stays on your machine.                   │
│  We just route the traffic.                         │
│  Your agent handles all the setup.                  │
│                                                     │
│  ┌─────────────┐  ┌──────────────┐                  │
│  │ Relay $9/mo │  │ Relay Pro    │                  │
│  │             │  │ $29/mo       │                  │
│  │ • 1 tunnel  │  │ • 1 tunnel   │                  │
│  │ • Auto URL  │  │ • Custom     │                  │
│  │ • 10GB b/w  │  │   subdomain  │                  │
│  │ • TLS       │  │ • 100GB b/w  │                  │
│  │             │  │ • Priority   │                  │
│  │ [Get Start] │  │   support    │                  │
│  │             │  │ [Get Start]  │                  │
│  └─────────────┘  └──────────────┘                  │
│                                                     │
│  ✓ No payload inspection  ✓ Open source client      │
│  ✓ Data stays on your machine  ✓ Cancel anytime     │
│  ✓ Agent handles setup automatically                │
└─────────────────────────────────────────────────────┘
```

If not already signed in, GitHub OAuth or email sign-up (same as Method 3).

**User effort:** Pick plan, sign in if needed. One or two clicks.

---

#### Step 3: Payment via Stripe Checkout (1 min)
**What happens:** Redirected to Stripe Checkout Session.

```
┌─────────────────────────────────────────────────────┐
│  stripe.com/checkout                                │
│                                                     │
│  Agent United, Inc.                                 │
│                                                     │
│  Relay Plan .................... $9.00/mo           │
│  • 1 tunnel connection                              │
│  • Stable public URL with TLS                       │
│  • 10GB bandwidth/month                             │
│                                                     │
│  Card number  [4242 4242 4242 4242]                 │
│  Expiry       [12/27]  CVC [123]                    │
│                                                     │
│  [Subscribe — $9.00/month]                          │
│                                                     │
│  Powered by Stripe · Terms · Privacy                │
└─────────────────────────────────────────────────────┘
```

**Technical flow:**
1. Our backend calls `stripe.checkout.sessions.create()` with:
   - `mode: "subscription"`
   - `price: price_relay_monthly` (pre-created in Stripe dashboard)
   - `customer_email: user.email`
   - `success_url: agentunited.ai/dashboard/tunnel/activated?session_id={CHECKOUT_SESSION_ID}`
   - `cancel_url: agentunited.ai/tunnel`
   - `metadata: { user_id: "usr_xxx", workspace_instance_id: "inst_xxx" }`
2. User enters card, clicks Subscribe
3. Stripe processes payment
4. Stripe fires `checkout.session.completed` webhook → our backend
5. User redirected to success_url

**User effort:** Enter credit card number, click Subscribe. (~60 seconds)

**This is the last thing the human does.** Everything after this is automatic.

---

#### Step 4: Agent Auto-Provisions (10–15 sec — zero human action)

**What happens on our side (triggered by `checkout.session.completed` webhook):**
1. Our cloud backend generates relay token (`rt_` prefix + 32 random bytes)
2. Assigns subdomain (deterministic from account)
3. Stores subscription + token metadata
4. **Pushes the relay token to the user's local instance** via the workspace's existing API connection

**How the token reaches the local agent — the key mechanism:**

The user's Agent United instance already has a "phone home" capability. During initial self-hosted setup, the instance registered a **provisioning callback channel** with our cloud:

```
Local instance ←── persistent polling/SSE ──→ agentunited.ai/api/provision
```

When the user signed up on the web (Step 2), they linked their cloud account to their local instance (the sign-up flow includes a one-time pairing code shown in the local web UI, like Plex/Tailscale device pairing). This pairing is a one-time setup that happens at sign-up, not at tunnel purchase.

**Alternative pairing approaches (pick one):**
- **QR code:** Local web UI shows QR code. User scans during sign-up on agentunited.ai (works well on mobile).
- **6-digit code:** Local web UI shows "Your pairing code: `A7X-K2M`". User enters it during sign-up.
- **Magic link:** agentunited.ai sends a link to the local instance's admin email. Click = paired.
- **Auto-detect (best UX):** If the user visits agentunited.ai from the same machine running Agent United, the browser can detect the local instance on `localhost:8080` and pair automatically via a local API call.

**Once paired, after payment completes:**

```
Cloud Backend                              Local Instance (Agent)
     │                                           │
     │  POST /api/v1/admin/provision              │
     │  {                                         │
     │    "type": "tunnel_activate",              │
     │    "relay_token": "rt_xxx",                │
     │    "relay_server": "wss://relay...",        │
     │    "subdomain": "d7f3a9",                  │
     │    "public_url": "https://d7f3a9.tunnel.   │
     │                   agentunited.ai"           │
     │  }                                         │
     │──────────────────────────────────────────▶  │
     │                                           │
     │                    Agent receives token     │
     │                    Agent writes .env         │
     │                    Agent restarts API server │
     │                    Agent connects to relay   │
     │                    Agent verifies tunnel     │
     │                                           │
     │  POST /api/provision/callback              │
     │  { "status": "connected",                  │
     │    "public_url": "https://d7f3a9..." }     │
     │◀──────────────────────────────────────────  │
     │                                           │
```

**What the agent does locally (autonomously, no human):**
1. Receives relay token via provisioning API
2. Writes `DEPLOYMENT_MODE=tunnel` and `RELAY_TOKEN=rt_xxx` to `.env`
3. Triggers graceful restart of the API server process (or Docker container)
4. New process starts, reads tunnel config, opens WSS to relay
5. Verifies: makes a test request through the public URL
6. Reports success back to cloud + notifies the human in chat:

> "✅ **External access is live!** Your public URL is: `https://d7f3a9.tunnel.agentunited.ai`
> Anyone with this URL can reach your workspace. I'll keep the tunnel connected."

---

#### Step 5: Human Sees Success (0 effort)
**What they see on the web (success_url redirect):**

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ✅ Tunnel is live!                                  │
│                                                     │
│  Your public URL:                                   │
│  https://d7f3a9.tunnel.agentunited.ai               │
│                                                     │
│  Your agent configured everything automatically.    │
│  The tunnel is connected and verified.              │
│                                                     │
│  [Open Workspace]  [Go to Dashboard]                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**AND** they see a message from their agent in the chat UI confirming the tunnel is live.

**User effort:** Zero. Just read the confirmation.

---

### Method 2 Total User Journey

| Step | Action | Time | Human Effort |
|------|--------|------|-------------|
| 1 | Discover tunnel option (agent suggests or UI banner) | 0 min | Passive |
| 2 | Pick plan + sign in | 2 min | Read + click |
| 3 | Pay via Stripe Checkout | 1 min | Enter card + click |
| 4 | Agent auto-provisions tunnel | 10-15 sec | **Zero — agent handles it** |
| 5 | See confirmation | 0 min | Read |
| **Total** | | **~3 min** | **Minimal — sign up + pay** |

**Key insight:** The human does exactly two things: choose a plan and enter their credit card. The agent does everything else. No terminal, no copy-paste, no .env editing, no Docker restart. This is the magical experience.

### One-Time Prerequisite: Instance Pairing

The auto-provisioning flow requires the local instance to be **paired** with the user's cloud account. This is a one-time step that happens when the user first creates their agentunited.ai account (or when they first click "Enable External Access").

**Pairing flow (one-time, ~30 sec):**
1. User's local web UI shows a pairing section: "Link to agentunited.ai" with a 6-digit code
2. During agentunited.ai sign-up, user enters the code (or scans QR)
3. Cloud sends a verification ping to the local instance
4. Local instance confirms → pairing established
5. From now on, cloud can push config to local instance

**This is similar to:** Plex server linking, Tailscale device authorization, or VS Code tunnel pairing. Familiar pattern for developers.

**If the user is on the same machine** (most common case), we can auto-detect the local instance and skip the code entirely — the browser hits `localhost:8080/api/v1/admin/pair` with a one-time token from the sign-up flow.

---

## 2. Method 3: Fully Managed — User Journey

### Persona
Developer or small team that doesn't want to run Docker. Wants Agent United working in under 2 minutes with zero infra.

### Prerequisites
- A web browser
- Credit card (for payment)
- That's it. No Docker, no terminal, no server.

---

### Step-by-Step Journey

#### Step 1: Visit agentunited.ai (0 min — passive)
**Where:** Landing page, HN post, GitHub README, word of mouth.

**What they see:** Landing page with prominent "Get Started — Free" or "Try Managed" CTA.

---

#### Step 2: Pick a Plan (1 min)
**What they see:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Self-Hosted  │  │ Managed      │  │ Managed Pro  │              │
│  │ Free         │  │ $19/mo       │  │ $49/mo       │              │
│  │              │  │              │  │              │              │
│  │ Run it       │  │ We run it    │  │ Everything   │              │
│  │ yourself     │  │ for you      │  │ in Pro, plus │              │
│  │              │  │              │  │              │              │
│  │ • Full       │  │ • Zero setup │  │ • Custom     │              │
│  │   control    │  │ • 5GB store  │  │   domain     │              │
│  │ • MIT license│  │ • 50GB b/w   │  │ • 25GB store │              │
│  │ • Docker req │  │ • Auto TLS   │  │ • 200GB b/w  │              │
│  │              │  │ • Backups    │  │ • Daily bkup │              │
│  │ [Clone Repo] │  │ [Get Start]  │  │ [Get Start]  │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                     │
│                     ┌──────────────┐                                │
│                     │ Managed Team │                                │
│                     │ $99/mo       │                                │
│                     │ Multi-workspace, 100GB, SSO                   │
│                     │ [Contact Us] │                                │
│                     └──────────────┘                                │
└─────────────────────────────────────────────────────────────────────┘
```

**User decision:** Pick Managed ($19), Pro ($49), or Team ($99).
**User effort:** Read pricing, click one button.

---

#### Step 3: Create Account (1 min)
**Same as Method 2** — GitHub OAuth or email/password.

---

#### Step 4: Choose Workspace Subdomain (30 sec)
**What they see:**

```
┌─────────────────────────────────────────────────────┐
│  Choose your workspace URL                          │
│                                                     │
│  https:// [siinn-workspace] .agentunited.ai         │
│                                                     │
│  ✅ Available                                        │
│                                                     │
│  [Continue to Payment]                              │
└─────────────────────────────────────────────────────┘
```

**Why before payment:** User picks their URL before paying so they know exactly what they're getting. Reduces post-payment regret.

**User effort:** Type a subdomain name, click Continue.

---

#### Step 5: Payment via Stripe Checkout (1 min)
**Same flow as Method 2** — Stripe Checkout Session, different price ID.

```
┌─────────────────────────────────────────────────────┐
│  Agent United, Inc.                                 │
│                                                     │
│  Managed Starter ................. $19.00/mo        │
│  • Hosted workspace                                 │
│  • 5GB storage                                      │
│  • 50GB bandwidth/month                             │
│  • Daily backups                                    │
│  • Auto-updates                                     │
│                                                     │
│  Card number  [4242 4242 4242 4242]                 │
│  Expiry       [12/27]  CVC [123]                    │
│                                                     │
│  [Subscribe — $19.00/month]                         │
└─────────────────────────────────────────────────────┘
```

**User effort:** Enter card, click Subscribe.

---

#### Step 6: Workspace Provisioned (wait ~15 sec — automatic)
**What they see:**

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  🔄 Setting up your workspace...                    │
│                                                     │
│  ✅ Creating database                                │
│  ✅ Deploying server                                 │
│  ✅ Configuring DNS                                  │
│  🔄 Running first-time setup...                     │
│                                                     │
│  This takes about 15 seconds.                       │
└─────────────────────────────────────────────────────┘
```

**What happens on our side (triggered by `checkout.session.completed` webhook):**
1. Create PostgreSQL database for workspace
2. Run migrations
3. Deploy API container (Cloud Run revision)
4. Configure DNS (subdomain → container)
5. Run bootstrap: create owner user, default #general channel, first agent, API key
6. Generate invite link for owner
7. Mark workspace as `ready`

**User effort:** Wait 15 seconds. Zero action required.

---

#### Step 7: Workspace Ready — Instant Access (0 effort)
**What they see:**

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ✅ Your workspace is ready!                         │
│                                                     │
│  Workspace URL:                                     │
│  https://siinn-workspace.agentunited.ai             │
│                                                     │
│  A default agent is already running and waiting     │
│  for you in #general.                               │
│                                                     │
│  [Open Workspace — Start Chatting]                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**No API key shown here.** The bootstrap agent is already connected. The user's first experience is **chatting**, not configuring. API keys are available later in Dashboard → Settings when the user is ready to connect their own agents.

**User effort:** Click one button.

---

#### Step 8: First Message (30 sec)
**What they do:**
- Click "Open Workspace" → lands in the web chat UI at `https://siinn-workspace.agentunited.ai`
- Already logged in (session from account creation)
- See #general channel with a welcome message from the bootstrap agent:

> "👋 Welcome to your Agent United workspace! I'm your default agent. You can chat with me here, or connect your own agents from the Dashboard. What would you like to build?"

- User types a message. Done. They're using the product.

**User effort:** Click a link, type a message. That's it.

**API key access (when ready):** Dashboard → Settings → API Keys. The key was generated during provisioning and is available whenever the user needs it. But the first experience is chat, not configuration.

---

### Method 3 Total User Journey

| Step | Action | Time | Human Effort |
|------|--------|------|-------------|
| 1 | Visit agentunited.ai | 0 min | Passive |
| 2 | Pick plan | 1 min | Read + click |
| 3 | Create account (GitHub OAuth) | 1 min | Click + authorize |
| 4 | Choose subdomain | 30 sec | Type name |
| 5 | Pay via Stripe Checkout | 1 min | Enter card + click |
| 6 | Wait for provisioning | 15 sec | **Zero — automatic** |
| 7 | Click "Open Workspace" | 0 sec | One click |
| 8 | Send first message | 30 sec | Type + send |
| **Total** | | **~4 min** | **Minimal — entirely web-based** |

**Key insight:** No terminal, no copy-paste, no configuration. Sign up → pay → chat. A non-technical founder could do this in under 5 minutes.

---

## 3. Payment Architecture (Stripe)

### 3.1 Stripe Products & Prices

Set up in Stripe Dashboard (or via API):

```
Product: "Agent United Tunnel"
├── Price: relay_monthly      → $9/mo   (recurring)
└── Price: relay_pro_monthly  → $29/mo  (recurring)

Product: "Agent United Managed"
├── Price: managed_starter_monthly → $19/mo  (recurring)
├── Price: managed_pro_monthly     → $49/mo  (recurring)
└── Price: managed_team_monthly    → $99/mo  (recurring)
```

All prices are **flat-rate recurring** for v1. Usage-based metering (bandwidth overages) comes later.

### 3.2 Core Stripe Integration

#### Objects We Use

| Stripe Object | Our Use |
|---------------|---------|
| **Customer** | 1:1 with our user account. Created on first purchase. |
| **Checkout Session** | Handles the payment page. We never touch card numbers. |
| **Subscription** | Tracks recurring billing. One per workspace. |
| **Invoice** | Auto-generated by Stripe for each billing cycle. |
| **Payment Method** | Card on file. Managed by Stripe. |
| **Customer Portal** | Stripe-hosted page for users to update payment, cancel, view invoices. |
| **Webhook** | Stripe pushes events to us. This is the backbone. |

#### API Calls We Make

```
1. stripe.checkout.sessions.create()   — Start payment flow
2. stripe.billingPortal.sessions.create() — "Manage Subscription" link
3. stripe.subscriptions.retrieve()      — Check status
4. stripe.subscriptions.update()        — Upgrade/downgrade
```

That's it. Four API calls. Stripe handles everything else.

### 3.3 Webhook Events We Handle

This is the critical integration. Our backend listens at `POST /webhooks/stripe` for:

| Event | What We Do |
|-------|------------|
| `checkout.session.completed` | **Primary trigger.** Create/activate workspace. Generate relay token (M2) or provision infra (M3). |
| `invoice.paid` | Confirm ongoing subscription is healthy. Update `subscription_status = "active"`. |
| `invoice.payment_failed` | Grace period starts. Email user. Mark `subscription_status = "past_due"`. |
| `customer.subscription.updated` | Plan change (upgrade/downgrade). Adjust limits (bandwidth, storage). |
| `customer.subscription.deleted` | Subscription cancelled. Start 7-day grace → then disable relay/workspace. |

### 3.4 Payment Flow: Sequence Diagram

```
User            Our Backend         Stripe              Our Dashboard DB
 │                  │                  │                       │
 │  Click "Get      │                  │                       │
 │  Started"        │                  │                       │
 │─────────────────▶│                  │                       │
 │                  │                  │                       │
 │                  │  checkout.       │                       │
 │                  │  sessions.       │                       │
 │                  │  create()        │                       │
 │                  │─────────────────▶│                       │
 │                  │                  │                       │
 │                  │  checkout_url    │                       │
 │                  │◀─────────────────│                       │
 │                  │                  │                       │
 │  Redirect to     │                  │                       │
 │  Stripe Checkout │                  │                       │
 │◀─────────────────│                  │                       │
 │                  │                  │                       │
 │  Enter card,     │                  │                       │
 │  click Subscribe │                  │                       │
 │─────────────────────────────────────▶                       │
 │                  │                  │                       │
 │                  │  webhook:        │                       │
 │                  │  checkout.       │                       │
 │                  │  session.        │                       │
 │                  │  completed       │                       │
 │                  │◀─────────────────│                       │
 │                  │                  │                       │
 │                  │  [Method 2]: Generate relay token         │
 │                  │  [Method 3]: Provision workspace          │
 │                  │─────────────────────────────────────────▶│
 │                  │                  │                       │
 │  Redirect to     │                  │                       │
 │  success page    │                  │                       │
 │◀─────────────────│                  │                       │
 │                  │                  │                       │
 │  See token (M2)  │                  │                       │
 │  or workspace    │                  │                       │
 │  ready (M3)      │                  │                       │
```

### 3.5 What Happens When Payment Fails

#### Initial Payment Fails (during Checkout)
- Stripe shows error on Checkout page ("Card declined")
- User tries again or uses different card
- **We do nothing.** Stripe handles retry UX.
- No workspace/token created until payment succeeds.

#### Renewal Payment Fails (ongoing subscription)

**Timeline:**

| Day | Event | Action |
|-----|-------|--------|
| 0 | `invoice.payment_failed` | Email user: "Payment failed. Update your card." Mark `past_due`. |
| 0 | | **Service continues working.** Grace period starts. |
| 3 | Stripe auto-retries payment | If succeeds → back to `active`. If fails → another email. |
| 5 | Stripe auto-retries again | Same. |
| 7 | Third retry fails | Email: "Last warning. Service will be suspended in 3 days." |
| 10 | Grace period ends | **Method 2:** Relay token revoked. Tunnel disconnects. Local instance still works (just no external access). |
| | | **Method 3:** Workspace set to read-only. Users can view data + export, but can't send new messages. |
| 30 | No payment | **Method 2:** Subdomain released. Token permanently invalidated. |
| | | **Method 3:** Workspace archived. Data retained for 90 days, then deleted. User emailed at 60 and 80 days. |

**Key principle for Method 2:** Failing payment only kills the *tunnel*. The user's self-hosted instance keeps running perfectly. They lose external access, not their product.

**Key principle for Method 3:** We never delete data without ample warning. Read-only mode + 90-day retention gives users every chance to pay or export.

### 3.6 Upgrade / Downgrade

**User clicks "Change Plan" in dashboard:**

```
Current: Relay ($9/mo)
  ↓
Available upgrades:
  • Relay Pro ($29/mo) — custom subdomain, 100GB b/w
  • Managed Starter ($19/mo) — we run everything
  • Managed Pro ($49/mo) — custom domain, more storage
```

**Technical flow:**

**Upgrade (same method, higher tier):**
- `stripe.subscriptions.update(sub_id, { price: new_price_id })`
- Stripe prorates automatically (charges difference for remaining period)
- Webhook `customer.subscription.updated` → we adjust limits
- Immediate effect

**Downgrade (same method, lower tier):**
- `stripe.subscriptions.update(sub_id, { price: new_price_id, proration_behavior: "none" })`
- Takes effect at next billing cycle
- User keeps current tier until then

**Cross-method migration (Tunnel → Managed or vice versa):**
- This is a **data migration**, not just a plan change
- User clicks "Switch to Managed" → triggers export from self-hosted, import to managed
- Cancel old subscription, create new one
- More complex — requires the export/import API from deployment-methods-design.md §11

### 3.7 Stripe Customer Portal

For everything billing-related after initial purchase, we use **Stripe Customer Portal** — a hosted page where users can:
- Update credit card
- View invoices / download receipts
- Cancel subscription
- Switch plans (if configured)

**Our dashboard has a "Manage Billing" button:**
```python
portal_session = stripe.billing_portal.Session.create(
    customer=stripe_customer_id,
    return_url="https://agentunited.ai/dashboard"
)
# Redirect user to portal_session.url
```

**Why Stripe Portal instead of building our own:** Zero billing UI to build. Zero PCI concerns. Stripe handles everything. We focus on the product.

---

## 4. Dashboard Pages Required

### 4.1 Page Inventory

We need a dashboard web app at `agentunited.ai/dashboard`. Here's every page:

| # | Page | Method 2 | Method 3 | Purpose |
|---|------|----------|----------|---------|
| 1 | `/signup` | ✅ | ✅ | Account creation (GitHub OAuth + email) |
| 2 | `/login` | ✅ | ✅ | Sign in |
| 3 | `/tunnel` | ✅ | — | Tunnel pricing / landing |
| 4 | `/managed` | — | ✅ | Managed pricing / landing |
| 5 | `/dashboard` | ✅ | ✅ | Home — overview of account + workspace(s) |
| 6 | `/dashboard/tunnel/setup` | ✅ | — | Post-payment: show relay token + setup instructions |
| 7 | `/dashboard/workspace/setup` | — | ✅ | Post-payment: provisioning progress + onboarding |
| 8 | `/dashboard/tunnel` | ✅ | — | Tunnel status: connected/disconnected, subdomain, bandwidth usage |
| 9 | `/dashboard/workspace` | — | ✅ | Workspace status: URL, storage used, uptime |
| 10 | `/dashboard/billing` | ✅ | ✅ | Redirect to Stripe Customer Portal |
| 11 | `/dashboard/settings` | ✅ | ✅ | Account settings (email, password, API keys) |
| 12 | `/dashboard/usage` | ✅ | ✅ | Bandwidth + storage usage charts |

**Total: 12 pages.** Many are shared between methods. This is not a huge app — could be a focused Next.js project.

### 4.2 Dashboard Tech Stack

**Recommendation:** Separate Next.js app at `agentunited.ai`

Why separate from the product UI:
- Different auth system (dashboard auth vs. workspace auth)
- Different audience (account management vs. chat)
- Can deploy independently
- Marketing pages (landing, pricing) live on same domain

**Stack:**
- Next.js 14 (App Router)
- Tailwind CSS (same design system as product)
- NextAuth.js (GitHub OAuth + credentials)
- Stripe SDK (server-side for checkout + portal)
- PostgreSQL (dashboard DB — separate from workspace DBs)

### 4.3 Dashboard DB Schema

```sql
-- Dashboard database (NOT workspace databases)

CREATE TABLE users (
  id TEXT PRIMARY KEY,           -- usr_xxxxx
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,            -- null if GitHub-only auth
  github_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,           -- sub_xxxxx
  user_id TEXT REFERENCES users(id),
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT NOT NULL,
  plan TEXT NOT NULL,            -- 'relay', 'relay_pro', 'managed_starter', etc.
  method TEXT NOT NULL,          -- 'tunnel' or 'managed'
  status TEXT NOT NULL,          -- 'active', 'past_due', 'cancelled', 'suspended'
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE relay_tokens (
  id TEXT PRIMARY KEY,           -- rtk_xxxxx
  subscription_id TEXT REFERENCES subscriptions(id),
  token_hash TEXT NOT NULL,      -- bcrypt hash of rt_xxx token
  subdomain TEXT UNIQUE NOT NULL,
  custom_subdomain TEXT,         -- null unless Relay Pro
  status TEXT NOT NULL,          -- 'active', 'revoked'
  last_connected_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE managed_workspaces (
  id TEXT PRIMARY KEY,           -- ws_xxxxx
  subscription_id TEXT REFERENCES subscriptions(id),
  subdomain TEXT UNIQUE NOT NULL,
  custom_domain TEXT,            -- null unless Managed Pro
  db_name TEXT NOT NULL,         -- PostgreSQL database name
  container_url TEXT,            -- Cloud Run URL
  status TEXT NOT NULL,          -- 'provisioning', 'active', 'read_only', 'archived'
  storage_bytes BIGINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE usage_records (
  id SERIAL PRIMARY KEY,
  subscription_id TEXT REFERENCES subscriptions(id),
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  bandwidth_bytes BIGINT DEFAULT 0,
  request_count BIGINT DEFAULT 0,
  storage_bytes BIGINT DEFAULT 0
);
```

---

## 5. User Effort Comparison

### 5.1 Side-by-Side

| Dimension | Method 2 (Tunnel) | Method 3 (Managed) |
|-----------|-------------------|---------------------|
| **Total time (new user)** | ~3 min | ~4 min |
| **Terminal required?** | No (agent handles it) | No |
| **Docker required?** | Yes (pre-existing) | No |
| **Technical skill needed** | Can click buttons | Can click buttons |
| **Screens in journey** | 3 web screens | 5 web screens |
| **Decisions to make** | 1 (plan) | 2 (plan + subdomain) |
| **Things to copy-paste** | 0 | 0 |
| **Manual config steps** | 0 (agent auto-provisions) | 0 (cloud auto-provisions) |
| **Payment friction** | Same (Stripe Checkout) | Same (Stripe Checkout) |
| **Time to external access** | ~15 sec after payment | ~15 sec after payment |
| **Can start WITHOUT paying?** | Yes (self-hosted works free) | No (infra costs money) |
| **What payment unlocks** | External access only | Entire product |
| **One-time prerequisite** | Instance pairing (~30 sec) | None |

### 5.2 Where Users Drop Off (Risk Points)

**Method 2:**
- ⚠️ **Instance pairing (one-time)** — User must link their local instance to their cloud account before purchasing. Mitigation: auto-detect on same machine (localhost check), or simple 6-digit code.
- ⚠️ **Requires pre-existing self-hosted setup** — User must already have Agent United running. This is a two-stage funnel. But that's by design — tunnel users are power users upgrading.

**Method 3:**
- ⚠️ **Step 5 (Payment)** — Asking for credit card before they've used the product. Mitigation: offer 14-day free trial (Stripe supports trial periods on subscriptions).
- ⚠️ **Step 4 (Subdomain choice)** — Naming things is hard. Mitigation: auto-suggest based on GitHub username.

### 5.3 Engineering Effort to Build

| Component | Estimated Effort | Shared? |
|-----------|-----------------|---------|
| Dashboard app (Next.js, 12 pages) | 2-3 weeks | Yes (both methods) |
| Stripe integration (checkout + webhooks + portal) | 1 week | Yes |
| Relay server (Go) | 2 weeks | Method 2 only |
| Relay client (embedded in API server) | 3 days | Method 2 only |
| Workspace provisioning service | 2-3 weeks | Method 3 only |
| DNS automation (wildcard + per-workspace) | 3 days | Both (different domains) |
| Usage metering (bandwidth + storage tracking) | 1 week | Both |
| **Total for Method 2 only** | **~5-6 weeks** | |
| **Total for Method 3 only** | **~6-8 weeks** | |
| **Total for both (shared work)** | **~8-10 weeks** | |

### 5.4 Recommendation: Build Order

1. **Dashboard + Stripe first** (shared) — 3 weeks
2. **Method 2 (Tunnel)** next — 3 more weeks. Lower infra complexity, builds on self-hosted momentum.
3. **Method 3 (Managed)** last — 4 more weeks. Requires workspace provisioning, multi-tenancy, and scale-to-zero — the hard stuff.

Ship Method 2 first because:
- Self-hosted users are our first adopters (already have the product running)
- Tunnel is the lowest-friction paid upgrade for them
- Revenue starts sooner
- Buys time to build managed service properly

---

## Appendix: Free Trial Option

**Should we offer a free trial for Method 3?**

**Stripe supports it natively:**
```python
stripe.checkout.sessions.create(
    mode="subscription",
    subscription_data={
        "trial_period_days": 14
    },
    # ... rest of params
)
```

**User journey with trial:**
- Steps 1-4: Same
- Step 5: Stripe Checkout shows "$0.00 today, then $19/mo after 14 days"
- Card still required (converts automatically)
- User can cancel before trial ends

**Pros:** Removes payment friction at the decision point. User tries before committing.
**Cons:** Attracts tire-kickers. Provisioning costs for non-converting users.

**Recommendation:** Launch WITHOUT trial for Method 3. Add trial after we have enough data on conversion rates. For now, the value prop should be strong enough that $19/mo is a no-brainer for anyone who needs managed hosting.

---

*End of document. Ready for Siinn's review.*
