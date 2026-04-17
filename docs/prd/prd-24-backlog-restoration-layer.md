# PRD-24 — Backlog Restoration Layer

- PRD ID: `PRD-24`
- Canonical file: `docs/prd/prd-24-backlog-restoration-layer.md`
- Feature system row: update `docs/product/feature-system.csv` with matching `prd_id` and `prd_file`

## Objective
- Restore the feature-system control layer so it acts as both a historical registry and a governed future backlog.

## Problem
- The product system becomes harder to operate when the CSV only reflects completed work and does not reserve the next planned PRD slots.

## Scope
### Must Do
- Keep built history and future backlog rows in one canonical CSV.
- Reserve sequential PRD IDs for planned governance work.
- Preserve dependency and build-order visibility for future execution.

### Must Not Do
- Split backlog control across multiple unofficial planning files.
- Treat a historical-only registry as sufficient operating control.

## Success Criteria
- The feature-system CSV includes built rows plus forward backlog rows.
- Future work can be selected from governed backlog rows without inventing a parallel queue.

## Done When
- One canonical PRD exists for backlog restoration in the governed system.
