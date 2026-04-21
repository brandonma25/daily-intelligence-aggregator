# Tracker Sync Fallback - Signed-Out Homepage QA Remediation

## Reason

Direct Google Sheets closeout could not be completed from this session because the available Google Drive connector exposed row search utilities but no governed row update/write utility.

## Manual Update Payload

Destination: `Intake Queue`

| Field | Value |
|---|---|
| Title | Signed-out Home page QA remediation |
| Change Type | Remediation / Alignment |
| Status | In Review |
| Branch | `fix/signed-out-homepage-qa-remediation` |
| Worktree | `/Users/bm/Documents/daily-intelligence-aggregator-signed-out-homepage-qa-remediation` |
| PRD Required | No |
| PRD File | None |
| Source of Truth | Approved artifacts 0, 1, 2, 3, 4, 5, 7, 10; signed-out QA report |
| Scope | Signed-out Home page only |
| Summary | Aligns signed-out Home branding, hierarchy, Top Events count/source behavior, fallback date labeling, category soft gate behavior/copy, Top Events keyPoints, hydration stability, and active category tab styling to the approved artifacts. |
| Repo Docs | `docs/engineering/bug-fixes/signed-out-homepage-qa-remediation-2026-04-22.md`; `docs/engineering/testing/signed-out-homepage-qa-remediation-2026-04-22.md` |
| Validation | `npm install`; `npm run lint`; `npm run test`; `npm run build`; `npx playwright test --project=chromium`; `npx playwright test --project=webkit`; Playwright browser console check against `http://localhost:3000` |
| Notes | No new canonical PRD was created. If a governed `Sheet1` row already exists for this remediation, update that row by immutable `Record ID` instead of duplicating it. |

## Follow-up Reconciliation Sync - 2026-04-22

| Field | Value |
|---|---|
| Status | In Review |
| Change Type | Remediation / Alignment follow-up |
| Summary | Adds strict signed-out Home QA reconciliation evidence, closes the remaining Top Events underfill case for three/four pipeline-selected `priority: "top"` items, normalizes missing `keyPoints` safely before render, strengthens Home DOM/console/style/gate assertions, and stabilizes Playwright redirect/navigation assertions surfaced by the full Chromium/WebKit runs. |
| Newly Proven | Signed-out Home structure order; Top Events 3-5 supported-data behavior plus limited-data fallback; `keyPoints` correct-field rendering and empty/missing safety; soft gate copy/CTA/dismiss behavior; active tab computed underline color; fallback date/link-date consistency; no Home console/page errors in Chromium or WebKit. |
| Remaining Blockers | None for the signed-out Home remediation scope. Preview and human auth/session validation remain required before merge/release because local Playwright does not prove Vercel environment truth. |
| Validation | `npm install`; targeted Vitest; `npm run lint`; `npm run test`; `npm run build`; signed-out homepage Chromium tests; full Chromium Playwright; full WebKit Playwright; explicit Chromium/WebKit console and page-error probe at `http://localhost:3000/`. |
