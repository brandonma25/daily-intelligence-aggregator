# PRD-9 — Ranking and Timeline Activation

- confidence_level: `medium`
- source_basis: `code, commit, inference`
- related_files:
  - `src/lib/ranking.ts`
  - `src/lib/timeline-builder.ts`
  - `src/lib/data.ts`
  - `src/components/story-card.tsx`
  - `src/components/landing/homepage.tsx`
  - `src/app/dashboard/page.tsx`

## Objective
- Activate ranking and narrative context so event clusters are ordered intentionally and can show concise development timelines instead of appearing as undifferentiated cards.

## Scope
- Shared ranking logic for homepage and dashboard.
- Timeline-builder support for event-level narratives.
- Story-card rendering for ranked, contextualized events.

## Explicit Exclusions
- Personalization boosts introduced later in PRD-19.
- Reading-progress and continuity systems.
- Final homepage category/trust-surface polish consolidated later in PRD-17.

## Acceptance Criteria
- Homepage and dashboard consume a shared ranking layer for surfaced events.
- Event cards can render concise narrative timeline context where available.
- Ranking/timeline logic stays centralized in shared library code.

## Risks
- Ranking quality can drift if intelligence inputs remain noisy.
- Timelines may be sparse or absent when event clusters lack enough history.

## Testing Requirements
- Add regression coverage for ranking order and timeline-builder behavior.
- Verify ranked events render on homepage and dashboard with stable card behavior.
- Run install, lint, tests, and build before merge.
