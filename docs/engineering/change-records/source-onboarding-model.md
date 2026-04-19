# Source Onboarding Model

## Current Architecture

The source system has separate layers:

- Public default ingestion is currently driven by `demoSources` and the cluster-first pipeline's five-source cap.
- Donor-backed source definitions live in the donor registry and are used when the pipeline is called without explicit sources.
- User-created sources live in Supabase `sources` rows and are treated as custom RSS inputs.
- The source catalog is an optional import surface. A catalog entry is not active ingestion.
- Source preference logic is centralized in `src/lib/source-policy.ts` and consumed by filtering and event-intelligence scoring.

## Source States

- `active_default`: eligible for default runtime ingestion. This should be rare and intentionally approved.
- `active_optional`: supported and strategically useful, but not automatically active.
- `catalog_only`: visible as an optional candidate, not promoted to active use.
- `probationary`: technically possible or strategically interesting, but noisy, key-gated, rate-limited, or not yet proven.
- `disabled`: intentionally unavailable.
- `legacy`: preserved as historical context or a stale endpoint, not importable without revalidation.

## Validation States

- `validated`: feed or endpoint has a current parser/API check.
- `unverified`: endpoint is known but has no current validation record.
- `failed`: endpoint is known to fail or not parse.
- `requires_key`: endpoint needs credentials before validation.
- `manual_only`: no supported machine-ingestable endpoint is available.

## Onboarding Rules

- Supported is not default.
- Catalog entry is not active ingestion.
- A source must not receive tier or boost preference unless explicitly approved in `src/lib/source-policy.ts`.
- New catalog entries should start as `catalog_only` or `probationary` with `mvpDefaultAllowed: false`.
- `importStatus: "ready"` means importable by the current UI, not automatically default. It must not be used for failed, key-gated, or manual-only sources.
- Broad general-news or broad market-news sources should not be promoted into the MVP backbone without a product decision.
- BBC and CNBC remain intentionally excluded from catalog recommendations and source preference logic for the current MVP.

## Adding New Candidate Sources

Add user-provided candidates in `src/lib/source-catalog.ts` with:

- source format
- lifecycle status
- validation status
- default eligibility
- editorial preference
- concise note when the source is unverified, failed, key-gated, or probationary

After adding candidates, run the catalog/source-policy tests and verify that default ingestion has not changed.
