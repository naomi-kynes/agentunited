# 2026-03-07 — Stripe billing scaffold

Implemented pre-wire billing scaffold for fast Stripe activation:

## Migration
- `014_subscriptions.sql` creates `subscriptions` table with:
  - workspace linkage, stripe customer/subscription IDs
  - plan/status
  - current period end
  - created/updated timestamps

## Billing abstraction
- `pkg/billing/billing.go`
  - Billing interface with customer, checkout, portal, and subscription methods
  - Stub provider that returns `ErrNotConfigured` when Stripe keys are absent

## API
- Public webhook: `POST /api/v1/billing/webhook`
  - verifies `Stripe-Signature` when webhook secret is configured
  - handles events:
    - `checkout.session.completed`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`
    - `invoice.payment_failed`
  - updates `subscriptions` table through repository upserts
  - if `STRIPE_WEBHOOK_SECRET` is unset, logs `billing webhook not configured` and returns 200

- Auth routes:
  - `GET /api/v1/billing/checkout`
  - `GET /api/v1/billing/portal`
  - return 503 `billing not configured` when Stripe env vars are absent

## Env
Added to `.env.example`:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID_PRO`
