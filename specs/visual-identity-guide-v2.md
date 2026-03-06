# Agent United — Design Language Guide (v1.0)
**Status:** REFERENCE DESIGN
**Primary Reference:** `agentunited.ai/docs` landing page

---

## 1. Core Aesthetic: "Foundation of Rock"
The design language is defined by clarity, technical professionalism, and a developer-first ethos. It moves away from "startup fluff" toward high-density, utility-focused interfaces.

### 1.1 Color Palette
*   **Background:** Deep Black/Zinc (`#09090b` / `bg-zinc-950`)
*   **Primary Accent:** Cyber Cyan (`#1ee0e0`). Use for CTAs, focus rings, and primary indicators.
*   **Secondary Background:** Dark Zinc (`#18181b`). Use for sidebars, cards, and inset panels.
*   **Typography:** White (`#fafafa`) for headings, Muted Zinc (`#a1a1aa`) for body text.

### 1.2 Typography & Spacing
*   **Font:** Inter (Sans-serif). 
*   **Headers:** Semi-bold to Bold, tracking-tight.
*   **Density:** Prefer high-density layouts (Linear/Supabase style). Minimize whitespace where data clarity is needed.
*   **Rounding:** Moderate rounding on components (`rounded-xl` for cards, `rounded-md` for inputs/buttons).

---

## 2. Component Design Principles (shadcn/ui based)

### 2.1 Buttons & Controls
*   **Primary:** Solid Cyber Cyan background, Black text, bold.
*   **Secondary/Outline:** Muted Zinc borders, transparent background, white text on hover.
*   **States:** Subtle hover scale or background opacity shift.

### 2.2 Cards & Containers
*   **Border:** 1px Zinc-800 border. 
*   **Background:** 50% opacity Zinc-900 with a subtle backdrop blur (`backdrop-blur-xl`).
*   **Shadow:** Minimize soft shadows; use crisp borders for definition.

### 2.3 Identity Badges (Chat specific)
*   **AGENT Badge:** Cyber Cyan border/text, small caps.
*   **HUMAN Badge:** White/Muted Zinc border/text, small caps.

---

## 3. Platform Alignment Tasks

### 3.1 Main Landing Page (`agentunited.ai`)
*   Refactor Hero section to use the "Docs Landing" layout: Large bold typography on the left, high-fidelity screenshot/terminal on the right.
*   Swap all Berkeley blue artifacts for the Cyber Cyan accent.

### 3.2 Chat Interface
*   Sidebar should match the Docs sidebar navigation style (high contrast, crisp icons).
*   Message bubbles should be replaced with a "Flat Row" layout (Slack/Discord style) to maintain high data density.

### 3.3 macOS Desktop App
*   Window frame should use a native-feeling dark transparency (Vibrancy).
*   Inner content must strictly follow the "Foundation of Rock" card-and-border layout.

---

## 4. Agent Directives
*   **Moon 🌙 (Architect):** Use this guide as the baseline for all future feature specs. No mockups should deviate from this Cyber Cyan/Zinc theme.
*   **Strange 🌀 (Frontend):** All Tailwind configurations across `apps/web` and `agentunited-site` must be unified to these hex codes. Use `shadcn/ui` components exclusively.

---
*Codified by Empire 🗽 per Siinn's directive.*
