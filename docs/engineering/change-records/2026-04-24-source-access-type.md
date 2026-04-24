# Source Access Type Change Record

- Date: 2026-04-24
- Change type: engineering change record for a cross-cutting source data-contract update
- Related PRD: `PRD-58`

## Summary

This change adds a required `access_type` field to the app-level `Source` contract and propagates a resolved access tier onto `HomepageEvent` so the public homepage can build an explicit open-access reading module without changing ranking, ingestion, taxonomy, or manifest governance.

## Contract Change

- `src/lib/types.ts` now defines the reusable access-tier enum `open | metered | paywalled`.
- `Source.access_type` is required and non-optional.
- `HomepageEvent.access_type` is resolved during homepage event assembly.

## Current Branch Scope

- All current `demoSources` entries were updated to declare `access_type` explicitly.
- The current audited branch count is thirteen `demoSources` entries, including the env-gated `source-newsapi-business` declaration in `src/lib/demo-data.ts`.
- Best Accessible Reads consumes the event-level field after Top 5 Signals, Developing Now, and Category Preview exclusions have already been determined.

## Resolution Rule

When a homepage event maps to multiple matched sources, the event-level access tier resolves to the most-open value using:

- `open > metered > paywalled`

This allows a multi-source story with at least one truly open source to qualify for open-access surfacing without weakening the underlying source-level assignments.

## Forward Requirement

Every new source added to `demoSources` or any future replacement source list must declare `access_type` explicitly. New entries must not rely on implicit defaults. If the current access model cannot be confirmed at implementation time, the entry should use `metered` as the conservative middle tier and be flagged for product-owner review in the branch PR note.
