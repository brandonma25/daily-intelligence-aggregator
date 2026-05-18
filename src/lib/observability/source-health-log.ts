/**
 * Source Health Log writer.
 *
 * Writes one row per source to a Notion database (NOTION_SOURCE_HEALTH_DB_ID)
 * after each RSS phase, recording whether the source delivered articles,
 * failed, or was skipped by the circuit breaker. Together with the in-memory
 * breaker (see source-circuit-breaker.ts), this gives a complete picture:
 * the breaker handles per-invocation protection, this log captures the
 * cross-run history.
 *
 * Graceful no-op: if NOTION_SOURCE_HEALTH_DB_ID or NOTION_TOKEN is missing,
 * this module logs a warning and returns. Never throws. Never blocks the
 * pipeline. Schema for the Notion database lives in
 * docs/notion-source-health-schema.md.
 */

import { logServerEvent } from "@/lib/observability";
import { snapshotBreakerState } from "@/lib/observability/source-circuit-breaker";

const NOTION_API_VERSION = "2022-06-28";
const NOTION_PAGES_URL = "https://api.notion.com/v1/pages";

export type SourceHealthStatus = "success" | "failed" | "skipped_circuit_breaker";

export type SourceHealthEntry = {
  sourceName: string;
  status: SourceHealthStatus;
  articleCount: number;
  errorMessage?: string;
  lastSuccessfulFetchAt?: string;
};

function richText(content: string) {
  return [{ text: { content: content.slice(0, 2000) } }];
}

/**
 * Write a single row to the Source Health Log. Used by the batch writer
 * below; not typically called directly.
 */
async function writeOne(input: {
  token: string;
  databaseId: string;
  briefingDate: string;
  entry: SourceHealthEntry;
}): Promise<void> {
  const { token, databaseId, briefingDate, entry } = input;

  const properties: Record<string, unknown> = {
    Name: { title: richText(entry.sourceName) },
    "Briefing Date": { date: { start: briefingDate } },
    Status: { select: { name: entry.status } },
    "Article Count": { number: entry.articleCount },
  };
  if (entry.errorMessage) {
    properties["Error Message"] = { rich_text: richText(entry.errorMessage) };
  }
  if (entry.lastSuccessfulFetchAt) {
    properties["Last Successful Fetch"] = {
      date: { start: entry.lastSuccessfulFetchAt },
    };
  }

  const response = await fetch(NOTION_PAGES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_API_VERSION,
    },
    body: JSON.stringify({ parent: { database_id: databaseId }, properties }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "(no body)");
    logServerEvent("warn", "Source Health Log row write returned non-OK; ignoring", {
      status: response.status,
      sourceName: entry.sourceName,
      body: text.slice(0, 300),
    });
  }
}

/**
 * Batch-write Source Health Log rows. Graceful no-op when env vars are
 * missing. Per-row failures are logged but do not abort the batch.
 *
 * Callers should construct the entries from whatever per-source status they
 * tracked during the run; this module deliberately does not own the success
 * tracking. The breaker state (snapshotBreakerState) is the canonical source
 * for "skipped" / "failed" counts within an invocation; success counts must
 * be supplied by the caller.
 */
export async function writeSourceHealthLog(input: {
  briefingDate: string;
  entries: SourceHealthEntry[];
}): Promise<void> {
  const dbId = process.env.NOTION_SOURCE_HEALTH_DB_ID?.trim();
  const token = process.env.NOTION_TOKEN?.trim();
  if (!dbId || !token) {
    logServerEvent("info", "Source Health Log: env not configured, skipping writes", {
      hasDbId: Boolean(dbId),
      hasToken: Boolean(token),
      entryCount: input.entries.length,
    });
    return;
  }

  // Sequential writes to avoid hitting Notion's per-second rate cap with
  // bursts of 20+ rows. The log is non-critical; a couple hundred ms total
  // is acceptable.
  for (const entry of input.entries) {
    try {
      await writeOne({ token, databaseId: dbId, briefingDate: input.briefingDate, entry });
    } catch (error) {
      logServerEvent("warn", "Source Health Log: per-row write failed; continuing", {
        sourceName: entry.sourceName,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

/**
 * Build a default set of entries from the circuit breaker's snapshot. Useful
 * when the caller hasn't tracked successes separately — every source named
 * in the breaker map is reported as either "failed" or
 * "skipped_circuit_breaker" depending on whether the threshold was reached.
 */
export function entriesFromBreakerSnapshot(
  threshold: number,
): SourceHealthEntry[] {
  const snapshot = snapshotBreakerState();
  return Object.entries(snapshot).map(([sourceName, failures]) => ({
    sourceName,
    status: failures >= threshold ? "skipped_circuit_breaker" : "failed",
    articleCount: 0,
    errorMessage: `${failures} failure(s) recorded this run`,
  }));
}
