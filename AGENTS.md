# Daily Intelligence Aggregator Agent Guide

## Repo workflow
- Read [docs/engineering-protocol.md](docs/engineering-protocol.md) before substantial implementation work.
- Keep each task scoped to one product layer unless the user explicitly approves a cross-layer change.
- Do not change app behavior, auth logic, env handling, or dependencies for documentation-only tasks.

## Branching and scope
- Make an explicit branch decision before editing.
- Use one branch per feature or fix.
- Do not mix unrelated changes into the same branch.

## Validation order
- Follow `Local -> Preview -> Production`.
- Treat preview as the source of truth for auth, cookies, redirects, SSR, and env-driven behavior.
- Never use production as first-pass debugging.

## Required automated checks
- Run `npm install`.
- Run `npm run lint || true`.
- Run `npm run test || true`.
- Run `npm run build`.
- Before `npm run dev`, enforce the Dev Server Rule: check `lsof -i :3000`, kill any stale PID with `kill -9 <PID>`, then start the dev server.
- Report lint and test failures explicitly. Treat build failure as blocking.

## Required docs updates
- Update repo-safe documentation for meaningful changes.
- Use `docs/prd-summaries/`, `docs/bug-fixes/`, or `docs/testing/` when applicable.
- Keep docs concise, structured, repeatable, and safe for a public repo.

## Security and sanitization
- Never commit secrets, tokens, cookies, headers, raw callback payloads, sensitive logs, exploit details, or private infrastructure information.
- Use this rule for repo docs: does this help a future maintainer more than it helps an attacker?

## Done definition
- Scope is clean.
- Automated checks are reported.
- Preview validation requirements are called out when relevant.
- Documentation is updated.
- Remaining human validation is stated clearly.
