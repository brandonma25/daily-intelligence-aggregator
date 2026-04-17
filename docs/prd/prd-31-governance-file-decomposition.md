# PRD-31 — Governance File Decomposition

- PRD ID: `PRD-31`
- Canonical file: `docs/prd/prd-31-governance-file-decomposition.md`
- Feature system row: update `docs/product/feature-system.csv` with matching `prd_id` and `prd_file`

## Objective
- Reduce governance-file contention by decomposing oversized or overly coupled governance responsibilities into clearer files with narrower ownership.

## Problem
- When too many governance concerns accumulate in a small set of shared files, hotspot conflicts become more frequent and harder to review safely.

## Scope
### Must Do
- Identify governance files that combine too many responsibilities.
- Propose decomposition boundaries that reduce hotspot pressure without losing clarity.
- Preserve one canonical source of truth per governance concern.

### Must Not Do
- Split files arbitrarily without improving ownership or conflict isolation.
- Create duplicate rules across decomposed governance documents.

## Success Criteria
- Governance responsibilities can be distributed more cleanly across files.
- Hotspot merge pressure is reduced without weakening the operating system.

## Done When
- One canonical PRD exists for governance file decomposition planning.
