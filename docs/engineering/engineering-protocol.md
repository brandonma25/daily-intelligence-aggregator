# Daily Intelligence Aggregator — Engineering & Product Management Protocol

## System Authority
- `AGENTS.md` = execution rules enforced by Codex
- `engineering-protocol.md` = canonical system definition
- `test-checklist.md` = validation reference
- `prd-template.md` = planning standard
- `pull_request_template.md` = merge enforcement

## 1. Core Operating Model
- The user is the PM and architect.
- Codex is the execution layer.
- Process integrity matters more than speed.
- Vercel preview is the truth layer for auth, cookies, redirects, SSR, and environment-variable behavior.
- Production is not the first debugging environment.

## 2. Product Layers
- Data Layer: Supabase schema, persistence, ingestion, and data contracts.
- Intelligence Layer: ranking, summarization, transformation, and application logic that turns raw data into useful intelligence.
- Experience Layer: Next.js routes, rendering, navigation, signed-in and signed-out behavior, and user-facing flows.
- One task should stay scoped to one layer unless the user explicitly approves cross-layer work.

## 3. PRD Standard
- Every PRD must include:
- Objective
- Scope
- Explicit exclusions
- Acceptance criteria
- Risks
- Testing requirements
- Risks must explicitly consider:
- auth or session behavior
- SSR versus client mismatch
- environment mismatch
- data edge cases
- regression risk

## 4. Codex Prompt Standard
- Every substantial prompt must include:
- branch decision
- scope boundaries
- protected files or systems
- testing instructions
- expected behavior
- documentation update requirement
- sanitization rule

## 5. Dev Server Rule
- Before starting the dev server:
- check port `3000`
- kill any existing process if needed
- then run `npm run dev`

## 6. Validation Sequence
- Validation order is `Local -> Vercel Preview -> Production`.
- Local is for code correctness, rendering checks, and fast debugging.
- Preview is the real deployment-like truth layer.
- Production is for final sanity checks only.
- If auth, cookies, redirects, SSR, or environment logic has not been tested in preview, it is not validated.

## 7. Preview Playwright Policy
- For any UI-affecting, auth-affecting, routing-affecting, SSR-affecting, dashboard-affecting, or data-rendering change, Codex must evaluate whether Playwright coverage needs to be added or updated.
- After implementation is complete and a preview deployment URL is available, Codex must run the relevant automated test suite when technically possible.
- Codex must report:
- the exact preview URL
- the exact test commands run
- pass/fail results
- HTML report availability, if applicable
- which checks still require human validation
- Preview remains the source of truth for auth, cookies, redirects, SSR, and environment-specific behavior.
- Production is only for final sanity validation, not debugging.

## 8. Default Automated Testing Block
- Codex should run:
- `npm install`
- `npm run lint || true`
- `npm run test || true`
- `npm run build`
- the Dev Server Rule
- `npm run dev`
- basic smoke validation
- a concise test report
- a repo-safe docs update
- Build failure is blocking.
- Lint and test failures must be reported explicitly.

## 9. Workflow Rules Versus Automation
- `AGENTS.md` and engineering protocol files are workflow rules only.
- These files can require Codex to run tests as part of the workflow, but they do not themselves trigger execution on preview deployment events.
- True automatic post-preview execution requires a real automation mechanism such as GitHub Actions or another CI runner.
- Until that automation exists and is validated, Codex must treat post-preview automated test execution as a required workflow step rather than assuming deployment events will trigger it automatically.

## 10. Human Validation Requirements
- The user must validate in preview when relevant:
- OAuth flow
- session persistence
- redirects
- signed-in versus signed-out truth
- SSR behavior
- env-dependent behavior
- After merge to `main`, the user must perform a concise production sanity check.

## 11. Git and Branch Discipline
- One feature or fix per branch.
- No unrelated changes in the same branch.
- No direct experimentation in `main`.
- Merge only after validation and docs updates are complete.
- If a change is policy-level, testing-foundation-level, or repo-operating-system-level, Codex must default to a dedicated docs, ops, or testing-protocol branch rather than a product feature branch unless the user explicitly scopes it otherwise.

## 12. Branch Hygiene Check
- Permanent workflow, protocol, or agent-policy changes must be isolated on a dedicated docs, ops, or testing-protocol branch unless they are intentionally part of the scoped feature being developed.
- Codex must not leave local copies of docs-only or protocol-only changes in unrelated feature branch working trees after branch switching or branch-scoped commits.
- After creating a docs-only commit on a dedicated branch, Codex must verify whether the same files remain modified in the previous working tree and clean them if they are not intended to remain there.
- Before finishing work, Codex must run a branch hygiene check covering:
- current branch
- working tree status
- staged versus unstaged changes
- whether modified files belong to the intended scope of that branch
- Before ending any task involving branch switches or docs-only changes, Codex must run:
- `git status`
- `git branch --show-current`
- Confirm that no unintended modified files remain in the wrong branch working tree.

## 13. Merge Checklist
- Branch is correct and isolated.
- Local validation passed.
- Preview validation passed.
- Docs updated.
- No blockers remain.

## 14. Debugging Protocol
- Classify the environment first.
- Classify the issue type next.
- Fix the issue at the lowest valid layer.
- Retest upward from local to preview to production sanity.

## 15. Documentation Security Policy
- Allowed:
- PRD summaries
- feature briefs
- bug-fix summaries
- testing notes
- Forbidden:
- secrets
- tokens
- OAuth credentials
- auth vulnerabilities
- exploit steps
- sensitive logs
- cookies
- headers
- callback payloads
- infrastructure weaknesses
- Decision rule: "Does this help a future maintainer more than an attacker?"

## 16. Future State
- Intended end state:
- preview deployment completes
- automated Playwright suite runs automatically via CI
- results are attached to the PR or branch workflow
- Until CI-based preview test automation is enabled and validated, Codex must run the required post-preview suite as part of the workflow and report the results explicitly.

## 17. Expected Docs Structure
- `docs/prd-summaries/`
- `docs/bug-fixes/`
- `docs/testing/`

## 18. Enforcement Behavior
- Do not recommend merge when:
- preview validation is missing for env, auth, cookies, redirects, or SSR work
- scope is mixed
- docs are missing
- build is broken
- known blockers remain
