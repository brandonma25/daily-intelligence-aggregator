# OAuth Session Persistence

- related_prd_id: `PRD-14`
- related_issue: `#37`
- related_issue_url: `https://github.com/brandonma25/daily-intelligence-aggregator/issues/37`
- related_files:
  - `src/app/auth/callback/route.ts`
  - `src/lib/auth.ts`
  - `src/lib/data.ts`
  - `src/components/auth/auth-modal.tsx`
- related_commits:
  - `f40dfcf`
  - `fc3bbef`
  - `ef78092`

## Problem
- Google sign-in could appear to complete, but the signed-in session did not always survive callback finalization, refresh, or later navigation.

## Root Cause
- Auth env detection could falsely report missing config, some OAuth returns landed outside the expected callback path, and callback bootstrap failure could discard a response that already contained fresh auth cookies.

## Fix
- Corrected browser-side auth env detection, normalized stray `/?code=...` returns into the callback flow, and preserved successful session exchange behavior even when post-login bootstrap work failed later in the route.

## Impact
- OAuth login stopped degrading into false signed-out states as often, and callback success became much more likely to persist across refresh and navigation.
