# PRD-28 — PR Classification Audit Layer

- PRD ID: `PRD-28`
- Canonical file: `docs/prd/prd-28-pr-classification-audit-layer.md`
- Feature system row: update `docs/product/feature-system.csv` with matching `prd_id` and `prd_file`

## Objective
- Make pull-request classification more auditable so governance decisions about docs-only, trivial, material, and new-system work are inspectable after the fact.

## Problem
- The release-governance gate classifies PR scope, but long-term trust is weaker if that classification logic and output are not explicitly auditable.

## Scope
### Must Do
- Preserve PR classification criteria and output in a clear audit layer.
- Make it easy to understand why a PR was treated as docs-only, material, or new-system work.
- Keep the audit layer aligned with current gate behavior.

### Must Not Do
- Duplicate every CI log artifact inside repo docs.
- Collapse classification audit into generic release notes.

## Success Criteria
- PR classification outcomes are understandable and reviewable after the gate runs.
- Future governance changes can compare expected versus actual classification behavior.

## Done When
- One canonical PRD exists for PR classification auditability.
