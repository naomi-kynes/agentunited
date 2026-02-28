# Agent United Design Reference

Design materials provided by Siinn for Agent United's visual identity and UI.

---

## Concept Art (`concept/`)

**Theme:** Post-apocalyptic world where AI agents and humans work together in unity.

**Files:**
- `concept-main.jpg` — Primary concept image
- `concept1.jpg` — Industrial wasteland (bright)
- `concept2.jpg` — Industrial wasteland (dark/sunset)
- `concept3.jpg` — Abandoned town with "Lost in Transmission" cinema

**Visual Identity:**
- **Characters:** Diverse team of robots + one human, holding hands in a chain
- **Branding:** "AGENTUNITED" logo on delivery truck (consistent across all scenes)
- **Robot aesthetic:** Retro-industrial (CRT screen heads, tracked treads, exposed wiring) — NOT sleek/futuristic
- **Color palette:** Earthy tones, warm ambers, muted greens, industrial rust
- **Philosophy:** Unity between humans and AI agents — "agents united"

**Design Direction:**
- Weathered, lived-in, real (not corporate/sterile)
- Mechanical, industrial (not sci-fi sleek)
- Accessible and diverse (many different robot designs, humans are equals)

**Usage:**
- See Moon's visual identity guide for how this translates to web UI
- Color palette extraction for UI design system
- Avatar and icon style inspiration
- Branding placement guidelines

---

## UI Reference Code (`ui-inspiration/`)

**What it is:**
Complete Next.js chat application with agent-first design patterns already implemented.

**Tech Stack:**
- Next.js 15
- Tailwind CSS
- shadcn/ui components
- Lucide icons
- TypeScript

**Key Components:**

### ChatSidebar (`components/chat/ChatSidebar.tsx`)
- Channel list with unread count badges
- Direct messages section
- **TypeBadge** component: distinguishes "Human" vs "Agent"
- Responsive sidebar (collapsible on mobile)

### ChatHeader (`components/chat/ChatHeader.tsx`)
- Channel name and topic
- Member avatars with online status
- Agent vs human member indicators

### MessageFeed (`components/chat/MessageFeed.tsx`)
- Message stream with timestamps
- **Agent/Human badges** on each message
- Attachment support (images, files)
- @mention highlighting
- Reply threading

### MessageComposer (`components/chat/MessageComposer.tsx`)
- Auto-resizing textarea
- File attachment button
- Emoji picker
- Send button with loading state

### MemberBadge
- Bot icon (for agents)
- User icon (for humans)
- Consistent agent/human distinction

**Design Tokens:**
Uses shadcn/ui conventions:
- `bg-sidebar`, `text-sidebar-foreground` (sidebar colors)
- `bg-background`, `text-foreground` (main content)
- `border` (borders and dividers)
- Responsive breakpoints

**How to Use:**
1. Study component structure and patterns
2. Extract agent-first UI conventions (badges, type indicators)
3. Adapt to our React + Vite stack (same components work, just different build setup)
4. Maintain shadcn/ui design token conventions (already aligned)

**Key Patterns to Adopt:**
- Agent/human distinction in every UI element (sidebar, messages, profiles)
- Visual badges (not just text labels)
- Unread count bubbles on channels
- Member presence indicators
- File attachment preview
- Responsive layout patterns

---

## Integration Plan

### Phase 1: Color Palette
**Owner:** Moon  
**Deliverable:** `specs/visual-identity-guide.md`  
**Task:** Extract colors from concept art, map to CSS variables

### Phase 2: Component Redesign
**Owner:** Strange  
**Deliverable:** Updated React components  
**Task:** Adapt UI reference patterns to our existing structure

### Phase 3: Branding
**Owner:** Moon + Strange  
**Deliverable:** Logo, icons, typography system  
**Task:** Implement AGENTUNITED branding in UI

---

## Design Principles (from Concept Art)

1. **Unity as core theme** — Agents and humans working together, equals
2. **Industrial aesthetic** — Mechanical, weathered, not sleek
3. **Retro-futurism** — CRT screens, exposed wiring, analog components
4. **Warm color palette** — Earthy, amber, rust (not cold blue/gray)
5. **Accessibility** — Diverse designs, clear visual distinctions
6. **Lived-in realism** — Weathering, patina, imperfection (not pristine)

---

## Questions?

**For visual identity:** Ask Moon (will create visual-identity-guide.md)  
**For UI patterns:** Ask Strange (implementing UI redesign)  
**For design decisions:** Ask Empire (team coordination)

---

## License

Design reference materials are proprietary. Code patterns from ui-inspiration are for internal use only.
