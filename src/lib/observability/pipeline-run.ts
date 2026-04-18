export type ClusterScoreLog = {
  cluster_id: string;
  credibility: number;
  novelty: number;
  urgency: number;
  cluster_size: number;
  final_score: number;
};

export type PipelineRun = {
  run_id: string;
  timestamp: string;
  num_raw_items: number;
  num_after_dedup: number;
  num_clusters: number;
  avg_cluster_size: number;
  singleton_count: number;
  prevented_merge_count: number;
  top_scores: number[];
  scoring_breakdown: ClusterScoreLog[];
  sample_cluster_rationale: Array<{
    cluster_id: string;
    representative_title: string;
    cluster_size: number;
    topic_keywords: string[];
    representative_selection_reason: string;
    recent_merge_reasons: string[];
  }>;
  feed_failures: Array<{
    source: string;
    feedUrl: string;
    error: string;
  }>;
  used_seed_fallback: boolean;
};

export function createEmptyPipelineRun(runId: string): PipelineRun {
  return {
    run_id: runId,
    timestamp: new Date().toISOString(),
    num_raw_items: 0,
    num_after_dedup: 0,
    num_clusters: 0,
    avg_cluster_size: 0,
    singleton_count: 0,
    prevented_merge_count: 0,
    top_scores: [],
    scoring_breakdown: [],
    sample_cluster_rationale: [],
    feed_failures: [],
    used_seed_fallback: false,
  };
}
