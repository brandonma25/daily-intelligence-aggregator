# Source Onboarding Batch 1

Date: 2026-04-19

Governed feature: `PRD-42` (`docs/product/prd/prd-42-source-governance-and-defaults.md`)

## Purpose

Add user-provided candidate sources to the source catalog only after fetch/parse validation, while preserving the explicit MVP default ingestion set.

This pass does not add new runtime-default sources, does not add source-tier preference boosts, and does not reintroduce BBC or CNBC.

## Runtime Defaults

The MVP default public ingestion set remains unchanged:

- The Verge
- Ars Technica
- TLDR
- TechCrunch
- Financial Times

These defaults are still resolved from `MVP_DEFAULT_PUBLIC_SOURCE_IDS` in `src/lib/demo-data.ts`. Catalog support is not default ingestion.

## Source Classification Reassessment

The branch was rechecked before PR creation to make sure validation success did not imply strategic readiness. Current classifications:

| Source | Classification | Rationale |
| --- | --- | --- |
| Financial Times Global Economy | `probationary` | Technically valid and narrower than the existing broad FT default, but it still creates FT duplicate pressure. Do not enable alongside broad FT without an explicit coverage decision. |
| MIT Technology Review | `active_optional` | Strong technology and AI-adjacent editorial source with low default-overlap risk. Supported in catalog, not default ingestion. |
| Foreign Affairs | `active_optional` | High-signal geopolitics analysis source. Useful specialization, but not default ingestion. |
| The Diplomat | `active_optional` | Strong Asia-Pacific specialization. High item count requires monitoring, but its regional focus is strategically useful. |
| NPR World | `probationary` | Valid feed, but broad general-world coverage can add duplicate/noise pressure. Kept supported but downgraded from optional to probationary before PR. |
| Foreign Policy | `active_optional` | High-signal geopolitics/policy source with strong product fit. Not default ingestion. |
| The Guardian World | `probationary` | Valid but broad world feed. Useful for coverage breadth only after clustering/noise review. |
| Hacker News Best | `probationary` | Valid feed, but community-curated and indirect. Useful discovery surface, not an editorial backbone. |

## Candidate Validation

Validation used a direct HTTP fetch plus `rss-parser` parse check with the same parser dependency used by the ingestion code.

| Candidate | URL | HTTP result | Parse result | Evidence | Final status | Reason |
| --- | --- | --- | --- | ---: | --- | --- |
| Financial Times Global Economy | `https://www.ft.com/global-economy?format=rss` | `200 OK`, `text/xml` | Parsed as RSS; feed title `Global Economy` | 25 items | Accepted as `probationary` | Narrower economics value, but near-duplicate of broad FT runtime default. |
| NPR Economy | `https://feeds.npr.org/1008/rss.xml` | `200 OK`, `text/xml` | Parsed as RSS; feed title `NPR Topics: Culture` | 10 items | Deferred | URL did not validate as economy coverage despite parsing successfully. |
| WSJ / Dow Jones / MarketWatch economics | `https://feeds.content.dowjones.io/public/rss/mktw_wsjonline` | `404 Not Found` | Failed | 0 items | Rejected | Supplied endpoint is not reachable. |
| MIT Technology Review | `https://www.technologyreview.com/feed/` | `200 OK`, `application/rss+xml` | Parsed as RSS; feed title `MIT Technology Review` | 10 items | Accepted as `active_optional` | Strong technology source, but not default ingestion. |
| The Verge | `https://www.theverge.com/rss/index.xml` | `200 OK`, `application/xml` | Parsed as RSS; feed title `The Verge` | 10 items | Duplicate, not added | Already represented in runtime defaults. |
| Ars Technica | `https://feeds.arstechnica.com/arstechnica/index` | `200 OK`, `text/xml` | Parsed as RSS; feed title `Ars Technica - All content` | 20 items | Existing metadata updated | Already represented in runtime defaults and catalog; validation metadata updated only. |
| Foreign Affairs | `https://www.foreignaffairs.com/rss.xml` | `200 OK`, `application/rss+xml` | Parsed as RSS; feed title `FA RSS` | 20 items | Accepted as `active_optional` | High-signal geopolitics analysis source. |
| The Diplomat | `https://thediplomat.com/feed` | `200 OK`, `application/rss+xml` | Parsed as RSS; feed title `The Diplomat` | 96 items | Accepted as `active_optional` | Asia-Pacific specialization offsets volume risk; monitor if enabled. |
| NPR World | `https://feeds.npr.org/1004/rss.xml` | `200 OK`, `text/xml` | Parsed as RSS; feed title `NPR Topics: World` | 10 items | Accepted as `probationary` | Valid but broad general-world feed, so it needs duplicate/noise review before broader use. |
| Brookings Research | `https://www.brookings.edu/feeds/rss/research/` | `200 OK`, `text/html` redirect | Failed RSS parse | 0 items | Deferred | Supplied URL redirected to an HTML research page, not parseable feed content. |
| Foreign Policy | `https://foreignpolicy.com/feed` | `200 OK`, `application/rss+xml` | Parsed as RSS; feed title `Foreign Policy` | 25 items | Accepted as `active_optional` | Strong geopolitics/policy fit, not default ingestion. |
| The Guardian World | `https://www.theguardian.com/world/rss` | `200 OK`, `text/xml` | Parsed as RSS; feed title `World news \| The Guardian` | 45 items | Accepted as `probationary` | Broad world coverage can increase duplicate/noise pressure. |
| Hacker News Best | `https://hnrss.org/best` | `200 OK`, `application/xml` | Parsed as RSS; feed title `Hacker News: Best` | 30 items | Accepted as `probationary` | Community-curated discovery source, not editorial backbone. |
| CSIS Analysis | `https://www.csis.org/analysis/feed` | `404 Not Found` | Failed | 0 items | Rejected | Supplied endpoint is not reachable. |

## Onboarding Decisions

Added catalog-only support does not imply runtime ingestion. Every added source has:

- `mvpDefaultAllowed: false`
- `editorialPreference: "none"`
- `validationStatus: "validated"`
- `lifecycleStatus` set to either `active_optional` or `probationary`

Deferred or rejected sources were not added to the catalog. If a replacement endpoint is later supplied, it must pass the same fetch/parse validation before being marked ready.

## Duplicate Handling

- The Verge is already represented as a runtime-default source and was not duplicated in the catalog.
- Ars Technica already existed in the catalog and runtime defaults; only its validation metadata was updated.
- Financial Times Global Economy is narrower than the existing broad Financial Times runtime default. It was added as probationary, with an explicit duplicate-pressure note, and was not promoted into default ingestion.

## Browser Validation Note

The initial Chromium Playwright project run had one failure in `tests/homepage.spec.ts` for opening the sign-in entry flow. That test exercises auth-entry UI on the homepage, not source catalog data or source ingestion.

Follow-up validation before PR creation:

- The failing auth-entry test passed on isolated rerun.
- A fresh full `npx playwright test --project=chromium` pass completed with 11/11 tests passing.
- A `/sources` browser smoke check verified that new catalog entries render without BBC/CNBC text or framework overlays.

## Follow-Up

- Find a verified NPR economy feed before onboarding NPR Economy.
- Find a working Brookings research RSS or API endpoint before onboarding Brookings Research.
- Find a working CSIS analysis RSS or Atom endpoint before onboarding CSIS Analysis.
- Re-check any Dow Jones endpoint manually before using it; the supplied URL returned `404 Not Found`.
