# PRD-6 — Event Clustering Foundation

- confidence_level: `high`
- source_basis: `code, commit`
- related_files:
  - `src/lib/data.ts`
  - `src/lib/types.ts`
  - `src/app/actions.ts`
  - `src/app/dashboard/page.tsx`
  - `src/app/history/page.tsx`
  - `supabase/schema.sql`

## Objective
- Convert matched articles into event-level clusters so the product can reason about developments instead of isolated article rows.

## Scope
- Event-cluster generation in the shared data layer.
- Event-aware dashboard and history data models.
- Schema support for storing briefing/event relationships.

## Explicit Exclusions
- Why-this-matters reasoning and structured event intelligence expanded later in PRD-8 and PRD-12.
- Ranking activation and timeline narratives handled later in PRD-9.
- Continuity/read-state tracking.

## Acceptance Criteria
- Related articles can be grouped into event-centric briefing items.
- Dashboard and history flows consume clustered event structures instead of raw articles alone.
- Event shape definitions are centralized in shared types/data logic.

## Risks
- Early clustering can over-merge or split related stories.
- Cluster quality depends on ingestion quality and topic matching accuracy.

## Testing Requirements
- Validate cluster-building behavior against representative article sets.
- Verify event-centric briefing items render in dashboard/history routes.
- Run install, lint, tests, and build before merge.
