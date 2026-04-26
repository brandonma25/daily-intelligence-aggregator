# Regression Report — Static Stories + Editorial + Account Page

## Summary
- Date: 2026-04-26
- Branch: `bugfix/static-stories-editorial-page-regression`
- Base: `hotfix/prod-homepage-500-ingestion-ssr`
- Regression scope:
  - Homepage and category tabs fell back to static demo copy such as `The public tech briefing now pulls directly from current RSS feeds instead of static sample copy`.
  - `/dashboard/signals/editorial-review` hit the recoverable app error state instead of loading or degrading safely.
  - `/account` in preview hit the recoverable app error state instead of loading or redirecting cleanly.

## Root Cause
### Duplicate/static stories
- `src/lib/data.ts` switched public homepage SSR to published `signal_posts`, but when no live published set existed it dropped straight back to `demoDashboardData`.
- That demo briefing still contained the old static promo-style titles, so `/` and the category rails looked like sample content instead of persisted news data.

### Editorial page failure
- `src/lib/signals-editorial.ts` still called `ensureCurrentSignalPosts()` inside `getEditorialReviewState()`.
- That render-time path synthesized a fresh Top 5 by calling `generateDailyBriefing()`, which pulled the editorial route back into generation/pipeline behavior during SSR.
- The page should have been a read-only/editorial storage view. Re-entering generation during render made the route fragile and caused the recoverable server problem instead of a safe empty state.

### Account page failure
- `src/lib/data.ts` still routed `/account` through `getDashboardData()` inside `getAccountPageState()`.
- That loader performs dashboard pipeline audits plus ingestion/sync work during SSR, including render-time dashboard fallback generation and user-scoped write paths.
- `/account` only needed auth, profile preferences, and saved sources. Pulling the dashboard loader into the account route made preview auth/account rendering fragile and surfaced the recoverable server problem.

## Files Changed
- `src/lib/data.ts`
- `src/lib/signals-editorial.ts`
- `src/lib/data.test.ts`
- `src/lib/signals-editorial.test.ts`
- `src/app/dashboard/signals/editorial-review/page.test.tsx`
- `src/app/account/page.tsx`
- `docs/engineering/bug-fixes/2026-04-26-static-stories-editorial-page-regression.md`
- `docs/operations/tracker-sync/2026-04-26-static-stories-editorial-page-regression.md`

## Fix Implemented
- Homepage SSR now prefers a persisted read-only signal snapshot helper instead of jumping straight from live published data to demo briefing copy.
- Added `getHomepageSignalSnapshot()` in `src/lib/signals-editorial.ts`:
  - uses live published `signal_posts` first
  - falls back to the latest stored `signal_posts` snapshot when no live published set exists
  - never generates fresh signals during homepage render
- Replaced the public homepage demo fallback with clearly labeled category-specific placeholder cards that:
  - are distinct across Tech, Finance, and Politics
  - do not claim to be live/current news
  - keep SSR on persisted/read-only paths only
- Removed render-time `ensureCurrentSignalPosts()` from editorial review state loading.
- Editorial review now reads stored `signal_posts` only and returns a safe warning + empty state when no snapshot exists yet.
- Removed `getDashboardData()` from `getAccountPageState()`.
- `/account` now reads only request auth state, `user_profiles`, and `sources`, then redirects signed-out users through the existing login flow without invoking dashboard generation, ingestion, or sync work during SSR.
- Added regression tests that fail if `/account` reaches unexpected dashboard tables or crashes when profile storage is missing.

## Validation Results
- `npm install`
- `npm run test -- src/lib/signals-editorial.test.ts src/lib/data.test.ts src/app/dashboard/signals/editorial-review/page.test.tsx src/app/page.test.tsx`
- `npm run test -- src/lib/data.test.ts`
- `npm run lint`
- `npm run test`
- `npm run build`
- `lsof -ti:3000 | xargs kill -9 || true`
- `npm run dev`
- Local URL: `http://localhost:3000`
- `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test tests/smoke/homepage.spec.ts tests/homepage.spec.ts --project=chromium`
- Route probes:
  - `HEAD /` => `200`
  - `HEAD /dashboard/signals/editorial-review` => `200`
  - `HEAD /account` => redirect to `/login?redirectTo=/account`
  - homepage HTML contained the new placeholder titles and did not surface the old static demo titles
  - editorial route HTML returned `Admin sign-in required` and did not contain `Temporary issue` or `This page hit a server problem`
  - account route redirected cleanly and did not contain `Temporary issue` or `This page hit a server problem`
- Dev server logs after homepage + editorial probes showed `200` responses and no server crash markers.

## Remaining Risks
- Real signed-in editorial validation with an admin session still needs a human/browser pass; browser-control permissions were blocked in this Codex session, so local OAuth/admin login was not completed here.
- Real signed-in preview validation for `/account` still needs a human/browser pass; this session could validate the server route and unit coverage locally, but not complete OAuth/browser login automation.
- If production has no live published signal set and no stored latest snapshot, the homepage now shows honest category-specific placeholders. That is safer than sample-live copy, but product quality still depends on keeping `signal_posts` populated.

## Follow-up Recommendations
- Add a lightweight operational check that alerts when no live published `signal_posts` or latest stored snapshot is available for the homepage.
- Add a browser-level signed-in editorial smoke once an automatable local admin session path exists.
- Add a browser-level signed-in account smoke once an automatable local auth path exists.
- Keep `/`, category surfaces, editorial review, and `/account` on read-only stored data during render; do not route them back through feed parsing, generation, or sync helpers.
