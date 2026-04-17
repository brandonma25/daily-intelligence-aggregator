# PRD-28 — PRD Audit Metadata Enforcement

- PRD ID: `PRD-28`
- Canonical file: `docs/prd/prd-28-prd-audit-metadata-enforcement.md`
- Feature system row: update `docs/product/feature-system.csv` with matching `prd_id` and `prd_file`

## Objective
- Make canonical PRDs more auditable by enforcing lightweight metadata about confidence, evidence basis, and key implementation files where historical inference is required.

## Problem
- Backfilled or inferred PRDs can look equally certain as directly implemented features unless the repo records how confident the document is and what evidence supports it.

## Scope
### Must Do
- Define audit metadata expectations for inferred or backfilled PRDs.
- Link PRDs to their strongest code and commit evidence.
- Keep metadata concise enough to remain maintainable.

### Must Not Do
- Replace the functional PRD body with metadata alone.
- Require sensitive implementation detail or internal logs in PRDs.

## Success Criteria
- Historical and inferred PRDs show confidence and evidence basis clearly.
- Future governance work can distinguish directly evidenced PRDs from lower-confidence reconstructions.

## Done When
- One canonical PRD exists for PRD audit metadata enforcement.
