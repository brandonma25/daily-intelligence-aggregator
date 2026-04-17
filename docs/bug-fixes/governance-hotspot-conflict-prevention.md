# Governance Hotspot Conflict Prevention

- related_prd_id: `PRD-23`
- related_files:
  - `AGENTS.md`
  - `docs/engineering/engineering-protocol.md`
  - `docs/product/documentation-rules.md`
  - `docs/product/feature-system.csv`
  - `scripts/check-governance-hotspots.py`
- related_commit: `ef1f18f`

## Problem
- Serialized governance files were vulnerable to overlapping branch work, which increased the risk of stale CSV or protocol changes colliding late in review.

## Root Cause
- The repo had governance rules, but no explicit hotspot-check workflow reminding authors to sync with `origin/main` and treat key docs as serialized merge points.

## Fix
- Added a governance-hotspot check script and reinforced protocol guidance so hotspot branches must re-sync before PR creation and merge.

## Impact
- Governance-sensitive branches now have an explicit guardrail against long-lived drift in shared control files.
