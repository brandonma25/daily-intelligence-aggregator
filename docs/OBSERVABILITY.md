# Observability — Boot Up Pipeline

The pipeline has four layers of visibility, each answering a different question. Use the right tier for the failure mode you're chasing.

## Four-tier model

| Tier | Surface | Question it answers |
|---|---|---|
| 1 | **cron-job.org execution log** | Did the HTTP call to Vercel succeed? |
| 2 | **Vercel function logs** | Did the function complete without throwing? |
| 3 | **Notion Pipeline Log** | Did the pipeline write the expected rows? |
| 4 | **Notion Source Health Log** | Which sources contributed (or failed) today? |

Each tier is the right place for a different class of question. Reaching for Vercel logs to answer "did the queue get populated?" is the wrong tool — it'll be there if the function completed even on a zero-row day. The Pipeline Log is the right tool for that question. Conversely, reaching for the Pipeline Log to debug a 500 from the route hander is wrong — that's a Vercel logs question.

## Decision tree — "today's editorial run looks broken"

1. **Start at cron-job.org** (Tier 1). Did the scheduled job fire? Did the HTTP response come back 200?
   - **No response / timeout** → the request never reached Vercel. Check cron-job.org config (URL, auth header). Move to Tier 2 only if cron-job.org confirms a successful send.
   - **5xx response** → the function errored. Go to Tier 2.
   - **200, but you're missing rows** → go to Tier 3.

2. **Vercel function logs** (Tier 2). Look for the most recent invocation of `/api/cron/fetch-editorial-inputs`.
   - **Exception thrown** → the stack trace is here. Sentry should also have captured it (unless it was filtered — see "Sentry filtering" below).
   - **Completed normally but with `success: false`** → the runner caught an error internally. The Pipeline Log (Tier 3) will have the message.
   - **Completed `success: true`** → no Vercel-level problem. Go to Tier 3 to see what was written.

3. **Notion Pipeline Log** (Tier 3, database id in `NOTION_PIPELINE_LOG_DB_ID`). Filter by today's Briefing Date.
   - **No rows for today** → the health-check log never wrote. Either the env var isn't set or cron-job.org's health-check job didn't fire. Check Tier 1 for the health-check job specifically.
   - **`Run Type=health_check, Status=fail, Row Count=0`** → ingestion never wrote rows. Go to Tier 4 to see which sources were available.
   - **`Run Type=health_check, Status=warn, Row Count=2`** → partial run. Editorial can proceed on what arrived; go to Tier 4 to understand why the count was low.

4. **Notion Source Health Log** (Tier 4, database id in `NOTION_SOURCE_HEALTH_DB_ID`). Filter by today's Briefing Date.
   - **A specific source has `Status=skipped_circuit_breaker`** → that source failed 3+ times this morning. The circuit breaker did its job. Consider whether to de-list the source.
   - **Multiple sources have `Status=failed`** → upstream incident (likely a CDN or DNS issue affecting several feeds simultaneously). Usually self-corrects.
   - **No rows in this database** → either the env var isn't set, or no sources failed today. Check Tier 2 for the success path; if successful runs are silent here, that's by design (success tracking is not yet implemented — see `docs/notion-source-health-schema.md`).

## Sentry filtering

The server-side Sentry config drops events whose exception value contains `Feed request retry exhausted` (see [src/sentry.server.config.ts](../src/sentry.server.config.ts)). These are normal expected outcomes for flaky feeds and were generating noise. The Source Health Log captures the same signal in a more useful form. If you're investigating a missing-from-Sentry issue with a feed error, check the Source Health Log first — it's where the signal went.

Other RssError shapes (parse failures, empty feeds, transient HTTP errors) continue to report to Sentry normally.

## Where the env vars live

| Var | Purpose | Required? |
|---|---|---|
| `CRON_SECRET` | Auth for `/api/cron/*` routes | Yes |
| `NOTION_TOKEN` | Notion API token (used by all writers) | Yes |
| `NOTION_EDITORIAL_QUEUE_DB_ID` | Where ingestion writes candidates | Yes |
| `NOTION_PIPELINE_LOG_DB_ID` | Where health checks write per-run logs | No (graceful skip) |
| `NOTION_SOURCE_HEALTH_DB_ID` | Where RSS cron writes per-source health | No (graceful skip) |

Optional vars are graceful: missing them does not break the pipeline, just disables one tier of observability.

## Related docs

- [CRON_SETUP.md](./CRON_SETUP.md) — trigger model and rollback
- [notion-pipeline-log-schema.md](./notion-pipeline-log-schema.md) — Tier 3 database fields
- [notion-source-health-schema.md](./notion-source-health-schema.md) — Tier 4 database fields
