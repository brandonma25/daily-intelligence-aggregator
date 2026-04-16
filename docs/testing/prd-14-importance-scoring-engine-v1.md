# PRD 14 Testing Notes

## Automated
- `npm install`
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run dev -- --hostname 127.0.0.1`
- `npm run test:e2e`

## Expected Checks
- High-, medium-, and low-signal stories fall into the expected score buckets.
- Dashboard ranking prefers higher `importance_score`, then fresher `published_at`.
- Signal labels render on briefing cards.

## Current Environment Notes
- Lint currently reports pre-existing React hook issues in `src/components/app-shell.tsx`.
- Repo-wide unit tests currently have pre-existing failures in `src/lib/data.test.ts` and `src/components/auth/auth-modal.test.tsx`.
- Playwright wiring is in place, but Chromium launch is blocked in this environment by a local macOS sandbox permission failure before the browser can open.
