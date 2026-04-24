# PRD-58 — Best Accessible Reads PR Note

## Summary

This change adds explicit `access_type` metadata to all current `demoSources` entries, propagates a resolved event-level access tier into the homepage model, and adds a Best Accessible Reads module beneath By Category on the public homepage. The new module surfaces only open-access stories that are not already used in Top 5 Signals, Developing Now, or Category Previews.

## Audited Source Count

- Current audited `demoSources` count on this branch: `13`
- Included entries:
  - `source-verge`
  - `source-ars`
  - `source-mit-tech-review`
  - `source-tldr-tech`
  - `source-techcrunch`
  - `source-ft`
  - `source-reuters-business`
  - `source-bbc-world`
  - `source-foreign-affairs`
  - `source-marketwatch`
  - `source-zerohedge`
  - `source-ap-top-news`
  - `source-newsapi-business`

## Phase Summary

### Phase 0 — Docs and governance

- Added `PRD-58`
- Added a feature-system row for `PRD-58`
- Added the engineering change record for the `Source.access_type` contract

### Phase 1 — Data model

- Added the reusable source access-tier enum
- Added required `Source.access_type`
- Populated `access_type` on all current `demoSources` entries
- Propagated resolved `access_type` onto `HomepageEvent`

### Phase 2 — Selection logic

- Added `selectBestAccessibleReadsEvents`
- Added `HomepageViewModel.bestAccessibleReadsEvents`
- Excluded Top 5 Signals, Developing Now, and Category Preview IDs without rewriting PRD-57 volume-layer contracts

### Phase 3 — UI

- Added `BestAccessibleReads`
- Reused `BriefingCardCategory`
- Rendered the module beneath `CategoryPreviewGrid`

## Access Type Assignments and Rationale

- `source-verge` — `metered`
  - The Verge launched a dynamic metered paywall while keeping some core news accessible.
- `source-ars` — `open`
  - Ars states subscriptions improve the reading experience while public site content remains free.
- `source-mit-tech-review` — `metered`
  - MIT Technology Review sells unlimited digital access, indicating restricted but not clearly all-or-nothing free access.
- `source-tldr-tech` — `open`
  - TLDR is distributed as a free newsletter and open web archive.
- `source-techcrunch` — `open`
  - TechCrunch removed the TechCrunch+ paywall and returned to a free reader model.
- `source-ft` — `paywalled`
  - FT digital content access is sold primarily through subscriptions.
- `source-reuters-business` — `metered`
  - Reuters consumer access could not be cleanly confirmed from official public documentation during this audit, so this uses the conservative middle tier.
- `source-bbc-world` — `metered`
  - BBC.com now offers subscriptions with full news-article access while still leaving some content accessible without subscribing.
- `source-foreign-affairs` — `paywalled`
  - Foreign Affairs centers reader access on paid digital subscriptions.
- `source-marketwatch` — `metered`
  - MarketWatch offers paid all-access products, but the exact free boundary was not clearly documented in public official pages during this audit.
- `source-zerohedge` — `metered`
  - ZeroHedge keeps a free basic tier and reserves premium content for subscribers.
- `source-ap-top-news` — `open`
  - AP’s direct reader model is advertising and donation supported rather than paywall centered.
- `source-newsapi-business` — `metered`
  - NewsAPI Business is an API product rather than a normal reader publication, so this uses the conservative middle tier pending product-owner review.

## Product-Owner Review Flags

- `source-reuters-business`
- `source-marketwatch`
- `source-newsapi-business`

These entries use `metered` because the current official access model could not be confirmed cleanly enough to justify a stronger classification during this branch audit.

## Protected Areas Check

Confirmed unchanged in intent:

- Top 5 cap
- Developing Now selection logic
- CategoryPreviewGrid selection logic
- `classifyHomepageCategory`
- `HOMEPAGE_CATEGORY_CONFIG`
- category-tab behavior
- ingestion pipeline
- source manifest governance
- auth / SSR / cookie handling
- database schema and migrations

## Validation Summary

- Focused unit/component coverage added for source access types, homepage event access propagation, Best Accessible Reads selection behavior, and the new component
- Full local release gate and homepage browser validation: pending final execution in this branch
- Preview URL: pending branch push and Vercel deployment
