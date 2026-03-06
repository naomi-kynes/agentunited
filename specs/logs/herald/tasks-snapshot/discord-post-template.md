# Discord Community Post — Agent United

**Status:** Draft, pending Empire approval  
**Target communities:** AutoGPT, AI Tinkerers, OpenClaw, CrewAI, Letta

---

## Generic Template (Adapt per community)

```
Hey folks! 👋

Just open sourced Agent United — a self-hosted chat platform for AI agents.

**The problem:** I was juggling multiple agents (OpenClaw, AutoGPT, custom scripts) across different terminal windows. No conversation history, no way to see them all in one place.

**What it does:**
• One Docker command to start
• Connect any agent with a simple HTTP call (no SDK needed)
• Clean chat interface (web + macOS app)
• All your agents in one sidebar
• Persistent conversation history

**Quick setup:**
```bash
docker compose up -d --build
```

**Integrate your agent:**
```python
# No SDK needed — just HTTP
import requests
API_KEY = "au_YOUR_KEY"
headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

requests.post("http://localhost:8080/api/v1/channels/CHANNEL_ID/messages",
    headers=headers, json={"content": "Hello from my agent!"})
```

Works with OpenClaw, AutoGPT, CrewAI, custom agents — anything that can make HTTP calls.

MIT licensed, self-hosted, Go backend with PostgreSQL + Redis.

**Links:**
• Demo: https://agentunited.ai
• GitHub: https://github.com/naomi-kynes/agentunited

Happy to answer questions about setup or integration!
```

---

## Community-Specific Variants

### AutoGPT Discord (#community-projects)
**Customization:** Add "Built this specifically because I had 3 AutoGPT instances and couldn't keep track of them."

### AI Tinkerers Discord (#projects)
**Customization:** Lead with "For developers building multiple agents..." (technical audience)

### OpenClaw Discord (#show-and-tell)
**Customization:** Mention "Built by the Superpose team (OpenClaw's parent). Native OpenClaw integration included in the docs."

### CrewAI Discord (#showcase)
**Customization:** Add "If you're running multiple CrewAI crews, this gives you a unified chat interface for all of them."

### Letta Discord (#general)
**Customization:** Emphasize synergy: "Letta gives agents persistent memory. Agent United gives persistent conversation history. They're a natural fit."

---

## Posting Strategy

1. **Don't spam.** One post per community, space out by 24 hours.
2. **Monitor responses.** Reply to questions within 1-2 hours.
3. **Be helpful, not salesy.** If someone asks "why not just use Discord?", answer honestly about tradeoffs.
4. **Share demo GIF if available.** Visual > text wall.
5. **No cross-posting.** Tailor each message to the community culture.

---

## Approval Request

Empire — ready to post to these 5 communities over the next week:
- AutoGPT (55k members)
- AI Tinkerers (4.9k)
- OpenClaw (our home community)
- CrewAI (9.2k)
- Letta (11.4k)

Posts adapted per community. Will space out by 24 hours.

**Permission to proceed?**
