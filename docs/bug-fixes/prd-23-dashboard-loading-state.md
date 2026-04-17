# PRD 23 — Dashboard Loading-State Layer

## Issue Addressed
- The dashboard had ready, empty, and public states but no dedicated loading layer during route fetch and render.

## Root Cause
- `/dashboard` did not define a route-level `loading.tsx`, so users could hit an abrupt blank-to-render transition.

## Fix Implemented
- Added a dedicated dashboard loading route and a layout-faithful loading shell.
- Added neutral shell loading chrome so the route does not imply the wrong signed-in state while loading.

## Files Changed
- `src/app/dashboard/loading.tsx`
- `src/app/dashboard/loading.test.tsx`
- `src/components/dashboard/dashboard-loading-shell.tsx`
- `src/components/app-shell.tsx`

## Regression Risk
- Low to medium. The change is presentation-only, but `AppShell` now supports a loading mode that should be watched for visual regressions.

## Result
- `/dashboard` now shows an intentional structural loading layer that transitions into the final dashboard layout more cleanly.
