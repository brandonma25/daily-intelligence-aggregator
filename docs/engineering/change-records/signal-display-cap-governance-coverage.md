# Change Record: Signal Display Cap Governance Coverage

## ID
- Signal Display Cap Governance Coverage

## Summary
- Adds the missing governance-facing documentation lane for the PRD-36 signal display cap branch so hotspot release-governance coverage reflects the full merge-safe change set.

## Scope
- Governance coverage for the existing PRD-36 signal display cap work.
- Documents why this branch updates the hotspot file `docs/product/feature-system.csv` together with its canonical PRD.
- Confirms the implementation stays scoped to the dashboard Experience Layer, with display-only capping of the ranked signal list.

## Non-Goals
- No pipeline ranking, clustering, or summarization changes.
- No auth, session, Supabase schema, or API contract changes.
- No modification of the full ranked data layer output beyond the dashboard render cap.

## Risk Assessment
- Product risk remains bounded because the cap is enforced in the dashboard render layer rather than the pipeline output.
- Governance risk is reduced by explicitly documenting the hotspot-file update and preserving one canonical mapping between `PRD-36` and its feature-system row.

## Validation Status
- Local validation for the branch includes:
  - `npm install`
  - `npm run lint || true`
  - `npm run test || true`
  - `npm run build`
  - fresh dev-server startup on port `3000`
  - `npx playwright test --project=chromium`
  - `npx playwright test --project=webkit`
- Local validation confirms:
  - the main dashboard shows a maximum of five displayed signals
  - ranks 1 through 3 render as Core Signals
  - ranks 4 through 5 render as Context Signals when present
  - the zero-signal empty state renders cleanly in component coverage
- Preview validation is still required for deployed SSR rendering and final visual judgment.

## Merge Decision / Release Note
- This branch should merge only after the release-governance gate passes and Vercel Preview confirms the tier labeling and empty-state behavior.
- The branch now satisfies hotspot documentation expectations with:
  - one canonical PRD for `PRD-36`
  - one matching `docs/product/feature-system.csv` row
  - one governance-facing change record for the hotspot update
