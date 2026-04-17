# PRD 23 — Dashboard Loading-State Layer

## Summary
- Add a route-level loading layer for `/dashboard` so the page feels stable and intentional while the dashboard data resolves.

## Scope
- Add `src/app/dashboard/loading.tsx`.
- Add a dashboard-specific loading shell aligned to the current dashboard layout.
- Reuse existing shell and panel styling where possible.

## Implementation Notes
- Keep the loading shell presentation-only with no dashboard business logic.
- Mirror the current section order: header, overview metrics, top events, coverage map, and topic briefing blocks.
- Use restrained structural placeholders instead of fake story content or spinner-only loading.

## Risks
- Layout drift from the real dashboard could make the transition feel cheap.
- Shared-shell loading chrome could imply the wrong auth state if not neutralized.
- Route-level loading must stay isolated from data fetching to avoid SSR regressions.

## Testing Notes
- Validate local render, build, and dashboard route load.
- Confirm the loading shell appears during `/dashboard` transition.
- Confirm ready, public, and signed-in dashboard states still render after load.
