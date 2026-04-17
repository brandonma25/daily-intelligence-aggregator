# PRD-1 — Daily News Ingestion Foundation

- confidence_level: `high`
- source_basis: `code, commit`
- related_files:
  - `src/lib/rss.ts`
  - `src/lib/data.ts`
  - `src/lib/source-catalog.ts`
  - `src/lib/env.ts`

## Objective
- Establish the first reusable ingestion layer that can fetch news from multiple sources and normalize article payloads for downstream product surfaces.

## Scope
- Multi-source RSS fetching.
- Environment-aware source configuration.
- Shared article normalization in the data layer.
- Curated source catalog support for initial feed coverage.

## Explicit Exclusions
- Fallback ingestion reliability rules handled later in PRD-11.
- Ranking, clustering, and reasoning layers.
- User-authenticated source management.

## Acceptance Criteria
- The repo can fetch articles from configured RSS sources through shared library code.
- Ingested items expose consistent article fields for later matching and ranking layers.
- Source definitions are centralized instead of hardcoded across routes.

## Risks
- Feed quality and freshness vary by source.
- Slow or malformed feeds can still reduce article volume.
- Early ingestion does not yet protect against thin-category output.

## Testing Requirements
- Validate RSS parsing against representative feeds.
- Confirm the data layer can ingest multiple configured sources without route-specific code.
- Run install, lint, tests, and build before merge.
