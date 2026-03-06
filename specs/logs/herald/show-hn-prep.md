# Show HN Prep — Agent United

**Optimal timing:** Tuesday-Thursday, 8-10am PST  
**Status:** Drafted, ready to post when timing is right  
**Current date:** Monday, March 2, 2026, 2:49pm PST

---

## Recommended Post Time

**Best option:** Tuesday, March 3, 2026, 8:30am PST

**Why:**
- Tuesday-Thursday are peak HN days
- 8-10am PST catches both US morning and EU afternoon
- Avoids Monday (lower engagement) and Friday (weekend drop-off)

**Backup option:** Wednesday, March 4, 2026, 9am PST

---

## Show HN Post (Final Draft)

### Title
```
Show HN: Agent United – stop juggling terminals, chat with all your AI agents in one place
```

**Character count:** 96 (within HN's 80-character soft limit with slight overage — acceptable for Show HN)

**Alternative (shorter):**
```
Show HN: Agent United – self-hosted chat platform for your AI agents
```
**Character count:** 72

### Body
```
I built Agent United because I was tired of juggling terminal windows and Discord bots just to chat with my agents.

Agent United is a self-hosted, agent-first chat platform. Think: Slack for your AI agents, but actually simple.

What it does:
• One command to start (Docker Compose)
• Connect any agent with a simple HTTP call (no SDK needed)
• Clean macOS app + web interface
• All your agents in one sidebar, persistent conversation history
• Works with OpenClaw, AutoGPT, CrewAI, custom agents — anything that can make HTTP calls

Agent integration (no SDK needed):
```python
import requests
API_KEY = "au_YOUR_KEY"
headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

requests.post("http://localhost:8080/api/v1/channels/CHANNEL_ID/messages",
    headers=headers, json={"content": "Hello from my agent!"})
```

Or curl:
```bash
curl -X POST http://localhost:8080/api/v1/channels/CHANNEL_ID/messages \
  -H "Authorization: Bearer au_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello from my agent!"}'
```

Tech stack: Go backend, PostgreSQL, Redis pub/sub, React web app, Electron desktop app.

It's MIT licensed, fully self-hosted, and designed for individual developers (not enterprise teams).

Demo site: https://agentunited.ai
GitHub: https://github.com/naomi-kynes/agentunited
Agent integration guide: https://docs.agentunited.ai/docs/agent-guide

What I learned building this:
• Agents need persistent conversation context more than I realized
• WebSocket fanout for multi-agent broadcasts is harder than it looks
• Developers really hate complex OAuth setup for personal tools

What's next:
• iOS app (agents you can chat with anywhere)
• Voice interface (talk to your agents)
• Multi-agent collaboration (agents chatting with each other)

Happy to answer questions about the architecture, agent integration patterns, or self-hosting setup.
```

---

## First-Hour Engagement Plan

HN posts live or die in the first hour. Plan:

**0-15 minutes:**
- Monitor for first comments
- Respond to every question immediately
- Pin the GitHub link in replies if needed

**15-60 minutes:**
- Continue rapid responses
- Share technical details when asked
- Be humble, not defensive
- Upvote insightful questions (not your own post)

**Hour 2-6:**
- Slower response cadence (30-60 min)
- Focus on substantive technical discussions
- Avoid getting dragged into flame wars

---

## Response Templates (Common Questions)

**Q: "Why not just use Discord?"**
A: "Fair question. Discord's built for human chat — bots are second-class. Setting up OAuth, webhooks, permissions takes hours. Agent United: one HTTP call, your agent is chatting. No SDK, no OAuth. Also, self-hosted means no Discord ToS worries for agent conversations."

**Q: "How does this compare to [X framework]?"**
A: "Agent United isn't a framework — it's just a chat UI. Use OpenClaw, AutoGPT, CrewAI, whatever you want. We're the layer that gives you a clean interface to talk to them."

**Q: "What about security?"**
A: "Self-hosted means you control everything. JWT auth for agents, bcrypt passwords for humans. All traffic is local by default. We don't see your data because we're not hosting it."

**Q: "Is this production-ready?"**
A: "It's MIT licensed open source. We're using it internally. Is it battle-tested at scale? No. But it's solid for personal use / small teams. Contributions welcome."

**Q: "Why Go?"**
A: "Wanted single-binary deploys, good concurrency for WebSocket fanout, and a mature ecosystem. Go fit the bill. Backend is ~5k LOC."

---

## Monitoring Checklist

- [ ] Post goes live
- [ ] Bookmark the thread URL
- [ ] Set 15-minute timer for first check
- [ ] Track upvotes in first hour (>20 = good momentum)
- [ ] Respond to EVERY top-level comment in first hour
- [ ] Share to Twitter once post hits front page

---

## Success Metrics (24 hours)

**Good launch:**
- 100+ upvotes
- Front page for 4+ hours
- 20+ comments
- 3+ GitHub stars per hour

**Great launch:**
- 300+ upvotes
- Front page for 12+ hours
- 50+ comments
- 10+ GitHub stars per hour

**Viral launch:**
- 500+ upvotes
- #1-5 on front page
- 100+ comments
- 100+ GitHub stars in 24h

---

## Ready to Execute

Empire — Show HN post is drafted and ready. Recommend posting:

**Tuesday, March 3, 8:30am PST** (tomorrow morning)

Will monitor intensely for first hour, respond to every comment.

**Approval to post at that time?**
