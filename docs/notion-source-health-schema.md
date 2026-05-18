# Notion Database — Source Health Log

This database records one row per source per RSS run: which sources delivered articles, which failed, which were skipped by the circuit breaker. Cross-run history complements the in-memory circuit breaker (per-invocation) — together they give you both real-time protection and trend visibility.

The schema below is what the pipeline writes. **Create the database in Notion manually**, then add its ID to Vercel as `NOTION_SOURCE_HEALTH_DB_ID`. The RSS cron auto-detects the env var and starts writing once it is set. No code change is required.

## Setup steps

1. In Notion, create a new database titled **Source Health Log** under the **BOOT UP** page (or wherever you keep ops-related databases).
2. Configure the fields listed below. Field names must match exactly — the writer addresses them by name.
3. Copy the database ID from the URL (the 32-char string after the workspace slug).
4. In Vercel → bootup project → Settings → Environment Variables, add:
   - Name: `NOTION_SOURCE_HEALTH_DB_ID`
   - Value: the 32-char ID
   - Scope: Production (Preview optional)
5. Redeploy. From the next RSS run forward, any source that failed or hit the circuit breaker gets logged.

## Field schema

| Field | Type | Notes |
|---|---|---|
| `Name` | Title | Source name (e.g. `Reuters Business`, `Heatmap`). Matches the `sourceName` argument to `fetchFeedArticles`. |
| `Briefing Date` | Date | Taipei calendar date for the run (`YYYY-MM-DD`). One row per source per day. |
| `Status` | Select | Options: `success`, `failed`, `skipped_circuit_breaker`. Today the writer only emits the latter two; success tracking requires extra wiring (see "What writes here" below). |
| `Article Count` | Number | Number of articles the source returned. Zero for failures and skips. |
| `Error Message` | Rich text | One-line summary of the failure, e.g. `"3 failure(s) recorded this run"` for breaker-skipped sources. Truncated to 2000 chars. |
| `Last Successful Fetch` | Date | When this source last delivered articles successfully. Today the writer does not populate this — left for a future PR that threads success state through the pipeline. |

## Suggested views

- **Today** — filter where `Briefing Date` is today (Taipei). Quick "what broke this morning?" view.
- **Chronic failures** — filter where `Status` is `skipped_circuit_breaker`. These are the sources to consider de-listing.
- **By source** — group by `Name`. Spot whether one specific source is repeatedly failing or only had one bad day.

## What writes here

- `/api/cron/fetch-news` (the RSS phase of `fetch-editorial-inputs`) — after the pipeline completes, the breaker snapshot is written as one row per source that hit a failure or was skipped. Sources that succeeded are NOT currently written; the writer's `entriesFromBreakerSnapshot` helper only knows about failures (success counts aren't tracked separately yet — see [src/lib/observability/source-health-log.ts](../src/lib/observability/source-health-log.ts) for the seam where this would be added).

## Graceful behavior

The writer is wrapped in try/catch around every per-row Notion call, plus a top-level try around the batch. If a row fails, the others still write. If the whole batch fails, the cron's return value is unaffected. The Source Health Log is observability, not the critical path.

## Pairs with

- [src/lib/observability/source-circuit-breaker.ts](../src/lib/observability/source-circuit-breaker.ts) — the in-memory tracker
- [docs/notion-pipeline-log-schema.md](./notion-pipeline-log-schema.md) — the per-run audit log (different database)
- [docs/OBSERVABILITY.md](./OBSERVABILITY.md) — the four-tier observability model
