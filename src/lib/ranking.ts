import type { FeedArticle } from "@/lib/rss";

type ArticleCluster = {
  representative: FeedArticle;
  sources: FeedArticle[];
};

export type RankedCluster = ArticleCluster & {
  importanceScore: number;
  importanceLabel: "Critical" | "High" | "Watch";
  rankingSignals: string[];
};

const SOURCE_AUTHORITY: Record<string, number> = {
  reuters: 1,
  "financial times": 0.98,
  bloomberg: 0.97,
  "wall street journal": 0.97,
  "ars technica": 0.88,
  "the verge": 0.84,
  marketwatch: 0.82,
  tldr: 0.76,
  "zerohedge": 0.52,
};

const IMPACT_KEYWORDS = [
  "earnings",
  "acquisition",
  "merger",
  "funding",
  "fed",
  "interest rate",
  "regulation",
  "lawsuit",
  "launch",
  "model",
  "chip",
  "security",
  "breach",
  "layoff",
  "tariff",
  "ipo",
];

const TECH_KEYWORDS = [
  "ai",
  "artificial intelligence",
  "chip",
  "openai",
  "google",
  "microsoft",
  "meta",
  "apple",
  "amazon",
  "nvidia",
  "tesla",
  "software",
  "cloud",
  "model",
  "cybersecurity",
];

const FINANCE_KEYWORDS = [
  "market",
  "stocks",
  "bonds",
  "treasury",
  "fed",
  "inflation",
  "earnings",
  "revenue",
  "guidance",
  "bank",
  "rates",
  "economy",
  "oil",
  "dollar",
  "ipo",
];

export function rankNewsClusters(
  topicName: string,
  clusters: ArticleCluster[],
): RankedCluster[] {
  return clusters
    .map((cluster) => rankCluster(topicName, cluster))
    .sort((left, right) => right.importanceScore - left.importanceScore);
}

function rankCluster(topicName: string, cluster: ArticleCluster): RankedCluster {
  const uniqueSources = new Set(cluster.sources.map((article) => article.sourceName)).size;
  const newestTimestamp = Math.max(
    ...cluster.sources.map((article) => new Date(article.publishedAt).getTime()),
  );
  const ageHours = Math.max(0, (Date.now() - newestTimestamp) / (1000 * 60 * 60));
  const recency = Math.max(0, 100 - Math.min(ageHours, 48) / 48 * 100);
  const corroboration = Math.min(uniqueSources, 4) / 4 * 100;
  const sourceAuthority = averageSourceAuthority(cluster.sources) * 100;
  const impact = impactScore(cluster) * 100;
  const categoryFit = categoryFitScore(topicName, cluster) * 100;

  const importanceScore = Math.round(
    recency * 0.28 +
      corroboration * 0.22 +
      sourceAuthority * 0.18 +
      impact * 0.22 +
      categoryFit * 0.1,
  );

  const rankingSignals = [
    recency >= 70 ? "Fresh reporting in the current cycle." : "Older than the fastest-moving headlines.",
    corroboration >= 50
      ? `Covered by ${uniqueSources} sources, which boosts confidence.`
      : "Still early coverage with limited source confirmation.",
    impact >= 55
      ? "Contains language associated with market-moving or strategic impact."
      : "Looks more incremental than category-defining.",
    categoryFit >= 55
      ? `Strong match for the ${topicName.toLowerCase()} brief.`
      : `Relevant to ${topicName.toLowerCase()}, but not a perfect fit.`,
  ];

  return {
    ...cluster,
    importanceScore,
    importanceLabel:
      importanceScore >= 80 ? "Critical" : importanceScore >= 65 ? "High" : "Watch",
    rankingSignals,
  };
}

function averageSourceAuthority(articles: FeedArticle[]) {
  const weights = articles.map((article) => {
    const sourceName = article.sourceName.toLowerCase();
    return SOURCE_AUTHORITY[sourceName] ?? 0.7;
  });

  return weights.reduce((sum, weight) => sum + weight, 0) / Math.max(weights.length, 1);
}

function impactScore(cluster: ArticleCluster) {
  const corpus = `${cluster.representative.title} ${cluster.sources
    .slice(0, 3)
    .map((article) => article.summaryText)
    .join(" ")}`.toLowerCase();
  const matches = IMPACT_KEYWORDS.filter((keyword) => corpus.includes(keyword)).length;
  return Math.min(matches, 4) / 4;
}

function categoryFitScore(topicName: string, cluster: ArticleCluster) {
  const corpus = `${cluster.representative.title} ${cluster.sources
    .slice(0, 3)
    .map((article) => article.summaryText)
    .join(" ")}`.toLowerCase();
  const keywordSet = topicName.toLowerCase().includes("finance") ? FINANCE_KEYWORDS : TECH_KEYWORDS;
  const matches = keywordSet.filter((keyword) => corpus.includes(keyword)).length;
  return Math.max(0.35, Math.min(matches, 5) / 5);
}
