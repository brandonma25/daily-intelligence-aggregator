# PRD 23 — Dashboard Loading-State Layer Testing

## Local Test Steps
1. Run `npm install`.
2. Run `npm run lint`.
3. Run `npm run test`.
4. Run `npm run build`.
5. Clear existing Next.js dev servers, then run `npm run dev`.
6. Open `http://localhost:3000/dashboard`.
7. Refresh and navigate into `/dashboard` from another route to observe the loading layer.

## Preview Test Steps
1. Open `https://<preview-deployment-url>/dashboard`.
2. Check a signed-out load and, if available, a signed-in load.
3. Refresh the route and navigate in from another page to confirm the loading layer appears cleanly.

## Expected Results
- Users can immediately tell the dashboard is loading.
- The loading shell matches dashboard hierarchy and spacing.
- The final dashboard replaces the loading shell without obvious broken shift or hydration issues.

## Human UX Validation Checks
- The loading layer feels premium rather than noisy.
- No fake article headlines or misleading copy appear.
- Signed-out and signed-in entry both feel oriented and trustworthy.
