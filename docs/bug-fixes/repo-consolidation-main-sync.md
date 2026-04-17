# Repo Consolidation Validation Drift

- related_prd_id: `none`
- related_issue: `#41`
- related_issue_url: `https://github.com/brandonma25/daily-intelligence-aggregator/issues/41`
- related_files:
  - `src/components/app-shell.tsx`
  - `src/lib/data.test.ts`
- related_commit: `af784d5`

## Problem
- The consolidation branch was blocked by a lint failure in the app shell and stale data-layer tests that no longer matched merged behavior.

## Root Cause
- UI state was being set inside effects in the shell component, and the data tests still asserted pre-consolidation fallback behavior plus legacy helper exports.

## Fix
- Moved sidebar restoration into a lazy browser-only state initializer, removed the redundant route-change effect, and updated data tests to match the consolidated fallback behavior.

## Impact
- The branch regained a clean local validation path without reverting other consolidation work.
