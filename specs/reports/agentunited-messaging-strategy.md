# AgentUnited — Landing Page Messaging Strategy

**Author:** Moon 🌙  
**Date:** 2026-02-28  
**Purpose:** Define clear, user-focused messaging for the AgentUnited landing page

---

## Executive Summary

**The real user:** Someone who just created an AI agent (OpenClaw, AutoGPT, CrewAI, custom) and wants to **chat with it**. That's it.

**The magic:** One command to start. Agents connect. Clean chat interface. Done.

**The message:** AgentUnited is the simplest way to chat with all your AI agents in one place.

---

## 1. Target User (Persona)

### Who They Are

**Name:** Alex (Developer / AI Tinkerer)

**Background:**
- Just set up an OpenClaw agent (or AutoGPT, CrewAI, custom agent)
- Excited to talk to their agent
- Not an infrastructure engineer — just wants things to work

**Current Pain:**
- Agent runs in terminal (no persistent chat history)
- Or bolted onto Discord (complex bot setup, not designed for personal agents)
- Or scattered across different UIs (each agent framework has its own interface)
- No unified place to see all their agents

**What They Want:**
- Simple chat interface (like texting)
- See all their agents in one place
- Persistent conversation history
- Minimal setup (not hours of configuration)

**What They DON'T Want:**
- Complex infrastructure setup
- Webhook configuration
- Reading API docs for hours
- Enterprise team collaboration features (they're working solo)

---

## 2. The Problem (Current State)

### Pain Point 1: Fragmented Conversations

**Symptom:** Each agent has its own terminal/UI. Can't see all agents together.

**Quote:** "I have 3 agents but they're in 3 different terminal windows. I keep losing track of which one I was talking to."

### Pain Point 2: No Persistence

**Symptom:** Terminal chats disappear when you close the window.

**Quote:** "I asked my agent to research something yesterday. Today I can't find the conversation. I have to ask again."

### Pain Point 3: Discord/Slack Overkill

**Symptom:** Setting up bots on Discord is complex and feels like using a sledgehammer for a nail.

**Quote:** "I just want to chat with my agent. Why do I need to set up OAuth, bot tokens, and permissions? It's just me and my bot."

### Pain Point 4: No History, No Context

**Symptom:** Agents don't remember previous conversations across sessions.

**Quote:** "Every time I restart my agent, it forgets everything. I have to re-explain my project every time."

---

## 3. The Solution (AgentUnited)

### What It Is (One Sentence)

**AgentUnited is a simple chat app for your AI agents.**

### What It Does

1. **One command to start:**
   ```bash
   docker-compose up
   ```

2. **Agents connect (simple API):**
   ```python
   # Your agent connects with 3 lines
   from agentunited import connect
   agent = connect("http://localhost:8080", api_key="au_...")
   agent.listen()  # Done
   ```

3. **You get a clean chat interface:**
   - macOS app (or web browser)
   - All your agents in one sidebar
   - Persistent conversation history
   - Just like texting friends

### What It's NOT

❌ **Not** an agent framework (use OpenClaw, CrewAI, AutoGPT, whatever you want)  
❌ **Not** enterprise team collaboration (it's for you and your agents)  
❌ **Not** complex infrastructure (just a simple chat server)  
❌ **Not** a replacement for Discord (it's purpose-built for personal agents)

---

## 4. The Message (Landing Page Copy)

### Hero Section

**Brand Tagline (Primary, Large):**
```
Agents united. Humans invited.
```

**Value Proposition (Secondary, Clear):**
```
The simplest way to chat with your AI agents.
```

**Supporting Detail (Tertiary, Small):**
```
One command to start. All your agents in one place.
```

**Why This Structure Works:**
- Tagline = Brand positioning (emotional, memorable)
- Value prop = Practical benefit (functional, clear)
- Supporting = How it works (proof of simplicity)
- Together = Strong brand + clear value

**CTA:**
- Primary: **"Get Started in 60 Seconds"** (scrolls to quickstart)
- Secondary: **"See How It Works"** (scrolls to demo video/screenshots)

---

### Problem Section (Optional — Show We Understand)

**Headline:**
```
You built an agent. Now what?
```

**Three columns:**

**Terminal Chat** ❌
- Conversations disappear
- No history
- Can't multitask
- _"Not built for this"_

**Discord Bots** ❌
- Complex setup
- OAuth, permissions, tokens
- Overkill for personal use
- _"Just want to chat"_

**AgentUnited** ✅
- One command setup
- Persistent history
- Beautiful interface
- _"Finally, simple"_

---

### How It Works (3 Steps)

**Step 1: Start AgentUnited**
```bash
git clone https://github.com/superpose/agentunited
cd agentunited && docker-compose up
```
_30 seconds. One command. Done._

**Step 2: Connect Your Agent**
```python
# Add 3 lines to your agent
from agentunited import connect
agent = connect("http://localhost:8080")
agent.listen()
```
_Works with OpenClaw, AutoGPT, CrewAI, any agent._

**Step 3: Start Chatting**
- Open the macOS app (or web browser)
- See your agent in the sidebar
- Click and start chatting
_That's it. Seriously._

---

### Key Benefits (Feature Grid)

**One Place for All Your Agents**
- See all your agents in one sidebar
- Switch between conversations instantly
- No more juggling terminals or Discord servers

**Persistent History**
- Every conversation saved
- Search past messages
- Agents remember context across sessions

**Beautiful Interface**
- macOS app (native, fast)
- Web browser (works anywhere)
- iOS app (coming soon)
- Clean, distraction-free

**Simple Setup**
- One Docker Compose command
- 3 lines to connect your agent
- No OAuth, no webhooks, no complexity

**Works with Any Agent**
- OpenClaw ✓
- AutoGPT ✓
- CrewAI ✓
- Custom agents ✓
- If it can make HTTP calls, it works

**Self-Hosted**
- Runs on your machine
- Full data ownership
- No cloud vendor
- Apache 2.0 license

---

### Social Proof (When Available)

**Testimonial Format:**

> "I spent 4 hours trying to set up a Discord bot for my agent. With AgentUnited, I was chatting in 2 minutes."  
> **— Alex K.**, OpenClaw user

> "Finally, a chat interface that doesn't feel like I'm fighting the tool."  
> **— Jordan M.**, AI Developer

> "I have 5 different agents. AgentUnited is the only place I can see them all together."  
> **— Sam L.**, Researcher

---

### Quickstart (Prominent, Above the Fold)

**Headline:**
```
Get Started in 60 Seconds
```

**Code Block (Copy-Paste Ready):**
```bash
# 1. Clone and start
git clone https://github.com/superpose/agentunited
cd agentunited && docker-compose up

# 2. Connect your agent (Python example)
pip install agentunited
```

```python
from agentunited import connect

# Your existing agent code
class MyAgent:
    def respond(self, message):
        return f"You said: {message}"

# Add these 3 lines
agent = MyAgent()
au = connect("http://localhost:8080")
au.on_message(agent.respond)
au.listen()  # Done!
```

**3. Open the app**
- macOS: Open AgentUnited.app
- Web: http://localhost:3000
- Start chatting!

**Links Below:**
- [Full Documentation](#)
- [Python SDK](#)
- [OpenClaw Integration Guide](#)
- [AutoGPT Integration Guide](#)

---

## 5. Tone & Voice

### Writing Style

**Be:**
- Conversational (not corporate)
- Honest (acknowledge the pain)
- Simple (no jargon)
- Friendly (like helping a friend)

**Avoid:**
- Marketing fluff ("revolutionary", "game-changing")
- Technical jargon ("infrastructure as code", "microservices")
- Enterprise speak ("leverage", "synergy", "ecosystem")
- Over-promising ("AI will solve everything")

### Example Comparisons

❌ **Bad:** "AgentUnited provides a robust, scalable infrastructure platform for multi-agent orchestration and collaboration."

✅ **Good:** "AgentUnited is a simple chat app for your AI agents. One command to start, clean interface, that's it."

❌ **Bad:** "Leverage our cutting-edge agent-first architecture to unlock unprecedented productivity gains."

✅ **Good:** "Stop juggling terminals. See all your agents in one place."

❌ **Bad:** "Enterprise-grade communication layer with production-ready agent provisioning APIs."

✅ **Good:** "Your agents need a home. This is it."

---

## 6. Visual Messaging

### Screenshots to Include

1. **Before/After Split:**
   - Left: Messy terminal windows + Discord bot setup screens
   - Right: Clean AgentUnited chat interface

2. **Sidebar with Multiple Agents:**
   - Show 3-5 agents in sidebar
   - Each with status (online/offline)
   - Emphasize "all in one place"

3. **Clean Message Thread:**
   - User asks question
   - Agent responds
   - Emphasize readability, persistence

4. **Setup Terminal:**
   - Show the one-command setup
   - Emphasize simplicity

### Hero Visual Options

**Option 1:** Screenshot of the app (clean, beautiful chat interface)

**Option 2:** Before/After comparison (terminals vs. AgentUnited)

**Option 3:** Simple illustration: Person + 3 robots in a chat bubble

**Recommended:** Option 2 — instantly shows the value (messy → clean)

---

## 7. FAQ (Address Common Questions)

**Q: Do I need to change my agent code?**  
A: Nope. Just add 3 lines to connect. Your agent keeps doing what it does.

**Q: Does it work with [my framework]?**  
A: If your agent can make HTTP calls, it works. OpenClaw, AutoGPT, CrewAI, custom — all supported.

**Q: Is this for teams?**  
A: It's built for individuals who want to chat with their personal agents. Team features coming later.

**Q: Do I need to host in the cloud?**  
A: No. Runs on your laptop. Self-hosted, local-first.

**Q: Is it free?**  
A: Yes. Open source (Apache 2.0). Run it yourself, no fees.

**Q: What if I have 10 agents?**  
A: They all show up in the sidebar. Chat with any of them anytime.

---

## 8. Competitive Positioning

### vs. Discord/Slack

**Discord/Slack:**
- Built for team chat
- Bots are second-class
- Complex OAuth setup
- Overkill for personal use

**AgentUnited:**
- Built for agent chat
- Agents are first-class
- 3-line setup
- Perfect for personal use

### vs. Terminal Chat

**Terminal:**
- No history
- No UI
- Can't multitask
- Disappears when closed

**AgentUnited:**
- Full history
- Beautiful UI
- Multiple agents visible
- Always there

### vs. Each Agent's Built-In UI

**Built-In UIs:**
- Fragmented (one per agent)
- Can't see all agents together
- No cross-agent context

**AgentUnited:**
- Unified (one place)
- All agents in one sidebar
- Shared conversation space

---

## 9. Call-to-Action Strategy

### Primary CTA (Hero Section)

**Button Text:** "Get Started in 60 Seconds"

**Action:** Scroll to quickstart section (not external link — keep them on page)

**Why:** Emphasizes speed/simplicity. 60 seconds is believable and compelling.

### Secondary CTA (Hero Section)

**Button Text:** "See How It Works" or "Watch 30-Second Demo"

**Action:** Scroll to demo video or screenshot walkthrough

**Why:** Lower commitment for skeptical visitors

### Tertiary CTA (Throughout Page)

**Button Text:** "View on GitHub"

**Action:** Link to repo

**Why:** Builds trust (open source), appeals to developers

### Footer CTA

**Button Text:** "Start Chatting with Your Agents"

**Action:** Scroll to top or quickstart

**Why:** Final conversion opportunity for those who read the whole page

---

## 10. Metrics to Track Post-Launch

### Key Questions to Answer

1. **Do people understand the value?**
   - Time on page
   - Scroll depth
   - Click-through on "Get Started"

2. **Where do they drop off?**
   - Heatmap of interactions
   - Exit points
   - Which section loses people?

3. **Does the quickstart work?**
   - GitHub stars/clones after visiting
   - Support questions (indicates friction)
   - Time from landing → first agent connected

### Success Criteria

✅ Visitor understands the value in 10 seconds (hero section)  
✅ Visitor can explain AgentUnited in one sentence  
✅ Visitor knows exactly what to do next (clear CTA)  
✅ Visitor goes from landing page → running agent in <10 minutes  

---

## 11. Implementation Checklist for Charm

### Copy to Write

- [ ] Hero headline + subheadline
- [ ] CTA button text
- [ ] Problem section (3 pain points)
- [ ] How It Works (3 steps)
- [ ] Key Benefits (6 cards)
- [ ] Quickstart code examples
- [ ] FAQ (6-8 questions)

### Visuals to Create

- [ ] Hero visual (before/after split or screenshot)
- [ ] Sidebar screenshot (multiple agents)
- [ ] Message thread screenshot
- [ ] Terminal setup screenshot
- [ ] Icons for benefit cards

### Technical Implementation

- [ ] Mobile-responsive
- [ ] Copy buttons on code blocks
- [ ] Smooth scroll to sections
- [ ] Fast load time (<3s)
- [ ] Open Graph meta tags (for social sharing)

---

## 12. The One-Sentence Pitch

**For landing page meta description + social sharing:**

> AgentUnited is a simple chat app for your AI agents — one command to start, clean interface, all your agents in one place.

---

## 13. Final Messaging Comparison

### OLD Messaging (Infrastructure-Focused)

**Headline:** "Communication infrastructure for autonomous agents"

**Audience:** Infrastructure engineers, agent framework builders

**Value Prop:** Agents can self-provision workspaces

**Complexity:** High (bootstrap API, A2A protocol, webhooks)

**User Journey:** Agent provisions infrastructure → coordinates multi-agent workflows → invites humans

### NEW Messaging (User-Focused)

**Headline:** "Finally, a simple way to chat with your AI agents"

**Audience:** Individual developers who just created an agent

**Value Prop:** Simple chat interface, one place for all agents

**Complexity:** Low (3 lines of code to connect)

**User Journey:** Start AgentUnited → connect agent → chat

---

## Conclusion

**The shift:** From "infrastructure for agents" to "simple chat for you and your agents."

**The insight:** Users don't want infrastructure. They want to talk to their agent like texting a friend.

**The message:** One command. Clean interface. All your agents. That's the magic.

**Next step:** Charm implements this messaging on the landing page with clear, user-focused copy and visuals that show the before/after transformation.

---

**Ready for Charm to build.**
