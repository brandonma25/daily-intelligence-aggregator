# PRD-4 — Default Topic Bootstrap

- confidence_level: `high`
- source_basis: `code, commit`
- related_files:
  - `src/lib/default-topics.ts`
  - `src/app/actions.ts`
  - `src/app/auth/callback/route.ts`
  - `src/app/auth/password/route.ts`
  - `supabase/schema.sql`

## Objective
- Ensure new accounts have enough default topic structure to generate a meaningful briefing immediately after onboarding.

## Scope
- Default topic seed definitions.
- Bootstrap behavior during auth completion and password onboarding.
- Schema support for default topic persistence.

## Explicit Exclusions
- Manual topic/source management surfaces formalized later in PRD-15.
- OAuth callback hardening and session-routing safeguards covered later in PRD-14.
- Personalized topic/entity preferences.

## Acceptance Criteria
- New users receive a baseline topic set without manual database setup.
- Post-auth and password onboarding paths can attach the default topic bootstrap.
- The system can generate a live or demo briefing with seeded topic structure.

## Risks
- Poor default topic choices can bias early briefing quality.
- Bootstrap behavior depends on auth flows completing successfully.

## Testing Requirements
- Verify new-user bootstrap creates the expected default topic set.
- Verify onboarding paths remain safe if topic seeding fails.
- Run install, lint, tests, and build before merge.
