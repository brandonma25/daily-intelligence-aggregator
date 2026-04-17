# Auth Test Stability

- related_prd_id: `PRD-14`
- related_issue: `#35`
- related_issue_url: `https://github.com/brandonma25/daily-intelligence-aggregator/issues/35`
- related_files:
  - `src/components/auth/auth-modal.test.tsx`
  - `src/lib/data.auth.test.ts`
  - `src/components/auth/auth-modal.tsx`
- related_commit: `251e02c`

## Problem
- Auth-related tests passed in isolation but failed unpredictably in broader suite runs, making release validation noisy and unreliable.

## Root Cause
- The tests depended on dynamic imports, suite-level module cache behavior, and invasive `window.location` replacement, which made mock ordering fragile across the wider test run.

## Fix
- Converted tests to stable hoisted mocks with normal imports, switched URL setup to `window.history.replaceState(...)`, and reset only the relevant mocks between cases.

## Impact
- Auth test runs became deterministic enough to support the release-validation path without changing production auth behavior.
