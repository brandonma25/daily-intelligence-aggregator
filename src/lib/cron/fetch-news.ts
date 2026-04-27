import { generateDailyBriefing } from "@/lib/data";
import { errorContext, logServerEvent } from "@/lib/observability";
import {
  captureRssCronCheckIn,
  captureRssFailure,
  flushRssTelemetry,
  withRssSpan,
} from "@/lib/observability/rss";
import { persistSignalPostsForBriefing } from "@/lib/signals-editorial";

type DailyNewsCronFailureStage =
  | "cron_start"
  | "briefing_generation"
  | "briefing_summary"
  | "seed_fallback_guard"
  | "minimum_item_guard"
  | "editorial_persistence";

export type DailyNewsCronRunSummary = {
  briefingDate: string | null;
  insertedSignalPostCount: number;
  pipelineRunId: string | null;
  rawItemCount: number;
  clusterCount: number;
  rankedClusterCount: number;
  usedSeedFallback: boolean;
  feedFailureCount: number;
  failureStage?: DailyNewsCronFailureStage;
  message: string;
};

export type DailyNewsCronRunResult = {
  success: boolean;
  timestamp: string;
  summary: DailyNewsCronRunSummary;
};

function buildEmptySummary(): Omit<DailyNewsCronRunSummary, "message"> {
  return {
    briefingDate: null,
    insertedSignalPostCount: 0,
    pipelineRunId: null,
    rawItemCount: 0,
    clusterCount: 0,
    rankedClusterCount: 0,
    usedSeedFallback: false,
    feedFailureCount: 0,
  };
}

function buildFailureResult(
  timestamp: string,
  message: string,
  partialSummary: Omit<DailyNewsCronRunSummary, "message"> = buildEmptySummary(),
): DailyNewsCronRunResult {
  return {
    success: false,
    timestamp,
    summary: {
      ...partialSummary,
      message,
    },
  };
}

export async function runDailyNewsCron(): Promise<DailyNewsCronRunResult> {
  const timestamp = new Date().toISOString();
  const startedAtMs = Date.now();
  const checkInId = captureRssCronCheckIn("in_progress");
  let failureStage: DailyNewsCronFailureStage = "cron_start";
  let partialSummary = buildEmptySummary();

  logServerEvent("info", "Daily news cron started", {
    route: "/api/cron/fetch-news",
    timestamp,
  });

  try {
    failureStage = "briefing_generation";
    const { briefing, publicRankedItems, pipelineRun } = await withRssSpan(
      "rss.refresh",
      "refresh",
      {
        route: "/api/cron/fetch-news",
      },
      () => generateDailyBriefing(),
    );
    failureStage = "briefing_summary";
    const briefingDate = briefing.briefingDate.slice(0, 10);
    const baseSummary = {
      briefingDate,
      insertedSignalPostCount: 0,
      pipelineRunId: pipelineRun.run_id,
      rawItemCount: pipelineRun.num_raw_items,
      clusterCount: pipelineRun.num_clusters,
      rankedClusterCount: publicRankedItems.length,
      usedSeedFallback: pipelineRun.used_seed_fallback,
      feedFailureCount: pipelineRun.feed_failures.length,
    };
    partialSummary = baseSummary;

    failureStage = "seed_fallback_guard";
    if (pipelineRun.used_seed_fallback) {
      const result = {
        success: false,
        timestamp,
        summary: {
          ...baseSummary,
          message: "Cron run skipped editorial persistence because live feeds fell back to deterministic seed data.",
        },
      };

      logServerEvent("warn", "Daily news cron skipped seed fallback output", {
        route: "/api/cron/fetch-news",
        ...result.summary,
      });
      captureRssFailure(new Error(result.summary.message), {
        failureType: "rss_refresh_job_failed",
        phase: "refresh",
        level: "error",
        retryCount: pipelineRun.feed_failures.length,
        message: result.summary.message,
        extra: {
          route: "/api/cron/fetch-news",
          pipelineRunId: pipelineRun.run_id,
          usedSeedFallback: true,
          feedFailureCount: pipelineRun.feed_failures.length,
        },
      });
      captureRssCronCheckIn("error", checkInId, durationSeconds(startedAtMs));

      return result;
    }

    failureStage = "minimum_item_guard";
    if (briefing.items.length < 5) {
      const result = {
        success: false,
        timestamp,
        summary: {
          ...baseSummary,
          message: `Cron run produced ${briefing.items.length} ranked briefing items; at least five are required for editorial review.`,
        },
      };

      logServerEvent("warn", "Daily news cron produced too few items", {
        route: "/api/cron/fetch-news",
        ...result.summary,
        briefingItemCount: briefing.items.length,
      });
      captureRssFailure(new Error(result.summary.message), {
        failureType: "rss_refresh_job_failed",
        phase: "refresh",
        level: "error",
        message: result.summary.message,
        extra: {
          route: "/api/cron/fetch-news",
          pipelineRunId: pipelineRun.run_id,
          briefingItemCount: briefing.items.length,
          feedFailureCount: pipelineRun.feed_failures.length,
        },
      });
      captureRssCronCheckIn("error", checkInId, durationSeconds(startedAtMs));

      return result;
    }

    failureStage = "editorial_persistence";
    const snapshot = await persistSignalPostsForBriefing({
      briefingDate,
      items: briefing.items,
    });
    const result = {
      success: snapshot.ok,
      timestamp,
      summary: {
        ...baseSummary,
        insertedSignalPostCount: snapshot.insertedCount,
        message: snapshot.message,
      },
    };

    logServerEvent(snapshot.ok ? "info" : "error", snapshot.ok ? "Daily news cron succeeded" : "Daily news cron failed", {
      route: "/api/cron/fetch-news",
      ...result.summary,
    });

    if (!snapshot.ok) {
      captureRssFailure(new Error("RSS signal post persistence failed during daily refresh."), {
        failureType: "rss_cache_write_failed",
        phase: "store",
        level: "error",
        message: "RSS signal post persistence failed during daily refresh.",
        extra: {
          route: "/api/cron/fetch-news",
          pipelineRunId: pipelineRun.run_id,
          briefingDate,
          operation: "persist_signal_posts",
        },
      });
    }

    captureRssCronCheckIn(snapshot.ok ? "ok" : "error", checkInId, durationSeconds(startedAtMs));

    return result;
  } catch (error) {
    const failureSummary = {
      ...partialSummary,
      failureStage,
    };
    const result = buildFailureResult(
      timestamp,
      "Daily news cron failed before completion.",
      failureSummary,
    );

    logServerEvent("error", "Daily news cron failed", {
      route: "/api/cron/fetch-news",
      timestamp,
      ...result.summary,
      ...errorContext(error),
    });
    captureRssFailure(error, {
      failureType: "rss_refresh_job_failed",
      phase: "refresh",
      level: "error",
      message: result.summary.message,
      extra: {
        route: "/api/cron/fetch-news",
        ...failureSummary,
      },
    });
    captureRssCronCheckIn("error", checkInId, durationSeconds(startedAtMs));
    await flushRssTelemetry();

    return result;
  }
}

function durationSeconds(startedAtMs: number) {
  return Number(((Date.now() - startedAtMs) / 1000).toFixed(3));
}
