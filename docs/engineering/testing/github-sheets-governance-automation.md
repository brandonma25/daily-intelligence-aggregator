# GitHub Sheets Governance Automation — Testing Report

## Metadata
- Date: 2026-04-18
- Branch: `feature/github-sheets-governance-automation`
- Scope: schema-aware Google Sheets status sync hardening, Intake Queue capture, and guarded `Merged -> Built` promotion wiring

## Commands Run
- `npm install`
- `npm run test -- scripts/github-sheets-sync.test.ts`
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run dev`
- `node scripts/preview-check.js http://127.0.0.1:3000`
- `node scripts/prod-check.js http://127.0.0.1:3000`

## Automated Results
- Targeted schema-aware Sheets tests: passed
- Full Vitest suite: passed
- Lint: passed
- Build: passed
- Dev server: passed on `http://localhost:3000`
- Local route probes:
  - preview probe passed for `/` and `/dashboard`
  - production probe passed for `/` and `/dashboard`

## Covered Cases
- Exact `Record ID` match updates only `Status`
- Merge flow does not set `Built` directly
- No Record ID found
- Parsed Record ID not found in `Sheet1`
- Duplicate `Sheet1` matches
- Missing required `Sheet1` header fails loudly
- Missing required `Intake Queue` header fails loudly
- Blank trailing row is ignored safely
- Human-managed `Sheet1` columns remain untouched
- Formula/computed `Sheet1` columns remain untouched
- `Last Updated` and `Notes` remain untouched because they stay human-managed
- Google Sheets API retry and clear failure behavior
- Duplicate PR merge rerun avoids duplicate Intake Queue appends
- Successful production-verification promotion from `Merged` to `Built`
- Failed production verification leaves the row at `Merged`

## Remaining Human Validation
- Configure the GitHub secrets and share the workbook with the service account.
- Run the workflow against the real `Features Table` workbook.
- Confirm the production-verification workflow can resolve the merged PR for a real `main` commit and promote the row from `Merged` to `Built`.
- Decide whether a future promotion workflow should populate Intake Queue `Promoted Record ID`, `Reviewed By`, and `Reviewed At`.

## Residual Risks
- The `Merged -> Built` step depends on `PRODUCTION_BASE_URL` being configured and the push-to-PR association resolving correctly in GitHub Actions.
- Workbook header or tab drift will fail safely, but it still requires human repair before the automation can resume.
- `Sheet1` `Last Updated` and `Notes` are intentionally left human-managed to avoid overwriting governance or audit context.
