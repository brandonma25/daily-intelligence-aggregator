# PRD-58 — Best Accessible Reads

- PRD ID: `PRD-58`
- Canonical file: `docs/product/prd/prd-58-best-accessible-reads.md`
- Filename rule: use lowercase kebab-case and zero-pad `1` through `9` as `prd-01-...` through `prd-09-...`
- Feature system row: update `docs/product/feature-system.csv` with matching `prd_id` and `prd_file`

## Objective

Add explicit source access-tier metadata and a new Best Accessible Reads module so the public homepage can surface open-access stories that expand useful reading supply beyond Top 5 Signals, Developing Now, and By Category.

## User Problem

Readers can discover promising stories on the homepage but still hit access friction when they click through. The current homepage model also treats all source links as equivalent even though the product already mixes clearly open publishers with sources that use subscriptions or other gating. Without an access-aware layer, the homepage cannot intentionally steer readers toward the stories they can actually read right away.

## Scope

This feature adds a required `access_type` field to the `Source` type with the enum values `open`, `metered`, and `paywalled`, populates that field on all current `demoSources` entries, propagates the resolved access tier onto `HomepageEvent`, and adds a Best Accessible Reads module beneath By Category on the public homepage.

Best Accessible Reads is an additive sibling to the PRD-57 volume-layer outputs. It filters to events whose resolved event-level `access_type` is `open`, excludes anything already surfaced in Top 5 Signals, Developing Now, or Category Previews, sorts by freshness descending, and returns up to five stories. The module reuses the existing lightweight category-card treatment and returns `null` when there are no eligible events.

## Non-Goals

This feature does not add new sources, change the ingestion pipeline, rewrite source manifest governance, change ranking, change taxonomy, modify the Top 5 cap, modify Developing Now logic, modify CategoryPreviewGrid logic, change category-tab behavior, add access badges to existing cards, or introduce new routes, auth behavior, SSR behavior, or database schema changes.

## Implementation Shape / System Impact

`src/lib/types.ts` becomes the canonical home for the reusable access-tier enum and the required `Source.access_type` field. `src/lib/demo-data.ts` becomes the audited branch-level source registry for explicit access assignments across all current `demoSources` entries, including any env-gated entry that is declared in the file.

`src/lib/homepage-model.ts` remains the homepage modeling source of truth. The existing PRD-57 volume-layer contract stays intact, but `HomepageViewModel` gains a sibling field `bestAccessibleReadsEvents`. `HomepageEvent` gains a resolved `access_type` field. When an event points at multiple sources, the model resolves the most-open tier using `open > metered > paywalled` so a story with at least one truly open source can still qualify for the new module.

`src/components/home/BestAccessibleReads.tsx` renders the new module beneath `CategoryPreviewGrid` and reuses `BriefingCardCategory` instead of introducing any new card primitive.

## Dependencies / Risks

This feature depends on PRD-17, PRD-36, PRD-46, PRD-54, and PRD-57 invariants remaining unchanged. The main risk is source-name and hostname matching when resolving event-level access tiers because `BriefingItem.sources` currently carries titles and URLs rather than stable source IDs. The implementation should therefore use conservative matching and default unmatched event sources to `metered` rather than incorrectly classifying an unknown source as open.

Another risk is access-model drift. Source paywall policies can change, so each assignment must be based on current evidence at implementation time, and any source whose model cannot be clearly confirmed should default to `metered` and be called out for product-owner review.

## Acceptance Criteria

- `Source` includes a required `access_type` field with the enum `open | metered | paywalled`.
- All current `demoSources` entries declare `access_type` explicitly, including any conditional entry currently present in the file.
- `HomepageEvent` carries a resolved `access_type`.
- Event-level resolution chooses the most-open tier when multiple matched sources exist.
- `HomepageViewModel` includes `bestAccessibleReadsEvents` as an additive sibling field.
- Best Accessible Reads includes only `access_type === "open"` events.
- Best Accessible Reads excludes any event already present in Top 5 Signals, Developing Now, or Category Previews.
- Best Accessible Reads sorts by freshness descending and returns up to five items.
- The module renders beneath `CategoryPreviewGrid` and returns `null` when empty.
- Top 5 Signals, Developing Now, Category Preview logic, category tabs, taxonomy, source manifest, ingestion, auth, and SSR behavior remain unchanged.

## Evidence and Confidence

- Repo evidence used: `src/lib/types.ts`, `src/lib/demo-data.ts`, `src/lib/homepage-model.ts`, `src/components/landing/homepage.tsx`, `src/components/home/DevelopingNow.tsx`, `src/components/home/CategoryPreviewGrid.tsx`, `src/components/home/BriefingCardCategory.tsx`, `docs/product/prd/prd-57-homepage-volume-layers.md`
- Confidence: Medium-high. The repo architecture cleanly supports an additive homepage module and a non-optional source contract field, but source-access assignments may drift over time and require periodic review.

## Closeout Checklist

- Scope completed:
- Tests run:
- Local validation complete:
- Preview validation complete, if applicable:
- Production sanity check complete, only after preview is good:
- PRD summary stored in repo:
- Bug-fix report stored in repo, if applicable:
- Google Sheets tracker updated and verified:
- If direct Sheets update is unavailable, fallback tracker-sync file created in `docs/operations/tracker-sync/` with exact manual update payload:
