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
