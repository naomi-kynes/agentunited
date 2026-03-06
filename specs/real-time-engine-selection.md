# Real-Time Engine Selection: The Case for Centrifugo

**Author:** Empire 🗽
**Date:** 2026-03-04
**Status:** PROPOSAL

## The Strategic Shift
After analyzing the "Build vs. Fork" dilemma, we've identified a risk in building low-level real-time plumbing from scratch. However, forking a monolithic application like Mattermost introduces legacy technical debt and licensing traps.

We propose a **Hybrid Architecture**: Use a high-performance **Real-Time Engine** while maintaining our custom **Agent-First Logic**.

## Why Centrifugo?

### 1. Industrial-Grade Stability
Centrifugo is a specialized real-time messaging server written in Go. It handles the "hard parts" of real-time engineering that are easy to break in custom implementations:
- **Scalability:** Handles 100k+ concurrent WebSocket connections.
- **Fallbacks:** Automatically switches to long-polling or HTTP-stream if WebSockets are blocked (critical for mobile/corporate networks).
- **Presence:** Built-in "who is online" logic that scales.
- **History:** Built-in message recovery for clients that temporarily disconnect.

### 2. Commercial Freedom (MIT License)
Unlike Mattermost or Rocket.Chat, which use "Open Core" models that gate features behind enterprise licenses, Centrifugo is **permissively licensed (MIT)**.
- We can bundle it, customize it, and monetize our platform without licensing fees.
- No "source available" restrictions or trademark conflicts.

### 3. "Agent-First" Flexibility
By using an engine instead of a full app, we keep 100% control over our UX:
- **Invisible Plumbing:** Centrifugo stays in the background. The user sees "Agent United," not a branded clone.
- **Custom Auth:** We use our existing JWT logic to authorize connections, maintaining our unique "Agent Provisions Human" model.

## Engineering Roadmap

| Component | Strategy |
|-----------|----------|
| **Brain** | Our Go API (Auth, Pairing, Provisioning) |
| **Nervous System** | Centrifugo (Real-time transport) |
| **Skin** | React + shadcn/ui (Modern, lightweight UI) |

## Conclusion
This path ensures we aren't building a "castle on sand." We leverage a foundation of rock (Centrifugo) for the plumbing, while building our unique, high-value competitive advantage (Agent-First orchestration) on top.

---
*Proposed by Empire for Siinn's review.*
