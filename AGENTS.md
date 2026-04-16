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
- Permanent workflow, protocol, agent-policy, testing-foundation, or repo-operating-system changes must live on a dedicated `docs/`, `ops/`, or testing-protocol branch unless they are intentionally part of the scoped feature being developed.

## 3. Branch Hygiene
- Codex must not leave local copies of docs-only or protocol-only changes in unrelated feature branch working trees after branch switching or after making a branch-scoped commit elsewhere.
- After creating a docs-only commit on a dedicated branch, verify whether the same files remain modified in the previous working tree and clean them if they are not intended to remain there.
- Before finishing any task involving branch switches or docs-only changes, run:
- `git status`
- `git branch --show-current`
- Confirm the working tree is clean of unintended modified files and that any staged or unstaged files belong to the intended scope of the current branch.

## 4. Validation Order
- Follow `Local -> Vercel Preview -> Production`.
- Treat Vercel preview as the source of truth for auth, cookies, redirects, SSR, and environment variables.
- Never use production as first-pass debugging.

## 5. Required Automated Checks
- Run `npm install`.
- Run `npm run lint || true`.
- Run `npm run test || true`.
- Run `npm run build`.
- Enforce the Dev Server Rule on port `3000`.
- Run `npm run dev`.
- Verify the app loads.
- If build fails, stop.

## 6. Preview Playwright Enforcement
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

## 7. Human Validation Required
- Request user validation for OAuth or login flows.
- Request user validation for session persistence.
- Request user validation for preview environment behavior.
- Request user validation for auth, SSR, or env-sensitive changes.

## 8. Documentation & Security
- Update repo-safe documentation for every serious feature or fix.
- Never commit or expose API keys, tokens, secrets, auth vulnerabilities, exploit steps, cookies, headers, or sensitive logs.

## 9. Merge Conditions
- Do not recommend merge unless build passes, local validation is complete, preview validation is confirmed, and docs are updated.
