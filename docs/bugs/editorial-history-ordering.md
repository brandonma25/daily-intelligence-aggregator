# Bug Report - Editorial History Ordering

## Problem
Editorial history cards could appear out of date order, such as April 23 before April 26 before April 25. That made the archive hard to review because older cards could jump ahead of newer cards after edits.

## Root Cause
The editorial history query read from `signal_posts` and ordered by `briefing_date` plus `rank`, but the page re-sorted the returned cards by `updatedAt` before render. Editing or publishing an older card changed `updated_at`, so that older briefing date could jump above newer dates.

## Fix
- Strengthened the `signal_posts` query ordering for the editorial review page.
- Added `sortEditorialHistoryPostsReverseChronological()` as a defensive final sort after records are transformed.
- Replaced the page-level `updatedAt` sort with the shared editorial history sort.
- Kept homepage signal ranking, ingestion, clustering, scoring, editorial approval, and schema unchanged.

## Timestamp Field Used For Sorting
Primary date field: `briefing_date` / `briefingDate`, used as the editorial history signal date shown on each card.

Within the same `briefingDate`, tie-breakers are:
1. `published_at` / `publishedAt` descending
2. `signal_score` / `signalScore` descending
3. `created_at` / `createdAt` descending
4. `updated_at` / `updatedAt` descending
5. `id` ascending

## Files Changed
- `src/lib/signals-editorial.ts`
- `src/lib/signals-editorial.test.ts`
- `src/app/dashboard/signals/editorial-review/page.tsx`
- `src/app/dashboard/signals/editorial-review/page.test.tsx`
- `docs/bugs/editorial-history-ordering.md`
- `docs/engineering/bug-fixes/editorial-history-ordering.md`
- `docs/operations/tracker-sync/2026-04-26-editorial-history-ordering.md`

## Tests Run
- `npm install` passed.
- `npm run test -- src/lib/signals-editorial.test.ts` passed: 1 file, 20 tests.
- `npm run test -- src/app/dashboard/signals/editorial-review/page.test.tsx` passed: 1 file, 14 tests.
- `npm run lint` passed.
- `npm run test -- src/lib/signals-editorial.test.ts src/app/dashboard/signals/editorial-review/page.test.tsx` passed: 2 files, 34 tests.
- `npm run build` passed.
- `npm run test -- src/components/landing/homepage.test.tsx src/lib/homepage-model.test.ts src/app/page.test.tsx` passed: 3 files, 51 tests.
- `python3 scripts/release-governance-gate.py` passed.
- Dev server rule completed; local URL: `http://localhost:3000`.
- `curl -I http://localhost:3000/dashboard/signals/editorial-review` returned `200 OK`.
- `curl -s http://localhost:3000/dashboard/signals/editorial-review | rg -n "Admin sign-in required|Temporary issue|server problem|Top 5 Signals"` found the signed-out admin-gated page and no temporary server problem marker.

## Remaining Risks
- A signed-in admin browser pass is still needed to visually confirm live production-like `signal_posts` ordering with real account cookies.
- Preview validation is still needed before merge readiness because local route probes do not prove deployed auth/session behavior.
