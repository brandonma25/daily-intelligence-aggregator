# PRD-26 — Governance Gate Promotion Decision Layer

- PRD ID: `PRD-26`
- Canonical file: `docs/prd/prd-26-governance-gate-promotion-decision-layer.md`
- Feature system row: update `docs/product/feature-system.csv` with matching `prd_id` and `prd_file`

## Objective
- Add a decision layer that determines when documentation-only governance checks should be promoted into stronger release-blocking requirements.

## Problem
- Governance checks can stay too soft or too rigid unless the repo defines when a docs-only safeguard should become a mandatory release gate.

## Scope
### Must Do
- Define promotion criteria for governance checks based on change materiality and operational risk.
- Clarify when a warning should remain advisory versus become blocking.
- Keep promotion logic aligned with the release-governance gate.

### Must Not Do
- Duplicate the existing validator logic line by line.
- Promote trivial docs cleanup into blocking release requirements without justification.

## Success Criteria
- The repo has a clear promotion path from advisory governance checks to blocking gate behavior.
- Promotion decisions stay tied to risk and scope rather than guesswork.

## Done When
- One canonical PRD exists for governance-gate promotion decisions.
