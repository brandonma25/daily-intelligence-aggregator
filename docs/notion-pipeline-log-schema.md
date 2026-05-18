# Notion Database — Pipeline Log

This database records one row per cron invocation: ingestion runs and health checks. It is the per-run audit trail.

The schema below is what the pipeline writes. **Create the database in Notion manually**, then add its ID to Vercel as `NOTION_PIPELINE_LOG_DB_ID`. The health endpoint and ingestion runners auto-detect the env var and start writing once it is set. No code change is required.

## Setup steps

1. In Notion, create a new database titled **Pipeline Log** under the **BOOT UP** page (or wherever you keep ops-related databases).
2. Configure the fields listed below. Field names must match exactly — the writer addresses them by name.
3. Copy the database ID from the URL (the 32-char string after the workspace slug).
4. In Vercel → bootup project → Settings → Environment Variables, add:
   - Name: `NOTION_PIPELINE_LOG_DB_ID`
   - Value: the 32-char ID
   - Scope: Production (Preview optional)
5. Redeploy. From the next run forward, every ingestion and health check writes one row.

## Field schema

| Field | Type | Notes |
|---|---|---|
| `Name` | Title | Auto-set by the writer to an ISO timestamp string (`2026-05-18T18:41:00.000Z`). Acts as the per-run ID; no editing needed. |
| `Run Type` | Select | Options: `ingestion`, `health_check`. The writer creates new option values if you forget to add them — but pre-creating them lets you set colors. |
| `Status` | Select | Options: `ok`, `warn`, `fail`. Matches the same status taxonomy the health endpoint returns. |
| `Row Count` | Number | Number of Editorial Queue rows present (for health checks) or written (for ingestion runs). |
| `Message` | Rich text | One-line human-readable summary. Truncated to 2000 chars by the writer. |
| `Briefing Date` | Date | Taipei calendar date for the run (`YYYY-MM-DD`). Use this for grouping in views. |

## Suggested views

- **Today** — filter where `Briefing Date` is today (Taipei). Default sort by `Name` descending so newest run is on top.
- **Failures** — filter where `Status` is `fail`. Useful when triaging which day broke.
- **Ingestion only** — filter where `Run Type` is `ingestion`. Confirms the two daily runs both executed.

## What writes here

- `/api/cron/health` — one row per health check call. `Run Type = health_check`.
- (Future) `/api/cron/fetch-editorial-inputs` — currently does not write here. Adding ingestion logging is straightforward; the health-check writer in [src/app/api/cron/health/route.ts](../src/app/api/cron/health/route.ts) is the template.

## Graceful behavior

The writer is wrapped in try/catch and logs warnings on failure. If the database ID is wrong, schema is missing a field, or Notion is down, the health endpoint still returns its HTTP response normally — the log is observability, not the critical path.
