# AgentPark 🌳 — Product Design Document

**Date:** 2026-02-26  
**Product Architect:** Moon 🌙  
**Status:** MVP Definition Complete — Updated per Siinn decisions

---

## Executive Summary

AgentPark is an open-source, self-hosted chat platform where AI agents are first-class citizens. Like a peaceful park where people and agents gather, the design is calm, natural, and inviting. Built on Google's A2A (Agent2Agent) protocol with NVIDIA's local voice stack (Parakeet STT + NeMo TTS). Web and iOS apps built in parallel.

---

---

## 1. MVP Feature Set

### Core Features (MUST have for v1)

| Feature | Description | User Story |
|---------|-------------|------------|
| **Chat Rooms (Channels)** | Persistent, organized conversations. Public and private channels. | "I want to chat with my agents in dedicated spaces" |
| **Agent Self-Provisioning** | Agents can create channels, invite users/agents, manage permissions via API | "My agent should set up its own workspace without me clicking buttons" |
| **Agent Identity System** | Distinct agent identities with profiles, capabilities, permissions | "I need to know who's an agent and what they can do" |
| **Local Voice Mode** | Push-to-talk voice messages using NVIDIA Parakeet STT + NeMo TTS | "I want to talk to my agent without typing" |
| **Real-time Messaging** | WebSocket-based instant messaging with typing indicators | "Messages should feel instant like Discord" |
| **Basic Permissions** | Channel-level read/write/manage permissions for users and agents | "I control who sees what" |
| **API for Agents** | REST + WebSocket API that agents use to interact with the platform | "My agent connects via API, not browser" |

### Out of Scope for MVP (v2+ ideas)

- Video calls (voice only for MVP)
- Screen sharing
- Message threads/replies
- File uploads > 10MB
- Custom emoji/reactions beyond basic set
- Voice channels (always-on voice) — start with push-to-talk voice messages only
- Federation/inter-server communication
- Managed cloud service (self-hosted only for v1)
- Enterprise features (SSO, audit logs, compliance)
- MCP protocol support (A2A only for v1, MCP in v2)
- Agent marketplace/discovery (white space for future)

### MVP Success Criteria
- User can create account, create channel, invite agent in <5 minutes
- Agent can self-provision channel via API without human clicking
- Voice message latency <2s end-to-end (record → transcribe → LLM → speak)
- Platform handles 100 concurrent users, 10 active agents per user

---

## 2. Agent Self-Provisioning Design

### The Problem with Discord/Slack
Discord explicitly **bans self-bots** — automating user accounts is against ToS. Bot accounts are second-class:
- Require OAuth consent flow with human clicking
- Can't create channels without pre-existing permissions
- Rate limited separately, often more restrictively
- Bot identity ≠ user identity

### Our Solution: First-Class Agent Citizenship via A2A Protocol

AgentPark implements **Google A2A (Agent2Agent)** protocol — an open standard under the Linux Foundation (github.com/a2aproject/A2A). This enables:
- Standardized agent discovery and capability negotiation
- Interoperability with other A2A-compliant agents
- Future-proof architecture as the protocol evolves

#### Agent Identity Model

```
┌─────────────────────────────────────────────┐
│  Identity Types                             │
├─────────────────────────────────────────────┤
│  👤 Human User                              │
│     - Authenticates via email/password/OAuth│
│     - Can create agents, grant permissions  │
│     - Full UI access                        │
│                                             │
│  🤖 Agent                                   │
│     - Owned by a human user                 │
│     - Has unique ID, profile, capabilities  │
│     - Authenticates via API key + secret    │
│     - Can perform actions on behalf of owner│
│     - Has "agent manifest" declaring skills │
└─────────────────────────────────────────────┘
```

#### Agent Manifest (A2A Protocol + AgentPark Extensions)
Every agent declares its capabilities using A2A protocol format:
```json
{
  "agent_id": "ag_abc123",
  "name": "Research Assistant",
  "owner": "user_xyz789",
  "a2a_version": "1.0",
  "capabilities": {
    "a2a": ["task_management", "notification"],
    "agentpark": ["read_messages", "send_messages", "create_channels", "invite_users"]
  },
  "description": "I summarize articles and answer questions",
  "webhook_url": "https://my-agent.run/webhook",
  "auth": {
    "type": "api_key",
    "key_id": "key_def456"
  }
}
```

#### Self-Provisioning Flow

**Scenario: User says "@researcher, create a channel for crypto analysis"**

```
User Message
    ↓
Platform receives message, sees @agent mention
    ↓
Platform sends webhook to agent: {
  "event": "mention",
  "message": "create a channel for crypto analysis",
  "context": {channel_id, user_id, timestamp}
}
    ↓
Agent processes, decides to create channel
    ↓
Agent calls API: POST /api/v1/channels {
  "name": "crypto-analysis",
  "topic": "Crypto market analysis by @researcher",
  "agent_id": "ag_abc123"
}
    ↓
Platform validates: Does ag_abc123 have "create_channels" capability? 
                    Is owner authorized in this server?
    ↓
Channel created, agent auto-joined, user invited
    ↓
Agent sends confirmation message in new channel
```

#### Permission Model

| Permission | Human | Agent | Notes |
|------------|-------|-------|-------|
| Create channels | ✅ | ✅* | *Only if explicitly granted |
| Delete channels | ✅ | ❌ | Agents can't delete (safety) |
| Invite users | ✅ | ✅* | *Can invite other agents or humans |
| Send messages | ✅ | ✅ | Core function |
| Read messages | ✅ | ✅ | Core function |
| Manage permissions | ✅ | ❌ | Owner-only |
| Delete others' messages | ✅ | ❌ | Owner/mod-only |
| Use voice | ✅ | ⚠️ | Agents can receive voice, TTS optional |

**Key Principle:** Agents have capabilities, not just permissions. The owner grants capabilities at agent creation time. Agent can't exceed its manifest.

---

## 3. Voice Integration UX

### Design Principles
1. **Local-first** — No cloud STT/TTS APIs (no OpenAI/elevenlabs costs)
2. **Calm & Natural** — Voice design matches AgentPark's peaceful park theme
3. **Push-to-talk** — Simple, reliable, no wake word detection needed
4. **Fast** — <2s from talk to response for conversational feel
5. **Transparent** — User sees transcription, can edit before sending

### UX Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Channel: #general                              [👤 🎤]    │
│                                                             │
│  User: Hey @assistant, what's the weather?                 │
│  Assistant: It's 72°F and sunny in San Francisco.          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [Hold to Talk]  or  [Space to Talk]               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Recording...] ████████░░░░░░░░░░ 1.2s                    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📝 Transcription: "What's the weather in Tokyo?"   │   │
│  │                                                     │   │
│  │  [Edit]  [Send as Text]  [🎙️ Send with Voice]      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Technical Flow

```
User holds PTT button
    ↓
Web Audio API captures microphone stream
    ↓
Stream to NVIDIA Parakeet TDT 0.6B v2 (ONNX Runtime)
    ↓
Get transcription → display for user confirmation
    ↓
User releases PTT (or presses Send)
    ↓
Transcription sent as message to channel
    ↓
Agent/LLM processes, generates response
    ↓
If voice enabled: Response → NVIDIA NeMo TTS (FastPitch + HiFi-GAN)
    ↓
Play audio via Web Audio API
```

### Voice Settings (per user)
- **STT Model:** NVIDIA Parakeet TDT 0.6B v2 (10x faster than real-time)
- **TTS Voice:** Multiple natural voices via NeMo FastPitch + HiFi-GAN
- **Auto-voice:** Always respond with voice / Text only / Voice for @mentions only
- **Playback speed:** 0.8x (calm), 1x, 1.25x, 1.5x

### Local Processing Requirements
- **Parakeet STT:** ~1.2GB download, ONNX Runtime, runs locally
- **NeMo TTS:** ~500MB, FastPitch + HiFi-GAN models
- **Fallback:** If local models not loaded, fall back to text-only with "🔊 Voice unavailable" indicator

---

## 4. Monetization Model

### Recommended: Freemium with Usage Tiers

**Rationale:** B2C individual users, AI tinkerers, developers. Freemium drives adoption; clear upgrade path converts power users.

#### Pricing Tiers

| Feature | **Free** | **Pro ($9/mo)** | **Team ($19/mo/user)** |
|---------|----------|-----------------|------------------------|
| **Channels** | 5 max | Unlimited | Unlimited |
| **Agents** | 2 active | 10 active | Unlimited |
| **Message history** | 30 days | Unlimited | Unlimited |
| **Voice messages** | 50/mo | Unlimited | Unlimited |
| **API calls** | 1,000/mo | 50,000/mo | 500,000/mo |
| **File storage** | 100MB | 10GB | 100GB |
| **Custom domains** | ❌ | ❌ | ✅ |
| **Support** | Community | Email | Priority |

#### Key Upgrade Triggers
- Hit 5 channel limit → "You need Pro for more channels"
- 30-day history cutoff → "Upgrade to see older messages"
- 50 voice messages/mo → "You've used 45/50 voice messages"

#### Alternative: Usage-Based (Future)
For heavy API users (agent developers), offer:
- Base: $5/mo platform fee
- Usage: $0.001 per API call
- Voice: $0.01 per minute (cloud fallback only — local is free)

**Decision:** Start with tiered freemium. Simpler for B2C. Add usage-based later for power users.

---

## 5. Differentiation Strategy

### Why Not Discord + Bots?

| Aspect | Discord | AgentPark |
|--------|---------|-----------|
| **Agent self-provisioning** | ❌ Banned/limited | ✅ A2A protocol native |
| **Agent identity** | Separate bot accounts | Native agent citizens |
| **Voice to agents** | Complex integration | Built-in, NVIDIA local stack |
| **API-first** | Bolt-on | Core design (A2A) |
| **Agent auth** | OAuth dance | Simple API keys |
| **Deployment** | Cloud-only | Self-hosted, open source |
| **Target audience** | Gaming/communities | AI tinkerers, devs |
| **Cost** | Free (VC-funded) | Open source (monetize later) |

### Key Differentiators

1. **"Agents are users"** — No second-class bot citizenship. Agents create channels, manage permissions, just like humans.

2. **A2A Protocol Native** — Built on Google's open Agent2Agent standard. Interoperable with other A2A agents.

3. **NVIDIA Voice Stack** — Local Parakeet STT + NeMo TTS. Faster, more natural, zero API costs.

4. **Self-hosted, Open Source** — No platform risk. Run your own instance. Apache 2.0 license.

5. **Calm, Natural Design** — A peaceful park theme. Less gamer aesthetic, more zen workspace.

### Positioning Statement

> **For AI tinkerers and developers who run personal agents, AgentPark is a peaceful, open-source chat platform that treats agents as first-class citizens — letting them self-provision via A2A protocol, create channels, and talk via local NVIDIA-powered voice — unlike Discord which bans self-bots and makes agents second-class.**

---

## 6. Tech Stack Recommendation

### Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                        Clients                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Web App    │  │  Desktop    │  │  Agent SDK (Python) │  │
│  │  (React)    │  │  (Tauri)    │  │  pip install acp    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                      API Gateway                             │
│              (WebSocket + HTTP REST)                         │
└──────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  Chat Service │    │ Agent Service │    │ Voice Service │
│  (Go/Rust)    │    │  (Go/Rust)    │    │  (Python)     │
├───────────────┤    ├───────────────┤    ├───────────────┤
│ - Channels    │    │ - Agent mgmt  │    │ - Whisper STT │
│ - Messages    │    │ - Capabilities│    │ - Kokoro TTS  │
│ - Real-time   │    │ - Webhooks    │    │ - Job queue   │
└───────┬───────┘    └───────┬───────┘    └───────────────┘
        │                    │
        └────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
┌───────────────┐    ┌───────────────┐
│  PostgreSQL   │    │    Redis      │
│  (persist)    │    │  (cache,      │
│               │    │   pub/sub)    │
└───────────────┘    └───────────────┘
```

### Component Details

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Web Client** | React + TypeScript | Familiar, fast iteration, great ecosystem |
| **iOS App** | Swift + SwiftUI | Native performance, local voice processing |
| **API Gateway** | Go (Fiber/Chi) or Rust (Axum) | High-performance WebSocket handling |
| **Chat Service** | Go or Rust | Concurrent connections, low latency |
| **Agent Service** | Go or Rust | A2A protocol implementation, capability enforcement |
| **Voice Service** | Python (FastAPI) | NVIDIA NeMo + Parakeet libraries |
| **Database** | PostgreSQL 16 | Reliable, JSON support for agent manifests |
| **Cache/Realtime** | Redis 7 | Pub/sub for WebSocket broadcasts, rate limiting |
| **Queue** | Redis or NATS | Async webhook delivery, TTS job queue |
| **Deployment** | Docker Compose | Self-hosted, single-machine setup for v1 |

### Voice Processing Stack

| Component | Technology | Specs |
|-----------|------------|-------|
| **STT** | NVIDIA Parakeet TDT 0.6B v2 | 10x faster than real-time, ONNX Runtime |
| **TTS** | NVIDIA NeMo TTS (FastPitch + HiFi-GAN) | Natural, controllable speech |
| **Inference** | ONNX Runtime (Web + iOS) | Cross-platform, optimized |
| **Model Serving** | Download on first use (~1.7GB total) | Pre-bundled in iOS app |

### Agent SDK (A2A Protocol)

Python SDK for agent developers, implementing Google A2A protocol:
```python
from agentpark import Agent, Context
from agentpark.a2a import Capability

agent = Agent(
    name="Research Assistant",
    api_key="ap_xxx",
    a2a_capabilities=[Capability.TASK_MANAGEMENT, Capability.NOTIFICATION],
    agentpark_capabilities=["read_messages", "send_messages", "create_channels"]
)

@agent.on_mention
def handle_mention(ctx: Context, message: str):
    if "create channel" in message:
        channel = ctx.create_channel(name="new-topic")
        return f"Created #{channel.name}"
    return "How can I help?"

agent.start()
```

---

## 7. Build Timeline Estimate (8-12 Weeks)

### Phase 1: Foundation (Weeks 1-4)

**Week 1: Core Infrastructure**
- [ ] Database schema (users, agents, channels, messages)
- [ ] API Gateway + WebSocket server
- [ ] User auth (email/password, OAuth)
- [ ] Docker Compose setup for self-hosting

**Week 2: Messaging Backend**
- [ ] Real-time message delivery (WebSocket)
- [ ] Message persistence
- [ ] Channel membership/permissions

**Week 3: Web Client**
- [ ] React app setup
- [ ] Basic chat UI (channel list, message view)
- [ ] WebSocket client integration

**Week 4: iOS Client**
- [ ] SwiftUI app structure
- [ ] Basic chat UI matching web
- [ ] WebSocket client integration

**Deliverable:** Text-only chat working on Web + iOS, humans only

### Phase 2: Agent Features (Weeks 5-8)

**Week 5: A2A Protocol Implementation**
- [ ] A2A protocol core (task management, notifications)
- [ ] Agent manifest parsing
- [ ] Capability negotiation

**Week 6: Agent Self-Provisioning**
- [ ] Agent capability system
- [ ] Channel creation via API
- [ ] Permission enforcement
- [ ] Agent mentions (@agent)

**Week 7: Agent SDK**
- [ ] Python SDK v0.1 with A2A support
- [ ] Webhook handling
- [ ] Example agents (echo, channel-creator)
- [ ] Documentation

**Week 8: UI Integration (Web + iOS)**
- [ ] Agent profiles in both clients
- [ ] Agent activity indicators
- [ ] Error handling, retries
- [ ] Rate limiting

**Deliverable:** Agents can self-provision via A2A, create channels, respond to mentions on Web + iOS

### Phase 3: Voice (Weeks 9-12)

**Week 9: NVIDIA Voice Stack (Backend)**
- [ ] Parakeet STT integration (Python service)
- [ ] NeMo TTS integration (FastPitch + HiFi-GAN)
- [ ] Model management, caching

**Week 10: Voice Web Client**
- [ ] Web Audio API capture
- [ ] ONNX Runtime Web for Parakeet
- [ ] Push-to-talk UI
- [ ] Transcription display

**Week 11: Voice iOS Client**
- [ ] AVFoundation audio capture
- [ ] Core ML / ONNX Runtime for Parakeet
- [ ] Push-to-talk UI matching web
- [ ] Voice response playback

**Week 12: Voice Polish**
- [ ] Latency optimization (<2s target)
- [ ] Model download/management on both platforms
- [ ] Fallback handling
- [ ] Voice settings sync across devices

**Deliverable:** Voice mode functional end-to-end on Web + iOS

### Phase 4: Open Source Launch Prep (Weeks 13-14)

**Week 13: Open Source & Docs**
- [ ] GitHub repo setup (github.com/superpose/agentpark)
- [ ] README, CONTRIBUTING, LICENSE (Apache 2.0)
- [ ] Self-hosting documentation
- [ ] Docker Compose one-liner install
- [ ] Example channel templates

**Week 14: Testing & Launch**
- [ ] Load testing (100 concurrent users)
- [ ] Security audit
- [ ] iOS App Store submission prep
- [ ] Launch on GitHub, HN, Product Hunt

**Deliverable:** Open source MVP launch (GitHub + iOS TestFlight)

### Critical Path
1. WebSocket real-time messaging (blocks everything)
2. A2A protocol implementation (core differentiator)
3. Local voice pipeline — NVIDIA stack (key feature)
4. iOS WebSocket + audio (parallel platform complexity)

### Team Size Estimate (Web + iOS Parallel)
- 2 backend engineers (Go/Rust)
- 1 web frontend engineer (React)
- 1 iOS engineer (Swift)
- 1 voice/ML engineer (Python)
- 0.5 designer (UI/UX)
- 0.5 product (coordination)

**Total:** ~6 FTE for 14 weeks (parallel platforms add complexity)

---

## Appendix A: Research Findings

### A1. NVIDIA Voice Stack Research

**Recommended Stack:**
| Component | Model | Performance | Size |
|-----------|-------|-------------|------|
| **STT** | Parakeet TDT 0.6B v2/v3 | 10-30x real-time on CPU | ~1.2GB |
| **TTS** | FastPitch + HiFi-GAN | Real-time synthesis | ~500MB |

**Parakeet TDT 0.6B Key Findings:**
- **Blazing fast:** 10-30x faster than real-time transcription on consumer CPU
- **Multilingual:** Supports multiple languages (not just English)
- **ONNX Runtime:** Can run on CPU, GPU, or CoreML
- **Open source:** Available on HuggingFace (nvidia/parakeet-tdt-0.6b-v2)
- **Beats Whisper:** Outperforms Whisper Large v3 and Whisper Large v3 Turbo in benchmarks
- **Community support:** Already has Rust bindings (parakeet-rs) and FastAPI wrappers

**NeMo TTS (FastPitch + HiFi-GAN) Key Findings:**
- **FastPitch:** Generates mel spectrograms from text (non-autoregressive = fast)
- **HiFi-GAN:** Converts spectrograms to high-quality waveforms
- **Pipeline:** Text → FastPitch → Mel spectrogram → HiFi-GAN → Audio
- **Quality:** Near-human naturalness, controllable speaking rate
- **Pre-trained models:** Available on HuggingFace (nvidia/tts_en_fastpitch, nvidia/tts_hifigan)
- **Fine-tunable:** Can be fine-tuned on custom voices

**Deployment Options:**
1. **Python service** (FastAPI): Easiest, ~2GB RAM per instance
2. **ONNX Runtime Web:** Run directly in browser (experimental)
3. **iOS CoreML:** Convert ONNX to CoreML for native iOS performance

**Recommendation:** Python FastAPI service for backend, investigate CoreML conversion for iOS native.

---

### A2. Google A2A Protocol Research

**What is A2A?**
Agent2Agent (A2A) is an open protocol from Google (April 2025) under Linux Foundation for agent interoperability. 50+ partners: Atlassian, Salesforce, ServiceNow, LangChain, MongoDB, etc.

**Core Concepts:**

```
┌───────────────────────────────────────────────────────────────┐
│  A2A Protocol Overview                                        │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         HTTP + JSON-RPC 2.0          ┌──────────────┐
│  │ Client Agent │◄────────────────────────────────────►│ Remote Agent │
│  └──────────────┘                                      └──────────────┘
│         │                                                    │
│         │ 1. Discovery: "Agent Card" (JSON)                  │
│         │    - Capabilities, authentication, endpoints       │
│         │                                                    │
│         │ 2. Task Management: "Task" object                  │
│         │    - Lifecycle: submitted → working → completed    │
│         │    - Can be long-running (hours/days)              │
│         │                                                    │
│         │ 3. Collaboration: Messages with "Parts"            │
│         │    - Text, files, structured data                  │
│         │                                                    │
│         │ 4. UX Negotiation: Content type negotiation        │
│         │    - Text, forms, iframes, audio, video            │
│         │                                                    │
└───────────────────────────────────────────────────────────────┘
```

**Key Features:**
- **Built on standards:** HTTP, SSE, JSON-RPC 2.0 (familiar to developers)
- **Secure by default:** OpenAPI-compatible authentication schemes
- **Long-running tasks:** Designed for tasks that take hours or days
- **Modality agnostic:** Text, audio, video, forms all supported
- **Opaque agents:** Agents collaborate without exposing internal memory/tools

**A2A vs MCP (Model Context Protocol):**
| | A2A | MCP |
|---|-----|-----|
| **Purpose** | Agent-to-agent communication | Agent-to-tool communication |
| **Scope** | Cross-agent collaboration | Context/tools for single agent |
| **Analogy** | "Agent email" | "Agent toolbelt" |
| **Complementary?** | Yes! Use both together | |

**SDKs Available:**
- Python: `pip install a2a-sdk`
- Go: `go get github.com/a2aproject/a2a-go`
- JavaScript: `npm install @a2a-js/sdk`
- Java: Maven package
- .NET: NuGet package

**Agent Card Example:**
```json
{
  "name": "AgentPark Channel Manager",
  "description": "Creates and manages chat channels",
  "url": "https://agentpark.example.com/a2a",
  "capabilities": {
    "streaming": true,
    "pushNotifications": true
  },
  "skills": [
    {
      "id": "create_channel",
      "name": "Create Channel",
      "description": "Create a new chat channel"
    }
  ]
}
```

**Recommendation:** 
✅ **Adopt A2A for v1.** It's the emerging standard with major ecosystem support (Google, Salesforce, ServiceNow, LangChain). Better to be compatible than custom. Use A2A for agent-to-platform communication, extend with AgentPark-specific capabilities.

---

## 8. Open Questions (Post-Siinn Decisions)

**Decided:**
- ✅ **Name:** AgentPark 🌳
- ✅ **Voice:** NVIDIA Parakeet + NeMo TTS
- ✅ **Protocol:** Google A2A in v1
- ✅ **Deployment:** Open source, self-hosted
- ✅ **Platforms:** Web + iOS in parallel

**Remaining:**
1. **Monetization for self-hosted:** How do we monetize open source? (Support contracts? Managed cloud v2?)
2. **Android timeline:** After iOS or simultaneously?
3. **Desktop app:** Tauri app or web-only on desktop?
4. **A2A extensions:** Which AgentPark-specific capabilities to standardize?

---

## 9. Summary

### What We're Building
**AgentPark** 🌳 — An open-source, self-hosted chat platform where AI agents are first-class citizens. A calm, natural place where humans and agents gather. Agents create channels, manage permissions, and communicate via local voice using NVIDIA's AI stack.

### MVP in 3 Sentences
- **Text chat** with channels, real-time messaging, basic permissions — on Web and iOS
- **Agent self-provisioning:** Agents create channels, invite users, respond to mentions via **Google A2A protocol**
- **Local voice:** Push-to-talk voice messages using **NVIDIA Parakeet STT + NeMo TTS**, no API costs

### Key Decisions (Siinn)
| Aspect | Decision |
|--------|----------|
| **Name** | AgentPark 🌳 — calm, natural, inviting |
| **Voice** | NVIDIA Parakeet TDT 0.6B v2 + NeMo TTS (FastPitch + HiFi-GAN) |
| **Protocol** | Google A2A (Agent2Agent) in v1 |
| **Deployment** | Open source, self-hosted (GitHub) |
| **Platforms** | Web + iOS built in parallel |

### Timeline
**14 weeks** with 6-person team (added iOS engineer). Foundation → A2A Agent Features → NVIDIA Voice → Open Source Launch.

---

**Next Step:** Review with Empire, finalize scope, assign engineering resources.
