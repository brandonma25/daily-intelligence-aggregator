# Repo Consolidation — Testing Report

## Branch Under Test
- `feature/repo-consolidation-main-sync`

## Commands Run
- `npm install`
- `npm run lint`
- `npm run build`
- `npm run test`
- `npx playwright test`
- `npm run dev`
- `curl -I -s http://localhost:3000`
- `curl -I -s http://localhost:3000/dashboard`

## Results
- `npm install`
  Passed. One high-severity vulnerability remains in the dependency audit output.
- `npm run lint`
  Failed with known `react-hooks/set-state-in-effect` errors in `src/components/app-shell.tsx`.
- `npm run build`
  Passed after each accepted merge step and in the final branch state.
- `npm run test`
  Failed.
  Persistent failing areas:
  - `src/lib/data.auth.test.ts`
  - `src/components/auth/auth-modal.test.tsx`
  - `src/lib/data.test.ts`
- `npx playwright test`
  Failed in this environment because Chromium/Firefox/WebKit could not launch under local macOS sandbox restrictions.
- Local dev run
  Passed.
  Local URL:
  - `http://localhost:3000`
- Local smoke
  - `/` returned HTTP `200`
  - `/dashboard` terminal curl check did not complete successfully in this environment

## Validation Status
- Install: Passed
- Lint: Failed
- Build: Passed
- Tests: Failed
- Playwright / E2E: Failed in environment
- Local run: Passed
- Local smoke: Passed with limitation

## Preview / Production Notes
- Preview validation was not run in this session.
- Auth-, redirect-, session-, SSR-, and env-sensitive work still require preview and human validation before any merge-to-main recommendation.
