# PRD-5 — Google OAuth Onboarding Entry

- confidence_level: `medium`
- source_basis: `code, commit, inference`
- related_files:
  - `src/components/auth/auth-modal.tsx`
  - `src/app/actions.ts`
  - `src/app/auth/callback/route.ts`
  - `src/components/app-shell.tsx`
  - `src/app/page.tsx`

## Objective
- Add the first Google OAuth entry path so users can start onboarding through a provider-based login instead of password-only flows.

## Scope
- Google OAuth launch entrypoints in the auth modal.
- Homepage/app-shell integration for provider login.
- Initial onboarding linkage between OAuth completion and seeded defaults.

## Explicit Exclusions
- Callback-host correctness, PKCE safety, and durable session routing fixed later under PRD-14 bug work.
- Preview/production auth-environment governance.
- Full account-management settings.

## Acceptance Criteria
- Users can initiate Google OAuth from the product’s signed-out entry surface.
- Successful provider sign-in can flow into the app’s onboarding path.
- OAuth entry does not remove access to existing auth options.

## Risks
- Provider login remains sensitive to callback-host and session-cookie handling.
- This first-pass flow can appear successful before later auth hardening resolves persistence edge cases.

## Testing Requirements
- Verify provider-login entrypoints render and launch from the auth surface.
- Verify successful onboarding can reach the app after OAuth completion in configured environments.
- Run install, lint, tests, and build before merge.
