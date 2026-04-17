# PRD-24 — Backlog Registry and Execution Queue

- PRD ID: `PRD-24`
- Canonical file: `docs/prd/prd-24-backlog-registry-and-execution-queue.md`
- Feature system row: update `docs/product/feature-system.csv` with matching `prd_id` and `prd_file`

## Objective
- Restore the feature-system CSV as both a historical registry of built work and an explicit forward-looking execution queue for not-yet-built features.

## Problem
- The governed feature system currently behaves as a retrospective ledger only, which weakens build-order planning and leaves future work outside the same control system used for shipped features.

## Scope
### Must Do
- Keep built PRD rows and future backlog rows in one canonical CSV.
- Reserve sequential PRD IDs for planned work.
- Make dependency and build-order planning visible before implementation starts.

### Must Not Do
- Duplicate backlog tracking across multiple competing product ledgers.
- Treat historical-only rows as sufficient operating control for future work.

## Success Criteria
- The feature-system CSV contains built rows plus future `Not Built` rows.
- Future work can be selected from governed backlog rows without inventing a parallel planning system.

## Done When
- One canonical PRD exists for backlog restoration and queue discipline.
