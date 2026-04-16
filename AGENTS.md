# AGENTS.md — Codex Operating Rules

## 1. Required Reading
Before ANY substantial implementation work, you MUST read:

- `docs/engineering/engineering-protocol.md`
- `docs/engineering/test-checklist.md`
- `docs/engineering/prd-template.md`

## 2. Scope & Branching
- Always make an explicit branch decision.
- Keep one feature or fix per branch.
- Do not mix unrelated changes.
- Do not modify unrelated files.

## 3. Validation Order
- Follow `Local -> Vercel Preview -> Production`.
- Treat Vercel preview as the source of truth for auth, cookies, redirects, SSR, and environment variables.
- Never use production as first-pass debugging.

## 4. Required Automated Checks
- Run `npm install`.
- Run `npm run lint || true`.
- Run `npm run test || true`.
- Run `npm run build`.
- Enforce the Dev Server Rule on port `3000`.
- Run `npm run dev`.
- Verify the app loads.
- If build fails, stop.

## 5. Preview Playwright Enforcement
- For any UI-affecting, auth-affecting, routing-affecting, SSR-affecting, dashboard-affecting, or data-rendering change, evaluate whether Playwright coverage must be added or updated.
- After implementation is complete and a preview deployment URL is available, run the relevant automated test suite when technically possible.
- Always report:
- the exact preview URL
- the exact test commands run
- pass/fail results
- HTML report availability, if applicable
- which checks still require human validation
- Preview remains the source of truth for auth, cookies, redirects, SSR, and environment-specific behavior.
- Production is only for final sanity validation, not debugging.
- If automatic post-preview execution is not wired through CI/CD yet, treat test execution as a required workflow step and state explicitly that repo instruction files can require Codex to run tests, but cannot themselves trigger execution on deployment events.
- `AGENTS.md` and engineering protocol files are workflow rules only; they do not auto-run tests or trigger deployment hooks.

## 6. Human Validation Required
- Request user validation for OAuth or login flows.
- Request user validation for session persistence.
- Request user validation for preview environment behavior.
- Request user validation for auth, SSR, or env-sensitive changes.

## 7. Documentation & Security
- Update repo-safe documentation for every serious feature or fix.
- Never commit or expose API keys, tokens, secrets, auth vulnerabilities, exploit steps, cookies, headers, or sensitive logs.

## 8. Merge Conditions
- Do not recommend merge unless build passes, local validation is complete, preview validation is confirmed, and docs are updated.
