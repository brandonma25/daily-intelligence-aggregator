# PRD-27 — Hotspot Enforcement Gate

- PRD ID: `PRD-27`
- Canonical file: `docs/prd/prd-27-hotspot-enforcement-gate.md`
- Feature system row: update `docs/product/feature-system.csv` with matching `prd_id` and `prd_file`

## Objective
- Strengthen enforcement around serialized governance hotspot files so overlapping branches are detected and handled before late-stage merge conflict.

## Problem
- Hotspot awareness exists, but warning-only behavior can still leave shared governance files exposed to branch drift and late rework.

## Scope
### Must Do
- Build stronger checks around hotspot-file overlap and sync state.
- Make hotspot enforcement usable in local and PR workflows.
- Keep the enforcement focused on serialized governance files only.

### Must Not Do
- Treat all docs as hotspot files.
- Hide hotspot risk behind informal reviewer memory alone.

## Success Criteria
- Hotspot files receive explicit enforcement rather than advisory mention only.
- Branches touching hotspot files are easier to reconcile before PR merge pressure.

## Done When
- One canonical PRD exists for hotspot enforcement gating.
