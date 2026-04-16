# Repo Consolidation — Integration Notes

## Merge Decisions
- Merged:
  - `feature/playwright-e2e-foundation`
  - `chore/add-ci-workflow`
  - `feature/why-this-matters-final-merge-fix`
  - `feature/signal-filtering-layer`
- Held:
  - `feature/auth-preview-host-fix`
- Excluded:
  - stale, duplicate, superseded, or unsafe branches identified during audit

## Conflicts Resolved
- `docs/engineering/engineering-protocol.md`
  Resolved during the Playwright foundation merge by keeping the newer canonical protocol wording already present on `origin/main` and preserving the stronger Playwright reporting requirements.

## Outstanding Validation Failures
- Lint:
  - `src/components/app-shell.tsx:56`
  - `src/components/app-shell.tsx:67`
- Unit tests:
  - `src/lib/data.auth.test.ts`
  - `src/components/auth/auth-modal.test.tsx`
  - `src/lib/data.test.ts`

## Operational Findings
- Local `main` and `origin/main` were divergent at the start of the audit, so consolidation was based on `origin/main` in a separate worktree.
- The original repo worktree contained active uncommitted feature work, so no consolidation steps were performed there.
- Local Playwright execution is wired, but browser launch is blocked in this environment by macOS sandbox/permission failures.
