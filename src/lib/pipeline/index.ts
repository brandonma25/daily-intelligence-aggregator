import type { Source } from "@/lib/types";
import { clusterNormalizedArticles } from "@/lib/pipeline/clustering";
import { deduplicateArticles } from "@/lib/pipeline/dedup";
import { buildDigestOutput, type DigestOutput } from "@/lib/pipeline/digest";
import { ingestRawItems } from "@/lib/pipeline/ingestion";
import { normalizeRawItems } from "@/lib/pipeline/normalization";
import { rankSignalClusters } from "@/lib/pipeline/ranking";
import { createEmptyPipelineRun, type PipelineRun } from "@/lib/observability/pipeline-run";

export type ClusterFirstPipelineResult = {
  digest: DigestOutput;
  run: PipelineRun;
};

export async function runClusterFirstPipeline(options: {
  sources?: Source[];
} = {}): Promise<ClusterFirstPipelineResult> {
  const runId = `pipeline-${Date.now()}`;
  const run = createEmptyPipelineRun(runId);
  const ingestion = await ingestRawItems(options);
  run.feed_failures = ingestion.failures;
  run.used_seed_fallback = ingestion.usedSeedFallback;

  const normalized = normalizeRawItems(ingestion.items);
  const deduped = deduplicateArticles(normalized);
  const clusters = clusterNormalizedArticles(deduped);
  const rankedClusters = rankSignalClusters(clusters);
  const digest = buildDigestOutput(rankedClusters);

  run.num_raw_items = ingestion.items.length;
  run.num_after_dedup = deduped.length;
  run.num_clusters = clusters.length;
  run.top_scores = rankedClusters.slice(0, 5).map((entry) => entry.ranked.score);
  run.scoring_breakdown = rankedClusters.map((entry) => entry.scoringLog);

  return {
    digest,
    run,
  };
}
