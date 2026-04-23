# PRD-24 — GitHub Sheets Governance Automation

## Objective
- Build a permanent GitHub to Google Sheets automation layer that keeps governed feature status in sync and quarantines unmapped work for review.

## User Problem
- Feature status is currently too easy to drift between pull requests, repo docs, and planning. Merged work needs a reliable post-merge status update, while unplanned work needs a safe intake path instead of being silently folded into the governed feature table.

## Scope

### Must Do
- Add a post-merge GitHub Action that updates `Features Table` `Sheet1` to `Merged` only when exactly one governed `Record ID` match exists.
- Add Intake Queue automation for unmapped, missing, duplicate, or ambiguous PR merges.
- Add a guarded production-verification promotion path from `Merged` to `Built`.
- Update permanent repo governance so future Codex sessions preserve `Sheet1` versus `Intake Queue` separation.
- Add automated tests for parsing, unique-match updates, intake capture, duplicate prevention, retry behavior, and Built promotion.

### Must Not Do
- Do not auto-create new governed rows in `Sheet1` from GitHub events.
- Do not mark `Built` directly on merge.
- Do not silently ignore ambiguous or failed writes.
- Do not require secrets to live in repo code or docs.

## Success Criteria
- A merged PR targeting `main` updates the matching governed row to `Merged` when the PR maps cleanly to exactly one `Record ID`.
- Unmapped or ambiguous merges append one review row to `Intake Queue` instead of touching `Sheet1`.
- Production verification can promote `Merged` to `Built` only after the verification workflow succeeds.
- Future Codex sessions inherit the governance rules through repo docs and templates.

## Done When
- The repo contains the helper script, tests, and workflow for merge-time Google Sheets sync.
- The production verification workflow can promote `Merged` rows to `Built` after successful verification.
- `AGENTS.md`, the permanent governance docs, and relevant templates explain the governed Google Sheets model.
- Repo-safe setup, rollback, and recovery instructions are documented.

## Dependencies / Risks
- Depends on GitHub secrets `GOOGLE_SERVICE_ACCOUNT_JSON` and `GOOGLE_SHEET_ID`.
- Depends on the target workbook keeping `Sheet1` and `Intake Queue` available with the expected schema.
- Main risk is incorrect status writes; mitigation is exact-match-only updates plus intake quarantine for every ambiguous case.

## Evidence and Confidence
- Repo evidence used:
  - existing release automation workflows and route-probe scripts
  - repo governance hotspot rules for `AGENTS.md` and protocol docs
- Confidence:
  - High confidence in the merge-to-`Merged` flow
  - Medium confidence in automatic `Merged -> Built` timing because it depends on production verification configuration and commit-to-PR association outside local-only testing
