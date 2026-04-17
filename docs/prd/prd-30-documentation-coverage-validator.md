# PRD-30 — Documentation Coverage Validator

- PRD ID: `PRD-30`
- Canonical file: `docs/prd/prd-30-documentation-coverage-validator.md`
- Feature system row: update `docs/product/feature-system.csv` with matching `prd_id` and `prd_file`

## Objective
- Validate that material system changes have the required supporting documentation coverage before they can be promoted through release governance.

## Problem
- A PR can satisfy basic schema checks while still missing the right level of PRD, testing, bug-fix, or engineering documentation for the scope of change.

## Scope
### Must Do
- Check whether required documentation categories are present for material change classes.
- Reuse existing PR classification and CSV validation outputs where possible.
- Keep coverage validation aligned with the release-governance gate.

### Must Not Do
- Require docs for trivial typo-only cleanup.
- Duplicate full semantic validation that already lives in other scripts.

## Success Criteria
- Material changes fail clearly when expected documentation coverage is missing.
- Documentation requirements stay proportional to change scope.

## Done When
- One canonical PRD exists for documentation coverage validation.
