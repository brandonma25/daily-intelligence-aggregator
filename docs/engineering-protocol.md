# Daily Intelligence Aggregator — Engineering & Product Management Protocol

## 1. Core operating model
- The user is the product manager and architect. They define goals, approve scope, and provide final human validation.
- Codex is the execution layer. Codex translates approved scope into concrete implementation, testing, documentation, and delivery steps.
- Process integrity takes priority over speed. Clear scope, validation order, and documentation matter more than fast but ambiguous changes.
- Vercel preview is the source of truth for auth, cookies, redirects, SSR behavior, and environment-variable-driven logic.
- Production is never the first debugging ground. Fixes should be understood locally and validated in preview before production is used for final sanity checks.

## 2. Product layer model
- The repo should be reasoned about in three layers:
- Data layer: persistence, schemas, Supabase reads and writes, ingestion pipelines, and data contracts.
- Intelligence layer: ranking, summarization, enrichment, transformations, and business logic that turns raw inputs into useful intelligence.
- Experience layer: Next.js routes, UI states, signed-in and signed-out behavior, rendering, navigation, and user-facing workflows.
- Default rule: one Codex task should stay scoped to one layer unless the user explicitly approves a cross-layer change.
- If a task appears to cross layers, Codex should call that out before implementation and confirm that the broader scope is intentional.

## 3. PRD standard
- Every PRD must include:
- Objective
- Scope
- Explicit exclusions
- Acceptance criteria
- Risks
- Testing requirements
- The risks section must explicitly consider, where relevant:
- Auth and session behavior
- SSR versus client mismatch
- Environment variable mismatch
- Data edge cases
- Regression risk
- A PRD is incomplete if it does not define what is intentionally out of scope and how success will be validated.

## 4. Codex prompt standard
- Every substantial Codex prompt must include:
- Branch decision
- Scope boundaries
- Protected files or systems
- Testing instructions
- Expected behavior
- Documentation update requirement
- Sanitization rule for repo docs
- If the prompt is missing one of these elements, Codex should infer the safest reasonable default and state that assumption clearly in its working notes or final summary.
- Documentation instructions must always assume a public-repo standard: practical, sanitized, and safe to retain long term.

## 5. Dev Server Rule
- Before running the dev server, always check for an existing process on port `3000` and kill it if necessary.
- Expected command pattern:
- `lsof -i :3000`
- `kill -9 <PID>` if needed
- `npm run dev`
- This avoids misleading results from stale processes, duplicate servers, or testing the wrong build.
- If no process is bound to port `3000`, proceed directly to `npm run dev`.

## 6. Validation sequence
- Mandatory validation order:
- Local
- Vercel preview
- Production
- Environment purpose:
- Local = code correctness, rendering checks, and fast debugging
- Preview = deployment-like truth for auth, cookies, redirects, SSR, and environment-variable behavior
- Production = final sanity and regression check only
- If auth, cookies, redirects, SSR, or environment-driven logic has not been tested in preview, it is not considered validated.
- Production should never be used as the first-pass debugging environment.

## 7. Default automated testing block for Codex
- Unless the task explicitly says otherwise, Codex should run the maximum safe automated checks for the repo:
- `npm install`
- `npm run lint || true`
- `npm run test || true`
- `npm run build`
- Enforce the Dev Server Rule
- `npm run dev`
- Perform a basic smoke check appropriate to the task
- Generate a concise test report
- Update testing documentation when the task changes expected behavior or validation steps
- Build failure is blocking.
- Lint or test failures must be reported explicitly, even when they are allowed to continue for diagnostic purposes.
- Environment-sensitive validation still requires human confirmation in preview when relevant.

## 8. Human validation requirements
- The user must validate in preview when relevant:
- OAuth login flow
- Session persistence
- Redirect behavior
- Signed-in versus signed-out truth
- SSR behavior
- Environment-sensitive behavior
- After merge to `main`, the user must perform a concise production sanity check for the affected flow.
- Codex must clearly separate completed automated validation from remaining human validation.

## 9. Git and branch discipline
- One feature or fix per branch.
- No unrelated changes in the same branch.
- No direct experimentation in `main`.
- If the current branch does not match the task, create a dedicated branch before making changes.
- Merge only after local validation, preview validation when relevant, and required documentation updates are complete.

## 10. Documentation protocol
- Repo-safe docs can include:
- PRD summaries
- Feature briefs
- Bug-fix summaries
- Testing notes
- All repo docs must be:
- Concise
- Structured
- Repeatable
- Sanitized for public exposure
- Never include:
- API keys
- Tokens
- Secrets
- OAuth credentials
- Auth bypass details
- Exploit steps
- Sensitive logs
- Cookies
- Headers
- Callback payloads
- Infrastructure weaknesses
- Decision rule:
- "Does this help a future maintainer more than it helps an attacker?"

## 11. Expected docs structure
- `docs/prd-summaries/`
- `docs/bug-fixes/`
- `docs/testing/`
- New repo-safe documentation should be placed in the most specific matching folder.
- If a new docs category becomes necessary, it should be added deliberately rather than ad hoc.

## 12. Enforcement behavior
- Codex should not recommend merge when:
- Preview validation is missing for environment, auth, cookies, redirects, or SSR work
- Scope is mixed without approval
- Docs are missing
- The build is broken
- Known blockers remain
- When a task is not fully validated, Codex must say exactly what remains open and who must verify it.
