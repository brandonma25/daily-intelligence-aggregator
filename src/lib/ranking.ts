import {
  buildImportanceClassifierInput,
  classifyArticleImportance,
} from "@/lib/importance-classifier";
import { buildEventIntelligence } from "@/lib/event-intelligence";
import {
  compareImportanceScores,
  computeImportanceScore,
  getImportanceLabel,
  getSignalLabel,
} from "@/lib/importance-score";
import type { FeedArticle } from "@/lib/rss";
import type { BriefingItem, EventIntelligence } from "@/lib/types";

type ArticleCluster = {
  representative: FeedArticle;
  sources: FeedArticle[];
};

export type RankedCluster = ArticleCluster & {
  importanceScore: number;
  importanceLabel: "Critical" | "High" | "Watch";
  signalLabel: "High Signal" | "Medium Signal" | "Low Signal";
  eventType: string;
  sourceTier: "tier1" | "tier2" | "tier3";
  entityTags: string[];
  rankingSignals: string[];
  eventIntelligence: EventIntelligence;
};

export function rankNewsClusters(
  topicName: string,
  clusters: ArticleCluster[],
): RankedCluster[] {
  return clusters
    .map((cluster) => rankCluster(topicName, cluster))
    .filter((cluster) => cluster.importanceScore >= 6 || cluster.eventIntelligence.isHighSignal)
    .sort(compareRankedClusters);
}

function rankCluster(topicName: string, cluster: ArticleCluster): RankedCluster {
  const eventIntelligence = buildEventIntelligence(cluster.sources, {
    topicName,
    createdAt: cluster.representative.publishedAt,
  });
  const clusterArticleScores = cluster.sources.map((article) =>
    computeImportanceScore(
      classifyArticleImportance(buildImportanceClassifierInput(article)),
    ),
  );
  const topImportanceArticle = clusterArticleScores
    .slice()
    .sort((left, right) => right.score - left.score)[0];
  const importanceScore = topImportanceArticle?.score ?? 0;

  const rankingSignals = [
    topImportanceArticle
      ? `${topImportanceArticle.signalLabel} driven by ${topImportanceArticle.eventType.replace(/-/g, " ")} coverage.`
      : eventIntelligence.rankingReason,
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
    importanceLabel: getImportanceLabel(importanceScore),
    signalLabel: getSignalLabel(importanceScore),
    eventType: topImportanceArticle?.eventType ?? "minor-update",
    sourceTier: topImportanceArticle?.sourceTier ?? "tier3",
    entityTags: topImportanceArticle?.entityTags ?? [],
    rankingSignals,
    eventIntelligence,
  };
}

export function compareRankedClusters(left: RankedCluster, right: RankedCluster) {
  const importanceDelta = compareImportanceScores(
    {
      importanceScore: left.importanceScore,
      publishedAt: left.representative.publishedAt,
    },
    {
      importanceScore: right.importanceScore,
      publishedAt: right.representative.publishedAt,
    },
  );
  if (importanceDelta !== 0) {
    return importanceDelta;
  }

  const confidenceDelta =
    right.eventIntelligence.confidenceScore - left.eventIntelligence.confidenceScore;
  if (confidenceDelta !== 0) {
    return confidenceDelta;
  }

  return left.representative.title.localeCompare(right.representative.title);
}

type BriefingRankSnapshot = {
  isHighSignal: boolean;
  rankingScore: number;
  confidenceScore: number;
  freshestTimestamp: number;
  sourceDiversity: number;
};

export function compareBriefingItemsByRanking(left: BriefingItem, right: BriefingItem) {
  const leftSnapshot = getBriefingRankSnapshot(left);
  const rightSnapshot = getBriefingRankSnapshot(right);
  const importanceDelta = compareImportanceScores(
    { importanceScore: leftSnapshot.rankingScore, publishedAt: left.publishedAt },
    { importanceScore: rightSnapshot.rankingScore, publishedAt: right.publishedAt },
  );
  if (importanceDelta !== 0) {
    return importanceDelta;
  }

  const confidenceDelta = rightSnapshot.confidenceScore - leftSnapshot.confidenceScore;
  if (confidenceDelta !== 0) {
    return confidenceDelta;
  }

  const freshnessDelta = rightSnapshot.freshestTimestamp - leftSnapshot.freshestTimestamp;
  if (freshnessDelta !== 0) {
    return freshnessDelta;
  }

  const sourceDelta = rightSnapshot.sourceDiversity - leftSnapshot.sourceDiversity;
  if (sourceDelta !== 0) {
    return sourceDelta;
  }

  return left.title.localeCompare(right.title);
}

export function sortBriefingItemsByRanking(items: BriefingItem[]) {
  return items.slice().sort(compareBriefingItemsByRanking);
}

export function getBriefingRankSnapshot(item: BriefingItem): BriefingRankSnapshot {
  const intelligence = item.eventIntelligence;
  const rankingScore = item.importanceScore ?? intelligence?.rankingScore ?? 0;
  const confidenceScore = intelligence?.confidenceScore ?? 0;
  const sourceDiversity =
    intelligence?.signals.sourceDiversity ??
    item.sourceCount ??
    new Set(item.sources.map((source) => source.title)).size;

  return {
    isHighSignal: (item.importanceScore ?? 0) >= 8 || (intelligence?.isHighSignal ?? false),
    rankingScore,
    confidenceScore,
    freshestTimestamp: getTimestamp(item.publishedAt ?? intelligence?.createdAt),
    sourceDiversity,
  };
}

export function buildRankingDisplaySignals(item: BriefingItem) {
  const intelligence = item.eventIntelligence;
  const articleCount =
    intelligence?.signals.articleCount ??
    item.timeline?.reduce((count, group) => count + group.entries.length, 0) ??
    item.relatedArticles?.length ??
    item.sources.length;
  const sourceCount =
    intelligence?.signals.sourceDiversity ??
    item.sourceCount ??
    new Set(item.sources.map((source) => source.title)).size;
  const signals = [
    buildUpdatedLabel(item.publishedAt ?? intelligence?.createdAt),
    articleCount > 0 ? `Covered by ${articleCount} ${articleCount === 1 ? "article" : "articles"}` : null,
    sourceCount > 0 ? `Seen across ${sourceCount} ${sourceCount === 1 ? "source" : "sources"}` : null,
    intelligence?.signals.velocityScore && intelligence.signals.velocityScore >= 70
      ? "Rapidly developing"
      : null,
  ].filter((value): value is string => Boolean(value));

  return [...new Set(signals)].slice(0, 4);
}

function buildUpdatedLabel(value: string | undefined) {
  const timestamp = getTimestamp(value);
  if (!timestamp) {
    return null;
  }

  const ageHours = Math.max(0, (Date.now() - timestamp) / (1000 * 60 * 60));
  if (ageHours < 1) {
    return "Updated <1h ago";
  }

  if (ageHours < 24) {
    return `Updated ${Math.round(ageHours)}h ago`;
  }

  const ageDays = Math.round(ageHours / 24);
  return `Updated ${ageDays}d ago`;
}

function getTimestamp(value: string | undefined) {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}
