# Cron Setup — Boot Up Pipeline

## Trigger Model

The editorial ingestion pipeline is triggered by **cron-job.org** (external), not by Vercel's built-in cron scheduler.

- **External cron:** cron-job.org hits `GET https://bootupnews.com/api/cron/fetch-editorial-inputs` on the configured schedule.
- **Auth:** request must include `Authorization: Bearer ${CRON_SECRET}` (NOT `x-cron-secret` — earlier specs called it that, the actual implementation uses standard Bearer). The secret is stored in cron-job.org's job config and in Vercel's `CRON_SECRET` env var (Production). Both must match.
- **Function timeout:** `maxDuration: 60` is set in [vercel.json](../vercel.json) for `/api/cron/fetch-editorial-inputs`.

## Why no Vercel internal cron?

A `crons` array in `vercel.json` was removed because running both Vercel cron AND cron-job.org caused duplicate runs on the same day (see May 16 2026 incident: 4 runs at 06:59, 07:17, 10:32, 11:50 UTC produced 4–5× duplicate Editorial Queue rows). External cron is the source of truth; Vercel cron is reserved for rollback.

A Notion idempotency guard (added 2026-05-18) now prevents same-day duplicates at the write layer, but the trigger-side cleanup is still the right architecture: one cron, one source of truth.

## cron-job.org job inventory

Three jobs are configured at cron-job.org. The third (health check) remains commented out in `scripts/cron-jobs.config.ts` until BM has confirmed the `/api/cron/health` endpoint is deployed and BM is ready to receive alerts on zero-row days.

| Time (UTC) | Time (Taipei) | Path | Purpose |
|---|---|---|---|
| 10:15 | 18:15 | `/api/cron/fetch-editorial-inputs` | First ingestion run of the day |
| 11:45 | 19:45 | `/api/cron/fetch-editorial-inputs` | Second ingestion run (catches late-arriving newsletters) |
| 12:15 | 20:15 | `/api/cron/health` | Verify the queue has rows; alert on zero |

The health check fires 30 minutes after the second ingestion to give the cron-job.org → Vercel call time to complete before checking.

## Rollback procedure (if cron-job.org is down)

Re-add the Vercel cron block to [vercel.json](../vercel.json) and redeploy:

```json
{
  "functions": { ... },
  "crons": [
    { "path": "/api/cron/fetch-editorial-inputs", "schedule": "15 10 * * *" },
    { "path": "/api/cron/fetch-editorial-inputs", "schedule": "45 11 * * *" }
  ]
}
```

- Schedule is UTC. `15 10 * * *` = 10:15 UTC = 18:15 Taipei.
- After cron-job.org is restored, remove the `crons` block again to prevent dual-firing.
- The idempotency guard means a brief dual-firing window during the changeover will not produce duplicates, but it will produce extra Vercel function invocations — still worth avoiding.

## Operational checklist

- [ ] cron-job.org jobs exist (two ingestion, one health), enabled, set to the schedules above
- [ ] cron-job.org jobs use `Authorization: Bearer ${CRON_SECRET}` header (NOT `x-cron-secret`)
- [ ] Vercel `CRON_SECRET` env var matches cron-job.org's header value
- [ ] `vercel.json` does NOT contain a `crons` array (unless rollback is active)
- [ ] `vercel.json` `functions.maxDuration` is set to 60 for the ingestion route
- [ ] Optional Notion logs: `NOTION_PIPELINE_LOG_DB_ID` and `NOTION_SOURCE_HEALTH_DB_ID` set in Vercel env if you've created those databases (see docs/notion-pipeline-log-schema.md and docs/notion-source-health-schema.md)
