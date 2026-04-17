# PRD-3 — Topic Matching Foundation

- confidence_level: `high`
- source_basis: `code, commit`
- related_files:
  - `src/lib/topic-matching.ts`
  - `src/lib/data.ts`
  - `src/app/actions.ts`
  - `src/app/topics/page.tsx`
  - `supabase/schema.sql`

## Objective
- Introduce deterministic topic matching so ingested articles can be grouped against user-relevant themes instead of remaining a flat article pool.

## Scope
- Topic-to-article matching logic.
- Topic-aware dashboard/homepage data assembly.
- Initial topic persistence support in the shared schema and actions layer.

## Explicit Exclusions
- Full topic/source management workflows formalized later in PRD-15.
- Event clustering, ranking, and reading-state systems.
- Personalized re-ranking.

## Acceptance Criteria
- Articles can be associated with topic records through shared matching logic.
- Dashboard generation consumes topic-aware results rather than raw article lists.
- Topic matching rules live in shared library code instead of page-local heuristics.

## Risks
- Keyword-based topic matching can miss nuanced stories or over-match noisy terms.
- Topic quality depends on seeded or user-provided topic definitions.

## Testing Requirements
- Add regression coverage for topic matching behavior in shared library code.
- Verify topic-aware content can render in dashboard/homepage flows.
- Run install, lint, tests, and build before merge.
