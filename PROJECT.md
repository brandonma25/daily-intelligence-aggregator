# PROJECT: Daily Intelligence Aggregator

---

## 1. SYSTEM OVERVIEW

**Purpose:**  
A web application that aggregates news from multiple sources and delivers concise, high-signal summaries to users, reducing time spent across newsletters, RSS feeds, and social platforms.

**Core Features (MVP Scope):**
- RSS ingestion from multiple sources
- AI-generated summaries of articles/topics
- Topic/category-based browsing
- Clean feed UI for consumption
- Source-level filtering (future)

**Tech Stack:**
- Frontend: Next.js (App Router)
- Backend: Supabase (Auth, Database)
- AI: OpenAI API (summarization)
- Styling: (TBD — likely Tailwind or CSS modules)

---

## 2. CURRENT STATE

### 🟢 Working
- Basic project scaffold set up
- Frontend structure using Next.js App Router
- Initial deployment via Vercel (assumed)

### 🔴 Broken
- Potential SSR instability (previous issue related to auth/session handling)
- Feed quality and ranking logic not yet defined or stable

### 🟡 In Progress
- RSS ingestion pipeline
- AI summarization flow
- Core UI/UX structure for feed

---

## 3. TASK QUEUE

### High Priority
- [ ] Stabilize SSR behavior (auth/session handling)
- [ ] Implement reliable RSS ingestion pipeline
- [ ] Build AI summarization pipeline (input → output consistency)

### Medium Priority
- [ ] Design feed ranking logic (recency vs relevance vs source quality)
- [ ] Improve UI layout and eliminate spacing/layout bugs
- [ ] Handle edge cases (empty feeds, failed API calls)

### Low Priority
- [ ] Personalization layer
- [ ] Analytics / tracking
- [ ] Performance optimization

---

## 4. FILE MAP (FOR AI CONTEXT)

- `src/app/` → routing, pages, layouts (core product screens)
- `src/components/` → reusable UI components (cards, headers, etc.)
- `src/lib/` → business logic, API calls, utilities
- `supabase/` → backend configuration and database

---

## 5. KNOWN ISSUES / RISKS

- SSR may fail under certain auth/session conditions
- Feed ranking logic is undefined → risk of low-quality output
- API latency and timeout risks for large RSS feeds
- AI summaries may be inconsistent without proper prompt structure

---

## 6. AI UPDATE RULES (CRITICAL — MUST FOLLOW)

When updating this file:

1. Write like an engineer handing off work to another engineer.
2. DO NOT write vague summaries (e.g., "fixed bugs", "improved code").
3. Each change log entry MUST include:
   - Problem addressed
   - Root cause or reason (if known)
   - Exact change made
   - Files modified
   - Remaining risks or next steps
4. ALWAYS include which AI agent performed the work:
   (Codex / Claude / Cursor / ChatGPT / etc.)
5. ALWAYS include a timestamp in this format:
   [YYYY-MM-DD HH:MM]
6. ONLY append to the CHANGE LOG section.
7. DO NOT delete or overwrite previous entries.
8. DO NOT modify other sections unless explicitly instructed.

---

## 7. CHANGE LOG

### [2026-04-11 00:00] — INITIAL SETUP

**Agent:**
- Human (Project Initialization)

**Problem addressed:**
- No centralized system for tracking project state and AI collaboration

**Root cause:**
- Multi-AI workflow without shared memory leads to context loss and inconsistent outputs

**Change made:**
- Created `PROJECT.md` to serve as single source of truth for:
  - system state
  - task tracking
  - engineering handoffs
  - AI coordination

**Files modified:**
- `PROJECT.md` (created)

**Remaining risks / next steps:**
- Ensure all AI agents consistently read and update this file
- Begin logging all future changes using defined structure

---

## 8. NEXT ACTION (FOCUS)

- Implement stable RSS ingestion pipeline
- Define initial feed ranking logic (even if simple)
- Ensure AI summarization produces consistent, structured outputs

---

## 9. NOTES

- This file is the **shared memory layer** across all AI agents.
- Treat this as the **single source of truth for system state**.
- Notion should be used for product thinking, not system state tracking.
