/**
 * Source circuit breaker.
 *
 * Tracks per-source failure counts within a single serverless invocation and
 * skips fetches for sources that have already failed CIRCUIT_OPEN_THRESHOLD
 * times. Vercel functions are stateless across cold starts — the tracker
 * resets every invocation. The breaker's job is to stop a single pipeline run
 * from spending retry budget on a known-broken source (e.g. the Reuters
 * Business feed that has been failing consistently), not to track failures
 * over time.
 *
 * Cross-run state lives in the Source Health Log Notion database (written by
 * the pipeline after the RSS phase completes). The in-memory tracker plus the
 * external log together give us a complete picture: per-run protection here,
 * historical visibility there.
 *
 * Usage:
 *   if (shouldSkipSource(name)) {
 *     logServerEvent("info", "Skipped source via circuit breaker", { source: name });
 *     return [];
 *   }
 *   try { ... } catch (e) { recordSourceFailure(name); throw e; }
 */

const CIRCUIT_OPEN_THRESHOLD = 3;

const sourceFailures: Map<string, number> = new Map();

export function shouldSkipSource(sourceId: string): boolean {
  return (sourceFailures.get(sourceId) ?? 0) >= CIRCUIT_OPEN_THRESHOLD;
}

export function recordSourceFailure(sourceId: string): void {
  sourceFailures.set(sourceId, (sourceFailures.get(sourceId) ?? 0) + 1);
}

/**
 * Snapshot the current breaker state for the Source Health Log writer.
 * Returns the failure-count map as a plain object so the writer can iterate
 * over it without holding a reference to the live Map.
 */
export function snapshotBreakerState(): Record<string, number> {
  return Object.fromEntries(sourceFailures);
}

/**
 * Reset the breaker. Only used by tests — production never calls this.
 */
export function __resetSourceCircuitBreakerForTest(): void {
  sourceFailures.clear();
}

export const CIRCUIT_BREAKER_THRESHOLD = CIRCUIT_OPEN_THRESHOLD;
