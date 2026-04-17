# PRD-2 — Landing Page Auth Acquisition Surface

- confidence_level: `medium`
- source_basis: `code, commit, inference`
- related_files:
  - `src/app/page.tsx`
  - `src/components/auth/auth-modal.tsx`
  - `src/components/landing/hero.tsx`

## Objective
- Turn the homepage into a clearer signed-out entry surface that explains product value and gives users a direct path into authentication.

## Scope
- Landing-page hero conversion messaging.
- Auth modal entrypoints from the public homepage.
- Simplified signed-out navigation into the product.

## Explicit Exclusions
- Full server-side session routing handled later in PRD-14.
- Topic/source persistence and onboarding defaults.
- Homepage intelligence categorization.

## Acceptance Criteria
- A signed-out visitor can understand the product promise from the homepage.
- Authentication entrypoints are reachable from the landing flow without dead-end UI.
- Public homepage rendering stays stable after the simplified auth flow changes.

## Risks
- Early auth-entry UX can drift from later callback/session behavior.
- Signed-out landing behavior may still depend on environment-specific auth config.

## Testing Requirements
- Verify the homepage renders for signed-out users.
- Verify auth modal entrypoints open from the landing surface.
- Run install, lint, tests, and build before merge.
