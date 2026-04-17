# Release Automation Architecture Gaps

- related_prd_id: `PRD-22`
- related_files:
  - `docs/engineering/release-machine.md`
  - `docs/engineering/release-automation-operating-guide.md`
  - `scripts/release-check.sh`
  - `scripts/preview-check.js`
  - `scripts/prod-check.js`
- related_commit: `d016623`

## Problem
- Release validation was spread across ad hoc commands, which made merge-readiness checks inconsistent from branch to branch.

## Root Cause
- The repo had partial CI and testing coverage but no single release architecture tying local, preview, production, and human-only gates into one reusable system.

## Fix
- Added standard release entrypoints, route probes, release docs scaffolding, and operating documentation that defines the automated and human parts of the release path.

## Impact
- Release validation became more repeatable and more governable, even though preview wiring and human auth checks still remain external dependencies.
