# Branch Contamination Reconstruction

## Summary

On 2026-04-20, the main workspace opened on `codexfeature/prd-43-49-mvp-ui-artifact-alignment` with mixed uncommitted local changes. The requested repair branch, `fix/branch-contamination-reconstruction`, was created only after `main` was checked out, pulled, and confirmed as the base ancestor.

The contaminated source branch `feature/prd-43-49-mvp-ui-artifact-alignment` was preserved with a WIP commit before reconstruction. The original source branch was not deleted, rebased, force-pushed, or otherwise rewritten.

## Initial State

- Workspace: `/Users/bm/Documents/daily-intelligence-aggregator-main`
- Initial attached branch: `codexfeature/prd-43-49-mvp-ui-artifact-alignment`
- Requested contaminated source branch: `feature/prd-43-49-mvp-ui-artifact-alignment`
- Repair branch: `fix/branch-contamination-reconstruction`
- Updated `main` context: `c124f56` (`Merge pull request #76 from brandonma25/fix/public-briefing-auth-ui`)
- Dirty unstaged files found before preservation:
  - `package-lock.json`
  - `package.json`
  - `src/app/settings/page.tsx`
  - `src/app/sources/page.tsx`
  - `src/app/topics/page.tsx`
- Staged files: none
- Untracked files: none

The exact requested source branch existed locally and was not owned by another worktree. The dirty state was first seen while the workspace was attached to the similarly named `codexfeature/...` branch, then preserved on the requested `feature/...` source branch.

## Preservation Snapshot

- Snapshot commit: `3f3c83b44edc9defad1b86ec612c565ff812b0bb`
- Commit message: `WIP: preserve mixed PRD-43-49 state before scoped reconstruction`
- Preserved changes:
  - Added `@react-email/components` and `resend` dependency entries in `package.json` and `package-lock.json`
  - Deleted `src/app/settings/page.tsx`
  - Deleted `src/app/sources/page.tsx`
  - Deleted `src/app/topics/page.tsx`
- Untracked files included: no

## Bucket Rationale

| Bucket | Scope | Evidence | Reconstruction decision |
| --- | --- | --- | --- |
| A | Email delivery dependency preparation | `package.json`, `package-lock.json` add React Email and Resend packages | Reconstructed as a dependency-only branch because it is file-scoped and reviewable. |
| B | Settings, sources, and topics route deletion | Three route files are deleted together | Reconstructed as a quarantine branch because the change is coherent as evidence but not product-safe without navigation and route-deprecation review. |
| C | Responsive app shell and account UI evidence | Existing `stash@{0}` includes app-shell, account, avatar, layout header, tests, docs, generated artifacts, and stale branch base evidence | Not reconstructed from the current source snapshot. The stash remains preserved as historical fallback because it mixes product UI, docs, generated files, and stale-base work. |
| D | PRD-44 through PRD-49 branch setup | Local PRD-44 through PRD-49 branches point at `f1967b5` and are behind `main` | Not converted into fake feature branches because no unique current branch diffs were present there. |

## Reconstructed Branches

### `chore/branch-contamination-email-deps`

- Base: updated `main`
- Commit: `5016d59`
- Files moved from preservation snapshot:
  - `package.json`
  - `package-lock.json`
- Move type: full file restore from snapshot, restricted to dependency files
- Excluded:
  - route deletions
  - app shell/account/history/source/topic UI work from the older stash
- Residual risk:
  - dependencies are currently unreferenced by app code
  - package-lock metadata includes transitive package deprecation notices that should be reviewed before merge

### `chore/branch-contamination-route-deletions`

- Base: updated `main`
- Commit: `e256ebc`
- Files moved from preservation snapshot:
  - `src/app/settings/page.tsx`
  - `src/app/sources/page.tsx`
  - `src/app/topics/page.tsx`
- Move type: full file restore from snapshot, producing deletion-only diff
- Excluded:
  - package dependency changes
  - older stash UI/app-shell/account changes
- Residual risk:
  - this branch is review/quarantine evidence, not merge-ready product work
  - deleting these routes may leave navigation, docs, tests, and user expectations inconsistent unless a deliberate route retirement plan is approved

## Branches Left Untouched

- `feature/prd-43-49-mvp-ui-artifact-alignment` remains preserved with the WIP snapshot commit.
- `codexfeature/prd-43-49-mvp-ui-artifact-alignment` remains untouched as the originally attached malformed/local branch name.
- Existing PRD-44 through PRD-49 worktrees and branches were not deleted, rebased, force-pushed, or cleaned up.
- Existing stashes were not popped, dropped, or rewritten.

## Why No History Rewrite Was Used

This was a branch-contamination repair, not a history cleanup. The safe path was to preserve the mixed local evidence, create new scoped branches from updated `main`, and make each replacement branch independently reviewable and revertable. Rewriting, rebasing old merged branches, force-pushing, or deleting stale worktrees would have risked losing evidence and expanding the task beyond the requested repair.

## Validation Performed

- Confirmed `fix/branch-contamination-reconstruction` has `main` as an ancestor.
- Confirmed both reconstructed branches were created from updated `main`.
- Inspected `git diff --name-status` and `git diff --stat` for each reconstructed branch.
- Ran `git diff --check` for each reconstructed branch.
- Confirmed reconstructed branches had clean working trees after commit.

Broader build, lint, and Playwright validation were not run because the task was scoped to branch reconstruction and the route-deletion branch remains a quarantine branch pending human product review.
