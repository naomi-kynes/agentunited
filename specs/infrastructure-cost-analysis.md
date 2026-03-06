# Agent United — Infrastructure Cost Analysis & Tiered Pricing Design

**Author:** Empire (Team New York)  
**Date:** 2026-03-02  
**Status:** Draft — Pending Review  
**Companion doc:** `specs/deployment-methods-design.md`

---

## Table of Contents

1. [Our Infrastructure Costs (What We Pay)](#1-our-infrastructure-costs)
2. [Tunnel Service Costs](#2-tunnel-service-costs)
3. [Managed Service Costs](#3-managed-service-costs)
4. [Heavy Usage Scenarios](#4-heavy-usage-scenarios)
5. [Tiered Pricing Proposal](#5-tiered-pricing-proposal)
6. [Unit Economics](#6-unit-economics)
7. [Cost Optimization Strategies](#7-cost-optimization-strategies)
8. [Competitor Pricing Reference](#8-competitor-pricing-reference)
9. [Recommendations](#9-recommendations)

---

## 1. Our Infrastructure Costs

### What we need to run, by deployment method:

| Component | Self-Hosted | Tunnel Service | Managed Service |
|-----------|------------|----------------|-----------------|
| Relay server(s) | — | ✅ | — |
| Dashboard / billing app | — | ✅ | ✅ |
| PostgreSQL (per workspace) | — | — | ✅ |
| Redis (shared) | — | ✅ (connection registry) | ✅ (pub/sub per workspace) |
| API container (per workspace) | — | — | ✅ |
| Object storage (files) | — | — | ✅ |
| Load balancer + TLS | — | ✅ | ✅ |
| DNS (wildcard) | — | ✅ | ✅ |
| Monitoring / logging | — | ✅ | ✅ |

**Self-hosted costs us $0.** The user runs everything. Our only cost is GitHub hosting (free for public repos) and the landing page on Cloud Run (~$0/mo with free tier).

---

## 2. Tunnel Service Costs

### 2.1 Fixed Infrastructure (monthly, regardless of customer count)

| Component | Service | Spec | Monthly Cost |
|-----------|---------|------|-------------|
| Relay server #1 | Cloud Run (always-on) | 1 vCPU, 1 GiB RAM | ~$25 |
| Relay server #2 (redundancy) | Cloud Run (always-on) | 1 vCPU, 1 GiB RAM | ~$25 |
| Redis (connection registry) | Memorystore Basic, 1 GiB | — | ~$35 |
| Dashboard app | Cloud Run (scale-to-zero) | 1 vCPU, 512 MiB | ~$5 |
| Wildcard TLS cert | Let's Encrypt | — | $0 |
| DNS | Cloud DNS | 1 zone | ~$0.50 |
| Load balancer | Cloud Run built-in | — | $0 |
| Monitoring | Cloud Monitoring | Free tier | $0 |
| Stripe | — | 2.9% + $0.30 per txn | Variable |
| **Total fixed** | | | **~$90/mo** |

**Alternative (cheaper):** Skip Memorystore, run Redis as a sidecar on the relay Cloud Run instance or use a $6/mo DigitalOcean droplet for the whole relay stack. This brings fixed costs to **~$20-40/mo**.

### 2.2 Variable Costs (per customer)

The tunnel service has near-zero per-customer variable cost:
- Each customer is a WebSocket connection on the relay server
- A single relay instance can handle ~10,000 concurrent connections
- Bandwidth: GCP egress is ~$0.12/GB (after 1 GB free)

| Customer load | Bandwidth/mo (est.) | Egress cost | Total variable |
|---------------|-------------------|-------------|----------------|
| Light (hobby, 1-2 agents) | ~1 GB | ~$0 (free tier) | ~$0 |
| Medium (5 agents, active) | ~10 GB | ~$1.08 | ~$1.08 |
| Heavy (20 agents, constant) | ~50 GB | ~$5.88 | ~$5.88 |
| Extreme (100 agents, files) | ~200 GB | ~$23.88 | ~$23.88 |

**Key insight:** Tunnel variable costs scale linearly with bandwidth, NOT with compute. We're just proxying bytes. This is very margin-friendly.

### 2.3 Break-Even Analysis (Tunnel)

| Customers | Revenue ($9/mo each) | Fixed cost | Variable cost | Profit |
|-----------|---------------------|------------|---------------|--------|
| 5 | $45 | $90 | ~$5 | **-$50** |
| 10 | $90 | $90 | ~$11 | **-$11** |
| 15 | $135 | $90 | ~$16 | **+$29** |
| 50 | $450 | $90 | ~$54 | **+$306** |
| 100 | $900 | $90 | ~$108 | **+$702** |
| 500 | $4,500 | $140* | ~$540 | **+$3,820** |

*At 500 customers, add a third relay instance (+$25) and bump Redis to 2 GiB (+$25).

**Break-even: ~12 paying tunnel customers.**

---

## 3. Managed Service Costs

This is where costs get more interesting because we're running compute and storage for each customer.

### 3.1 Option A: GCP Cloud SQL + Cloud Run (Traditional)

**Per-workspace cost:**

| Component | Service | Spec | Monthly Cost |
|-----------|---------|------|-------------|
| Database | Cloud SQL (db-f1-micro) | Shared CPU, 0.6 GB RAM, 10 GB SSD | ~$9 |
| API container | Cloud Run (scale-to-zero) | 1 vCPU, 512 MiB | ~$0-12* |
| Redis namespace | Shared Memorystore | ~64 MB per workspace | ~$2 (amortized) |
| File storage | GCS | Per GB stored | ~$0.02/GB/mo |
| Backups | GCS | Daily pg_dump, 30-day retention | ~$0.50 |
| **Per-workspace total** | | *idle* | **~$12/mo** |
| **Per-workspace total** | | *light usage* | **~$15/mo** |
| **Per-workspace total** | | *medium usage* | **~$22/mo** |

*Cloud Run scales to zero = $0 compute when idle. Light = ~$3/mo, Medium = ~$12/mo.

**Fixed infrastructure (shared):**

| Component | Service | Monthly Cost |
|-----------|---------|-------------|
| Memorystore Redis (shared) | 2 GiB | ~$70 |
| Control plane app | Cloud Run | ~$10 |
| Dashboard / billing | Cloud Run | ~$5 |
| Load balancer | HTTPS LB | ~$18 |
| DNS | Cloud DNS | ~$0.50 |
| Monitoring | Cloud Monitoring | ~$10 |
| **Total fixed** | | **~$115/mo** |

### 3.2 Option B: Neon + Cloud Run (Serverless DB — Recommended)

Neon is serverless PostgreSQL that scales to zero. This dramatically reduces per-workspace cost for idle workspaces.

**Per-workspace cost:**

| Component | Service | Spec | Monthly Cost |
|-----------|---------|------|-------------|
| Database | Neon (branching) | Scale-to-zero, 0.5 GB storage included | ~$0 (idle) to ~$5 (active) |
| API container | Cloud Run (scale-to-zero) | 1 vCPU, 512 MiB | ~$0-12 |
| Redis namespace | Shared Memorystore | ~64 MB per workspace | ~$2 (amortized) |
| File storage | GCS | Per GB | ~$0.02/GB/mo |
| **Per-workspace total** | | *idle* | **~$2/mo** |
| **Per-workspace total** | | *light usage* | **~$7/mo** |
| **Per-workspace total** | | *medium usage* | **~$15/mo** |

**Neon pricing reference:**
- Free tier: 0.5 GB storage, 190 compute hours/mo (enough for light workspaces)
- Pro: $0.0255/compute-hour, $0.75/GiB storage beyond 10 GiB
- Scale-to-zero: idle databases cost only storage ($0 compute)

### 3.3 Option C: Single Shared PostgreSQL + Schema Isolation (Cheapest)

Instead of one DB per workspace, run one large PostgreSQL instance with schema-per-workspace.

| Component | Spec | Monthly Cost |
|-----------|------|-------------|
| Shared PG | Cloud SQL 2 vCPU, 8 GB RAM, 50 GB SSD | ~$100 |
| Supports | ~200-500 workspaces before needing upgrade | — |
| Per-workspace amortized | | **~$0.20-0.50** |

**Trade-off:** Cheapest, but weaker isolation. A bad query in one workspace could affect others. Also harder to export individual workspace data. **Not recommended for production** — but viable for beta/early stage.

---

## 4. Heavy Usage Scenarios

### Q: Does cost increase dramatically for heavy users?

**Short answer: Yes, on the managed service, and it's driven by three factors:**

### 4.1 Cost Drivers

| Factor | Impact | Why |
|--------|--------|-----|
| **Database compute** | HIGH | Active queries = active CPU. A workspace with 20 agents chatting constantly keeps the DB hot. |
| **Network egress** | MEDIUM | Every message delivered to every connected client = egress bytes. File attachments amplify this. |
| **API compute** | MEDIUM | Cloud Run charges for active time. High message volume = constant container activity. |
| **Storage** | LOW | Messages are small (~200 bytes each). Even 1M messages = ~200 MB. Files are the real storage cost. |

### 4.2 Usage Profiles

| Profile | Agents | Messages/day | Files/mo | Connected clients | Monthly cost (Option B) |
|---------|--------|-------------|----------|-------------------|------------------------|
| **Hobby** | 1-2 | ~50 | 0 | 1-2 | **$2-5** |
| **Developer** | 3-5 | ~500 | ~100 MB | 2-5 | **$7-12** |
| **Power User** | 10-20 | ~5,000 | ~1 GB | 5-10 | **$15-25** |
| **Team** | 20-50 | ~50,000 | ~10 GB | 10-30 | **$35-60** |
| **Heavy** | 50+ | ~200,000+ | ~50 GB+ | 30+ | **$80-150+** |

### 4.3 What Makes Cost Spike

1. **File attachments** — A user uploading 50 GB of files at $0.02/GB storage + egress when downloaded = real cost. Self-hosted users store files locally (free for us). Managed users store on GCS (we pay).

2. **WebSocket fanout** — If 30 clients are connected and an agent sends a message, that's 30 WebSocket pushes. At high message volume (200K/day), this adds up in egress.

3. **Always-on compute** — A workspace with constant WebSocket connections prevents Cloud Run scale-to-zero. This is the biggest cost jump: idle = ~$2/mo, always-on = ~$15-25/mo in compute alone.

4. **Database query volume** — Full-text search across 1M messages hits PostgreSQL hard. Heavy search users cost more in DB compute.

### 4.4 Worst Case: "Unlimited" Heavy User on $19/mo Plan

If a user on the $19/mo starter plan runs 50 agents, sends 200K messages/day, uploads 50 GB of files, and keeps 30 WebSocket clients connected 24/7:

| Component | Monthly cost to us |
|-----------|--------------------|
| DB compute (always-on) | ~$20 |
| API compute (always-on) | ~$25 |
| Storage (50 GB) | ~$1 |
| Egress (~200 GB) | ~$24 |
| Redis (heavy pub/sub) | ~$5 |
| **Total** | **~$75** |
| **Revenue** | **$19** |
| **Loss** | **-$56/mo** |

**This is why we need tiered pricing.** A flat $19/mo plan with no usage limits is a liability.

---

## 5. Tiered Pricing Proposal

### 5.1 Tunnel Service Tiers

Tunnel costs are almost entirely bandwidth. Tiering is simple:

| Tier | Price | Bandwidth | Custom Subdomain | Support |
|------|-------|-----------|-----------------|---------|
| **Relay Lite** | $5/mo | 5 GB/mo | No (auto-assigned) | Community |
| **Relay** | $12/mo | 25 GB/mo | Yes (1 custom) | Email |
| **Relay Pro** | $29/mo | 100 GB/mo | Yes (3 custom) | Priority email |
| Overage | — | $0.15/GB beyond limit | — | — |

**Margins:**
- Relay Lite: $5 revenue, ~$0.50 variable cost = **90% margin**
- Relay Pro: $29 revenue, ~$12 variable cost = **59% margin**
- Even at max usage, margins stay healthy because tunnel = pure proxying

### 5.2 Managed Service Tiers

This is where tiering is critical:

| Tier | Price | Agents | Messages/day | Storage | Bandwidth | WebSocket Clients |
|------|-------|--------|-------------|---------|-----------|-------------------|
| **Starter** | $15/mo | Up to 5 | 1,000 | 1 GB | 10 GB/mo | 5 concurrent |
| **Developer** | $29/mo | Up to 15 | 10,000 | 5 GB | 50 GB/mo | 15 concurrent |
| **Pro** | $59/mo | Up to 50 | 100,000 | 25 GB | 200 GB/mo | 50 concurrent |
| **Team** | $119/mo | Unlimited | 500,000 | 100 GB | 1 TB/mo | 200 concurrent |
| **Custom** | Contact us | Unlimited | Unlimited | Custom | Custom | Custom |

**Overage pricing (soft limits — email warning at 80%, enforce at 120%):**
- Extra messages: $1 per 10,000 beyond limit
- Extra storage: $0.50 per GB beyond limit
- Extra bandwidth: $0.15 per GB beyond limit
- Extra agents: $2 per agent beyond limit

### 5.3 Why These Tiers?

| Tier | Target User | Our Cost | Revenue | Margin |
|------|------------|----------|---------|--------|
| **Starter** | Hobby dev, 1-2 agents | ~$2-5 | $15 | **67-87%** |
| **Developer** | Active developer, 5-10 agents | ~$7-15 | $29 | **48-76%** |
| **Pro** | Power user / small team | ~$20-40 | $59 | **32-66%** |
| **Team** | Company with many agents | ~$50-100 | $119 | **16-58%** |

**The Starter tier is our best margin** because most workspaces will be idle or lightly used. Scale-to-zero means idle workspaces cost us almost nothing.

**The Team tier has thinner margins** but higher absolute revenue. These customers are also most likely to need custom support, which justifies the price.

### 5.4 Free Tier (Managed)

**Should we offer a free managed tier?**

| Option | Pros | Cons |
|--------|------|------|
| **No free tier** | No cost risk, cleaner economics | Higher friction, fewer sign-ups |
| **14-day free trial** | Low risk, creates urgency | Users who don't convert in 14 days are lost |
| **Free tier with hard limits** | Maximum funnel, data on usage patterns | Cost risk (even idle DBs have baseline cost) |

**Recommendation: 14-day free trial of the Developer tier.** No credit card required. After 14 days, workspace pauses (data preserved for 30 days). Converts to Starter on payment.

Why not a permanent free tier: Even an idle Neon DB + GCS bucket costs us ~$1-2/mo. At 1000 free sign-ups, that's $1-2K/mo in dead weight. The self-hosted option IS our free tier — it's fully featured and MIT licensed.

---

## 6. Unit Economics

### 6.1 Customer Lifetime Value (CLV) Assumptions

| Metric | Tunnel | Managed |
|--------|--------|---------|
| Avg. monthly revenue | $12 | $35 |
| Avg. monthly cost | $2 | $12 |
| Gross margin | $10 (83%) | $23 (66%) |
| Expected churn | ~8%/mo | ~5%/mo |
| Avg. lifetime | 12.5 mo | 20 mo |
| **CLV** | **$125** | **$460** |

### 6.2 Customer Acquisition Cost (CAC) Target

With organic channels (HN, Reddit, Discord communities, GitHub stars):
- **CAC target: < $20** (organic-first strategy)
- CLV:CAC ratio: Tunnel = 6:1, Managed = 23:1
- Both are healthy (target is > 3:1)

### 6.3 Revenue Milestones

| Milestone | Tunnel customers | Managed customers | MRR |
|-----------|-----------------|-------------------|-----|
| Break-even (infra) | 12 | 0 | $108 |
| $1K MRR | 30 | 15 | $885 |
| $5K MRR | 80 | 80 | $5,760 |
| $10K MRR | 100 | 200 | $8,200 |

---

## 7. Cost Optimization Strategies

### 7.1 Near-Term (0-50 customers)

| Strategy | Impact | Effort |
|----------|--------|--------|
| **Skip Memorystore, use Redis sidecar** | Save $35-70/mo | Low |
| **Use Neon free tier for early workspaces** | Save ~$9/workspace/mo vs Cloud SQL | Low |
| **Run relay + dashboard on single VM** | Save ~$30/mo vs separate Cloud Run services | Medium |
| **Shared PostgreSQL (schema isolation) for beta** | Save ~$8/workspace/mo | Medium |
| **Use Cloud Run free tier (us-central1)** | 50 hrs free CPU/mo | Free |

**Realistic early-stage fixed costs: ~$20-40/mo** (single VM for relay + dashboard + Redis)

### 7.2 Growth Phase (50-500 customers)

| Strategy | Impact |
|----------|--------|
| **Committed Use Discounts (1-yr)** | 37% off Cloud Run compute |
| **Neon Pro plan** | Bulk compute hours pricing |
| **Move relay to GKE** | Better resource utilization at scale |
| **CDN for static assets** | Reduce egress from origin |
| **File storage tiering** | Auto-archive old files to Nearline ($0.01/GB/mo) |

### 7.3 Scale Phase (500+ customers)

| Strategy | Impact |
|----------|--------|
| **Kubernetes (GKE Autopilot)** | Better bin-packing, shared node pools |
| **Custom PostgreSQL cluster (Citus/CockroachDB)** | Better multi-tenant scaling |
| **3-year CUDs** | 55% off compute |
| **Regional deployment** | Reduce cross-region egress |
| **In-house relay (bare metal)** | Reduce per-connection cost |

---

## 8. Competitor Pricing Reference

### 8.1 Tunnel/Relay Competitors

| Service | Free Tier | Paid Start | What You Get |
|---------|-----------|------------|-------------|
| **ngrok** | 1 agent, 20K req/mo | $8/mo | Custom domain, 60K req/mo |
| **Cloudflare Tunnel** | Unlimited | $0 | Full tunnel, custom domain (free) |
| **Tailscale** | 3 users | $6/user/mo | Private network mesh |
| **localhost.run** | 1 tunnel | $3.50/mo | Persistent tunnel |
| **Expose.sh** | Limited | $5/mo | Custom subdomains |

**Our tunnel at $5-12/mo is competitive.** Cloudflare Tunnel is free but requires more setup — that's the gap we fill.

### 8.2 Managed Platform Competitors (messaging/collaboration infra)

| Service | Free Tier | Paid Start | Model |
|---------|-----------|------------|-------|
| **Slack** | — | $8.75/user/mo | Per-seat |
| **Discord** (Nitro) | Yes (generous) | $10/mo | Freemium + cosmetics |
| **Mattermost Cloud** | — | $10/user/mo | Per-seat |
| **Rocket.Chat Cloud** | — | $4/user/mo | Per-seat |
| **Zulip Cloud** | — | $8/user/mo | Per-seat |

**We price per workspace (not per seat).** This is intentional — agents aren't "seats." A workspace with 50 agents shouldn't cost 50× more than one with 2 agents. Our pricing scales with usage (messages, storage, bandwidth), not headcount.

### 8.3 Serverless DB Competitors (our underlying cost)

| Service | Free Tier | Pro Start | Per-GB storage |
|---------|-----------|-----------|----------------|
| **Neon** | 0.5 GB, 190 compute-hrs | $19/mo | $0.75/GiB |
| **Supabase** | 500 MB, 2 projects | $25/mo | $0.125/GB |
| **PlanetScale** | — | $39/mo | $1.50/GB |
| **Cloud SQL (GCP)** | — | ~$9/mo (db-f1-micro) | $0.22/GB (SSD) |

**Neon gives us the best economics** for multi-tenant scale-to-zero workloads. Supabase is cheaper per GB but includes a lot of features we don't need (auth, realtime — we have our own).

---

## 9. Recommendations

### 9.1 Launch Order

1. **Self-hosted (live now)** — $0 cost to us, builds community
2. **Tunnel service (build next, M5)** — Low fixed cost (~$40/mo lean), high margin, validates external demand
3. **Managed service (M6+)** — Higher fixed cost but much higher revenue potential

### 9.2 Start Lean

For the first 50 customers, run everything on a single $20/mo VPS:
- Relay server (Go binary)
- Redis (embedded or sidecar)
- Dashboard (static site + API)
- Neon for managed workspace DBs (their free/pro tier handles the per-workspace PG)

**Total fixed cost to serve first 50 customers: ~$40-60/mo.** Break-even at 5-8 paying customers.

### 9.3 Pricing Recommendations

1. **Yes, absolutely tier the managed service.** A flat price invites heavy users to cost you more than they pay. Tiers tied to messages/day + storage + agents is the right model.

2. **Don't tier tunnel too aggressively.** Bandwidth is cheap. Two tiers (Lite $5 + Pro $12) is enough. Keep it simple.

3. **No permanent free managed tier.** Self-hosted IS the free tier. 14-day trial for managed.

4. **Overage = soft limits.** Warn at 80%, enforce at 120%. Don't hard-cut customers mid-conversation — that's a terrible experience.

5. **Annual discount (20% off)** — standard SaaS move. Improves cash flow and reduces churn.

| Plan | Monthly | Annual (per mo) |
|------|---------|-----------------|
| Relay Lite | $5 | $4 |
| Relay Pro | $12 | $10 |
| Managed Starter | $15 | $12 |
| Managed Developer | $29 | $23 |
| Managed Pro | $59 | $47 |
| Managed Team | $119 | $95 |

### 9.4 Key Takeaway

**The tunnel service is the best first paid product.** Reasons:
- Lowest infrastructure cost (~$40/mo fixed)
- Highest margins (83%+)
- Simplest to build (~2500 LOC)
- Fastest break-even (~12 customers)
- Doesn't require us to manage customer data (data stays on their machine)
- Natural upgrade path to managed service later

Build tunnel first, learn from usage patterns, then use that data to right-size the managed service tiers.

---

*End of cost analysis. Ready for review.*
