import { buildEventIntelligence } from "@/lib/event-intelligence";
import type { FeedArticle } from "@/lib/rss";
import type { EventIntelligence } from "@/lib/types";

type ArticleCluster = {
  representative: FeedArticle;
  sources: FeedArticle[];
};

export type RankedCluster = ArticleCluster & {
  importanceScore: number;
  importanceLabel: "Critical" | "High" | "Watch";
  rankingSignals: string[];
  eventIntelligence: EventIntelligence;
};

export function rankNewsClusters(
  topicName: string,
  clusters: ArticleCluster[],
): RankedCluster[] {
  return clusters
    .map((cluster) => rankCluster(topicName, cluster))
    .filter((cluster) => cluster.eventIntelligence.isHighSignal)
    .sort((left, right) => right.importanceScore - left.importanceScore);
}

function rankCluster(topicName: string, cluster: ArticleCluster): RankedCluster {
  const eventIntelligence = buildEventIntelligence(cluster.sources, {
    topicName,
    createdAt: cluster.representative.publishedAt,
  });
  const importanceScore = eventIntelligence.rankingScore;

  const rankingSignals = [
    eventIntelligence.rankingReason,
    eventIntelligence.signals.sourceDiversity >= 3
      ? `Confirmed by ${eventIntelligence.signals.sourceDiversity} independent sources.`
      : "Still early coverage with limited source confirmation.",
    eventIntelligence.signals.velocityScore >= 65
      ? "Coverage velocity is increasing."
      : "Coverage is moving at a steadier pace.",
    `Confidence ${eventIntelligence.confidenceScore}/100.`,
  ];

  return {
    ...cluster,
    importanceScore,
    importanceLabel:
      importanceScore >= 80 ? "Critical" : importanceScore >= 65 ? "High" : "Watch",
    rankingSignals,
    eventIntelligence,
  };
}
