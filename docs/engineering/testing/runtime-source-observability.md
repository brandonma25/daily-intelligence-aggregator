# Runtime Source Observability Testing

Date: 2026-04-19

Branch: `feature/prd-42-runtime-source-observability`

## Scope

Added ID-only observability for runtime source resolution under `PRD-42`.

## Focused Local Validation

Commands:

```bash
npm install
npm run lint || true
npm run test || true
npm run test -- src/lib/source-defaults.test.ts src/lib/pipeline/ingestion/index.test.ts src/lib/pipeline/index.test.ts src/lib/source-policy.test.ts src/lib/source-catalog.test.ts
npm run build
```

Results:

- `npm install`: completed; npm reported one high-severity dependency audit item.
- `npm run lint || true`: passed.
- `npm run test || true`: passed, 39 files / 198 tests.
- Focused source-observability tests: passed, 5 files / 21 tests.
- `npm run build`: passed after fixing a TypeScript literal-set typing issue in the new helper.

Coverage:

- MVP public default source IDs remain unchanged.
- Donor fallback default IDs remain unchanged.
- MIT Technology Review remains the only probationary runtime source.
- No-argument ingestion exposes a safe source-resolution snapshot.
- Supplied public MVP sources remain separate from probationary runtime activation.
- Runtime source-resolution logs omit feed URLs and registry dumps.
- BBC and CNBC remain excluded from source catalog and source preference treatment.

## Remaining Validation

Dev server rule was followed on port `3000`:

- Checked for existing listeners and Next.js/node dev-server processes.
- No stale listener was present.
- Started `npm run dev`.
- Local URL: `http://localhost:3000`.
- `curl -I http://localhost:3000` returned `HTTP/1.1 200 OK`.
- Stopped the dev server after validation.

Playwright:

- `npx playwright test --project=webkit`: passed, 11 tests.
- `npx playwright test --project=chromium tests/homepage.spec.ts:19 tests/dashboard.spec.ts:52`: passed, 2 tests.
- `npx playwright test --project=chromium`: one existing mobile navigation test remained flaky in full-suite Chromium runs. The same test passed when isolated, and this branch did not modify UI, auth, routing, or navigation code.

Preview validation remains required for deployment-environment truth; local tests do not prove production network behavior.
