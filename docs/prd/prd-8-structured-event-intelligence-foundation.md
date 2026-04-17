# PRD-8 — Structured Event Intelligence Foundation

- confidence_level: `high`
- source_basis: `code, commit`
- related_files:
  - `src/lib/event-intelligence.ts`
  - `src/lib/why-it-matters.ts`
  - `src/lib/homepage-model.ts`
  - `src/lib/ranking.ts`
  - `src/lib/types.ts`

## Objective
- Enrich event clusters with structured intelligence fields so downstream ranking and explanation layers can operate on event semantics instead of raw summaries.

## Scope
- Event-intelligence field construction.
- Shared event shape extensions for impact, type, and explanation inputs.
- Homepage/dashboard consumption of richer event metadata.

## Explicit Exclusions
- The later precision-hardening pass for why-this-matters handled in PRD-12.
- Deterministic article filtering added later in PRD-13.
- Personalized ranking boosts.

## Acceptance Criteria
- Events expose structured intelligence data beyond headline text alone.
- Homepage/dashboard rendering can consume richer event metadata.
- Shared intelligence logic lives in reusable library code with test coverage.

## Risks
- Structured fields can still be noisy when source data is incomplete.
- Downstream ranking quality depends on these fields remaining consistent.

## Testing Requirements
- Add regression coverage for event-intelligence construction and homepage-model integration.
- Verify event surfaces render correctly with richer intelligence fields.
- Run install, lint, tests, and build before merge.
