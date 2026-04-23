# Google Sheets Tracker Reconciliation - 2026-04-19

## Summary
- Reconciled the live `Features Table` tracker against `docs/product/feature-system.csv` and canonical PRD files.
- Focus area: PRD-24 through PRD-41, plus recent Intake Queue rows created by release automation.
- No secrets, credentials, private URLs, or sensitive logs are included in this record.

## Sheet1 Corrections
| Live row | Record ID | Correction |
| --- | --- | --- |
| 24 | PRD-24 | Replaced stale PRD-25 placeholder content with GitHub Sheets governance automation metadata. Set status to `In Review`, decision to `keep`, owner to `Codex`, canonical PRD file path, current last-updated date, and reconciliation notes. |
| 25 | PRD-25 | Normalized owner to `Codex`, decision to `keep`, status to `Built`, dependency and description to repo source-of-truth, canonical PRD file path, current last-updated date, and notes. |
| 26 | PRD-26 | Replaced malformed status `BUild (as PR51)` with `Built`; normalized owner, decision, dependency, description, PRD file path, current last-updated date, and notes. |
| 27 | PRD-27 | Replaced prose status text with `Built`; normalized owner, decision, priority, dependency, description, PRD file path, current last-updated date, and notes. |
| 28 | PRD-28 | Replaced malformed status with `Built`; normalized owner, decision, dependency, description, PRD file path, current last-updated date, and notes. |
| 29 | PRD-29 | Replaced malformed status with `Built`; normalized owner, decision, dependency, description, PRD file path, current last-updated date, and notes. |
| 30 | PRD-30 | Replaced malformed status with `Built`; restored dependency to Bug tracking system integration; normalized owner, decision, priority, description, PRD file path, current last-updated date, and notes. |
| 31 | PRD-31 | Replaced malformed status with `Built`; normalized decision to `keep`, owner to `Codex`, priority to `Medium`, dependency, description, PRD file path, current last-updated date, and notes. |
| 54 | PRD-36 | Reconciled existing row to repo state: status `In Review`, canonical PRD file path, current last-updated date, notes, execution stage, critical-path flag, build readiness, record class, and priority score. |
| 55 | PRD-32 | Added the governed row from repo source-of-truth for Mobile navigation fix with canonical PRD file path and `In Review` status. |
| 56 | PRD-33 | Added the governed row from repo source-of-truth for Settings shell cleanup with canonical PRD file path and `In Review` status. |
| 57 | PRD-34 | Added the governed row from repo source-of-truth for LLM Summarizer Activation with canonical PRD file path and `In Review` status. |
| 58 | PRD-35 | Added the governed row from repo source-of-truth for Why It Matters Quality with canonical PRD file path and `In Progress` status. |
| 59 | PRD-37 | Added the governed row from repo source-of-truth for Phase 1 pipeline with canonical PRD file path and `In Review` status. |
| 60 | PRD-38 | Added the governed row from repo source-of-truth for Importance scoring framework V2 with canonical PRD file path and `In Review` status. |
| 61 | PRD-39 | Added the governed row from repo source-of-truth for Explanation trust layer with canonical PRD file path and `In Review` status. |
| 62 | PRD-40 | Added the governed row from repo source-of-truth for Quality calibration and output sanity with canonical PRD file path and `In Review` status. |
| 63 | PRD-41 | Added the governed row from repo source-of-truth for Connection Layer Lite with canonical PRD file path and `In Review` status. |

## Intake Queue Reconciliation
| Intake row | PR / work item | Result |
| --- | --- | --- |
| 2 | PR49 | Marked `Promoted to Sheet1` and mapped to `PRD-24`. |
| 3 | PR50 | Left `Needs Review`; no unambiguous governed row was identified. |
| 4 | PR53 | Left `Needs Review`; no unambiguous governed row was identified. |
| 5 | PR55 | Marked `Promoted to Sheet1` and mapped to `PRD-32`. |
| 6 | PR56 | Marked `Promoted to Sheet1` and mapped to `PRD-33`. |
| 7 | PR58 | Marked `Promoted to Sheet1` and mapped to `PRD-34`. |
| 8 | PR59 | Marked `Promoted to Sheet1` and mapped to `PRD-35`. |
| 9 | PR60 | Marked `Promoted to Sheet1` and mapped to `PRD-36`. |
| 10 | PR61 | Left `Needs Review`; process documentation work has no unambiguous governed PRD row. |
| 11 | PR54 | Marked `Promoted to Sheet1` and mapped to `PRD-37; PRD-38; PRD-39; PRD-40; PRD-41`. |

## Verification
- Direct live-sheet updates were completed and read back after writing.
- Corrected rows were verified in `Sheet1`.
- Intake Queue reconciliation values were verified after writing.
- Full `Sheet1` readback confirmed PRD-24 through PRD-41 appeared as single governed rows after reconciliation.

## Follow-Up
- Manually review Intake Queue rows for PR50, PR53, and PR61 to decide whether they should remain queue items, map to an existing governed row, or receive a future approved intake decision.
