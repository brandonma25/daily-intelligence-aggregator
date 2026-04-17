# PRD-7 — Article Rationale Labels

- confidence_level: `high`
- source_basis: `code, commit`
- related_files:
  - `src/lib/article-rationale.ts`
  - `src/components/story-card.tsx`
  - `src/components/landing/homepage.tsx`

## Objective
- Provide compact rationale labels that explain why an article or event was surfaced without requiring users to infer the product’s selection logic.

## Scope
- Lightweight rationale-label generation.
- Story-card and homepage rendering support for those labels.
- Reusable explanatory language tied to surfaced content.

## Explicit Exclusions
- Full structured reasoning and causal explanations introduced later in PRD-8 and PRD-12.
- Ranking-score transparency dashboards.
- Personalized rationale variants.

## Acceptance Criteria
- Surfaced stories can display concise rationale labels derived from shared logic.
- Rationale labels appear consistently across homepage and story-card surfaces.
- The rationale helper remains lightweight enough for broad reuse.

## Risks
- Labels can become repetitive or vague when underlying event data is thin.
- Overly generic labels may need later structured reasoning upgrades.

## Testing Requirements
- Verify rationale labels render for representative homepage/story-card states.
- Confirm labels degrade safely when upstream event context is sparse.
- Run install, lint, tests, and build before merge.
