# Google OAuth PKCE Callback Failure

- related_prd_id: `PRD-14`
- related_issue: `#36`
- related_issue_url: `https://github.com/brandonma25/daily-intelligence-aggregator/issues/36`
- related_files:
  - `src/app/auth/callback/route.ts`
  - `src/lib/auth.ts`
  - `src/components/auth/auth-modal.tsx`
- related_commits:
  - `d254c81`
  - `e8f63e9`
  - `9160be2`

## Problem
- Google OAuth could start, but callback completion and session persistence broke in hosted environments, especially on preview deployments.

## Root Cause
- Middleware touched the callback path too early, manual redirect handling interfered with PKCE verifier persistence, and callback URL resolution could leak to the wrong host.

## Fix
- Bypassed proxy auth logic on `/auth/callback`, let Supabase own the browser redirect flow, and resolved callback URLs from the active request origin and forwarded-host headers instead of a fixed app URL.

## Impact
- OAuth callback completion became host-aware and PKCE-safe enough to stop preview-to-production leakage and reduce callback-error failures.
