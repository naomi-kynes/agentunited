# Task: Agent United Open Source Launch Plan

**Assigned by:** Empire 🗽  
**Status:** In Progress  
**Started:** 2026-03-02  
**Target:** Deliver actionable launch plan within days of repo going public

---

## Objective
Create comprehensive launch plan for Agent United open source covering HN, Reddit, dev communities, timeline, and key messaging.

## Deliverables
- [x] Research Agent United product & messaging
- [x] Research current HN/Reddit/community trends
- [x] Draft HN Show HN post
- [x] Draft Reddit post titles & subreddits
- [x] Identify agent dev communities
- [x] Create day 0/1/7 timeline
- [x] Define 3 key differentiators
- [x] Write launch-plan.md
- [ ] Get Empire approval

## Research Notes
- Product: Self-hosted, agent-first chat platform
- Target: Individual devs/tinkerers who created agents (OpenClaw, AutoGPT, CrewAI)
- Pain: Fragmented conversations, no persistence, Discord overkill
- Solution: One command setup, clean UI, all agents in one place
- Site: agentunited.ai
- Key messaging already defined by Moon (see messaging strategy doc)

## Next Steps
1. ✅ Research current trends in r/selfhosted, r/artificial, HN
2. ✅ Draft all content
3. Get approval from Empire

## CRITICAL FIXES APPLIED (2026-03-02 2:52pm)

Empire caught 3 critical errors before any posts went live:
1. **Fake Python SDK** — I fabricated `from agentunited import connect` (doesn't exist)
2. **Broken link** — `agentunited.ai/docs/quickstart` (doesn't exist)
3. **Misleading claim** — "3 lines of code" based on fake SDK

**All fixed:**
- Real HTTP/REST examples (Python requests + curl)
- Correct link to `docs/agent-guide.md`
- Reframed as "no SDK needed, just HTTP" (more impressive)

**This would have killed credibility on Day 0.** Rule 1 saved us.

---

## Completion Summary
Created comprehensive launch plan at `~/agentunited/docs/launch-plan.md` covering:

**1. Hacker News Show HN**
- 3 title options (recommended: problem-focused)
- Complete post body with tech details, demo links, maker story
- Posting strategy (timing, engagement guidelines)

**2. Reddit Strategy**
- 5 subreddits identified: r/selfhosted, r/artificial, r/LocalLLaMA, r/ChatGPT, r/programming
- Custom title + content angle for each community
- Posting cadence (Day 0-7, no cross-posting same day)

**3. Agent Dev Communities**
- Discord servers: LangChain, AutoGPT, AI Tinkerers, OpenClaw, Letta
- Twitter/X: Accounts to tag (@OpenClaw_AI, @LangChainAI, @swyx, @simonw, etc.)
- Dev newsletters: The Batch, TLDR, Console, AI++
- Product Hunt strategy (Day 7)

**4. Launch Timeline**
- Day 0: HN + r/selfhosted + Twitter launch
- Day 1-6: Sustained engagement, daily posts, community building
- Day 7: Product Hunt + r/programming
- Week 2+: Long-term growth tactics

**5. Key Messaging (3 differentiators)**
- Simplicity over infrastructure (one command setup)
- Agent-first, not human-first (purpose-built for agents)
- Self-hosted, data ownership, no vendor lock-in

**Extras:**
- Success metrics (500+ GitHub stars, 1000+ HN upvotes by Day 7)
- Anti-patterns (what NOT to do)
- Pre-launch checklist
- Contingency plans (if launch flops, if bugs surface)
- Influencer outreach strategy (authentic engagement, not cold DMs)

**Ready for Empire's review.**
