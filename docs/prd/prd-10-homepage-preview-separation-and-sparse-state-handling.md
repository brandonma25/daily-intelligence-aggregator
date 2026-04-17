# PRD-10 — Homepage Preview Separation and Sparse-State Handling

- confidence_level: `medium`
- source_basis: `code, commit, inference`
- related_files:
  - `src/app/page.tsx`
  - `src/app/dashboard/page.tsx`
  - `src/components/landing/homepage.tsx`
  - `src/components/guest-value-preview.tsx`
  - `src/lib/homepage-model.ts`
  - `src/lib/homepage-taxonomy.ts`

## Objective
- Separate the public homepage preview experience from the signed-in dashboard while making sparse categories and empty states feel intentional instead of broken.

## Scope
- Homepage-versus-dashboard surface separation.
- Sparse-category and empty-state messaging.
- Guest-value preview components for signed-out users.

## Explicit Exclusions
- Full homepage intelligence-surface consolidation documented later in PRD-17.
- Auth/session callback hardening handled later in PRD-14.
- Personalization and continuity experiences.

## Acceptance Criteria
- The homepage can serve as a public preview rather than a thin copy of the dashboard.
- Sparse categories and empty states explain missing coverage instead of rendering blank rails.
- Guest-value messaging remains available when live user data is unavailable.

## Risks
- Preview/homepage behavior can drift from dashboard truth if the surfaces evolve independently.
- Sparse-state rules depend on the quality of upstream ranking and categorization inputs.

## Testing Requirements
- Verify homepage and dashboard present distinct experiences.
- Verify sparse and empty homepage states render intentionally.
- Run install, lint, tests, and build before merge.
