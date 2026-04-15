import { createHash } from "crypto";

import { classifyHomepageCategory, getHomepageCategoryLabel } from "@/lib/homepage-taxonomy";
import type { FeedArticle } from "@/lib/rss";
import type { EventIntelligence } from "@/lib/types";
import { firstSentence, stripHtml } from "@/lib/utils";

type EventIntelligenceOptions = {
  topicName: string;
  matchedKeywords?: string[];
  createdAt?: string;
};

const HIGH_SIGNAL_HINTS = [
  "earnings",
  "fed",
  "federal reserve",
  "inflation",
  "rates",
  "tariff",
  "trade",
  "acquisition",
  "merger",
  "funding",
  "ipo",
  "sanctions",
  "regulation",
  "policy",
  "executive order",
  "white house",
  "senate",
  "congress",
  "minister",
  "cabinet",
  "chip",
  "semiconductor",
  "cloud",
  "ai",
  "cybersecurity",
  "breach",
  "layoff",
  "data center",
];

const LOW_SIGNAL_HINTS = [
  "deal",
  "deals",
  "discount",
  "sale",
  "gift guide",
  "black friday",
  "cyber monday",
  "best of",
  "top 10",
  "review",
  "hands on",
  "hands-on",
  "streaming guide",
  "celebrity",
  "movie",
  "tv show",
  "sports",
  "game recap",
];

const TOPIC_RULES: Array<{ topic: string; keywords: string[] }> = [
  { topic: "tech", keywords: ["ai", "software", "cloud", "chip", "chips", "semiconductor", "platform", "developer", "data center", "cyber", "device"] },
  { topic: "finance", keywords: ["markets", "market", "stocks", "bonds", "treasury", "fed", "inflation", "rates", "earnings", "bank", "banking", "ipo", "acquisition", "merger", "revenue", "economy", "economic", "trade", "tariff"] },
  { topic: "business", keywords: ["company", "companies", "revenue", "profit", "guidance", "capital", "acquisition", "merger", "layoff", "business"] },
  { topic: "politics", keywords: ["government", "white house", "election", "senate", "congress", "policy", "regulation", "regulatory", "executive order", "campaign"] },
  { topic: "geopolitics", keywords: ["sanctions", "diplomacy", "minister", "cabinet", "parliament", "geopolitical", "war", "border", "alliance", "ministry"] },
];

export function buildEventIntelligence(
  articles: FeedArticle[],
  options: EventIntelligenceOptions,
): EventIntelligence {
  const sorted = [...articles].sort(
    (left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime(),
  );
  const representative = sorted[0];
  const sourceDiversity = new Set(sorted.map((article) => article.sourceName)).size;
  const articleCount = sorted.length;
  const keyEntities = extractKeyEntities(sorted, options.matchedKeywords);
  const topics = deriveTopics(sorted, options.topicName, options.matchedKeywords);
  const primaryChange = buildPrimaryChange(representative?.title ?? options.topicName);
  const summary = buildSummary(sorted, primaryChange, sourceDiversity, topics);
  const recencyScore = computeRecencyScore(sorted);
  const velocityScore = computeVelocityScore(sorted);
  const rankingScore = Math.round(
    normalizeArticleCount(articleCount) * 0.4 +
      normalizeSourceDiversity(sourceDiversity) * 0.3 +
      recencyScore * 0.2 +
      velocityScore * 0.1,
  );
  const rankingReason = buildRankingReason({
    articleCount,
    sourceDiversity,
    recencyScore,
    velocityScore,
    keyEntities,
    topics,
    primaryChange,
  });
  const confidenceScore = computeConfidenceScore({
    articleCount,
    sourceDiversity,
    keyEntities,
    topics,
    summary,
    matchedKeywords: options.matchedKeywords ?? [],
  });
  const isHighSignal = evaluateHighSignal({
    title: representative?.title ?? primaryChange,
    summary,
    topics,
    rankingScore,
    articleCount,
    sourceDiversity,
  });

  return {
    id: createHash("sha1")
      .update(`${options.topicName}:${representative?.url ?? representative?.title ?? primaryChange}`)
      .digest("hex")
      .slice(0, 16),
    title: representative?.title ?? primaryChange,
    summary,
    primaryChange,
    keyEntities,
    topics,
    signals: {
      articleCount,
      sourceDiversity,
      recencyScore,
      velocityScore,
    },
    rankingScore,
    rankingReason,
    confidenceScore,
    isHighSignal,
    createdAt: options.createdAt ?? representative?.publishedAt ?? new Date().toISOString(),
  };
}

export function getTrustTier(confidenceScore: number) {
  if (confidenceScore >= 72) {
    return "high" as const;
  }

  if (confidenceScore >= 45) {
    return "medium" as const;
  }

  return "low" as const;
}

function extractKeyEntities(articles: FeedArticle[], matchedKeywords?: string[]) {
  const candidates = new Map<string, number>();
  const corpus = articles
    .slice(0, 5)
    .map((article) => `${article.title}. ${article.summaryText}`)
    .join(" ");

  const phraseMatches = corpus.match(
    /\b(?:[A-Z]{2,}|[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}|White House|Federal Reserve)\b/g,
  ) ?? [];

  for (const match of phraseMatches) {
    const cleaned = cleanEntity(match);
    if (!cleaned || isStopEntity(cleaned)) {
      continue;
    }
    candidates.set(cleaned, (candidates.get(cleaned) ?? 0) + 2);
  }

  for (const keyword of matchedKeywords ?? []) {
    const entity = cleanEntity(keyword);
    if (!entity || entity.length < 3 || isCommonSignal(entity)) {
      continue;
    }
    candidates.set(entity, (candidates.get(entity) ?? 0) + 1);
  }

  return [...candidates.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([entity]) => entity)
    .slice(0, 4);
}

function deriveTopics(articles: FeedArticle[], topicName: string, matchedKeywords?: string[]) {
  const classification = classifyHomepageCategory({
    topicName,
    title: articles[0]?.title,
    summary: articles.slice(0, 3).map((article) => article.summaryText).join(" "),
    matchedKeywords,
    sourceNames: articles.map((article) => article.sourceName),
  });
  const corpus = normalizeText(
    `${topicName} ${articles.map((article) => `${article.title} ${article.summaryText}`).join(" ")} ${(matchedKeywords ?? []).join(" ")}`,
  );
  const topics = new Set<string>();

  if (classification.primaryCategory) {
    topics.add(classification.primaryCategory);
  }
  for (const secondary of classification.secondaryCategories) {
    topics.add(secondary);
  }

  for (const rule of TOPIC_RULES) {
    if (rule.keywords.some((keyword) => corpus.includes(keyword))) {
      topics.add(rule.topic);
    }
  }

  if (!topics.size) {
    topics.add(topicName.toLowerCase());
  }

  return [...topics].slice(0, 4);
}

function buildPrimaryChange(title: string) {
  const cleaned = title
    .replace(/\s+-\s+(reuters|ap|bloomberg|ft|financial times)$/i, "")
    .replace(/\s+\|\s+.+$/i, "")
    .replace(/^live updates?:\s*/i, "")
    .replace(/^analysis:\s*/i, "")
    .replace(/^watch:\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();

  const replacements: Array<[RegExp, string]> = [
    [/\bsignals\b/i, "signaled"],
    [/\bweighs\b/i, "weighed"],
    [/\bplans\b/i, "planned"],
    [/\bexpands\b/i, "expanded"],
    [/\blaunches\b/i, "launched"],
    [/\bunveils\b/i, "unveiled"],
    [/\bapproves\b/i, "approved"],
    [/\bdelays\b/i, "delayed"],
    [/\bcuts\b/i, "cut"],
    [/\braises\b/i, "raised"],
    [/\bopens\b/i, "opened"],
    [/\bstarts\b/i, "started"],
  ];

  for (const [pattern, replacement] of replacements) {
    if (pattern.test(cleaned)) {
      return cleaned.replace(pattern, replacement);
    }
  }

  return cleaned;
}

function buildSummary(
  articles: FeedArticle[],
  primaryChange: string,
  sourceDiversity: number,
  topics: string[],
) {
  const representative = articles[0];
  const leadSentence = firstSentence(representative?.summaryText ?? "", primaryChange);
  const topicLabel = topics[0] ? formatTopicLabel(topics[0]) : "the current briefing";
  const confirmation =
    sourceDiversity > 1
      ? `Coverage has spread across ${sourceDiversity} sources in ${topicLabel}.`
      : `This is still early coverage inside ${topicLabel}.`;

  return `${ensurePeriod(primaryChange)} ${normalizeSupportSentence(leadSentence, confirmation)}`;
}

function computeRecencyScore(articles: FeedArticle[]) {
  const newestTimestamp = Math.max(...articles.map((article) => new Date(article.publishedAt).getTime()));
  const ageHours = Math.max(0, (Date.now() - newestTimestamp) / (1000 * 60 * 60));
  return Math.round(Math.max(0, 100 - Math.min(ageHours, 48) / 48 * 100));
}

function computeVelocityScore(articles: FeedArticle[]) {
  if (articles.length <= 1) {
    return 20;
  }

  const newestTimestamp = Math.max(...articles.map((article) => new Date(article.publishedAt).getTime()));
  const twelveHoursAgo = newestTimestamp - 12 * 60 * 60 * 1000;
  const lastTwelveHours = articles.filter(
    (article) => new Date(article.publishedAt).getTime() >= twelveHoursAgo,
  ).length;

  return Math.min(100, Math.round((lastTwelveHours / Math.max(articles.length, 1)) * 100));
}

function normalizeArticleCount(articleCount: number) {
  return Math.min(articleCount, 8) / 8 * 100;
}

function normalizeSourceDiversity(sourceDiversity: number) {
  return Math.min(sourceDiversity, 6) / 6 * 100;
}

function buildRankingReason(input: {
  articleCount: number;
  sourceDiversity: number;
  recencyScore: number;
  velocityScore: number;
  keyEntities: string[];
  topics: string[];
  primaryChange: string;
}) {
  const anchor = input.keyEntities[0] ?? input.primaryChange;

  if (input.articleCount >= 6 && input.sourceDiversity >= 4) {
    return `Broad coverage around ${anchor} across ${input.articleCount} articles from ${input.sourceDiversity} sources.`;
  }

  if (input.velocityScore >= 70) {
    return `Rapid pickup on ${anchor} as related coverage accelerated across ${input.sourceDiversity} outlets.`;
  }

  if (input.recencyScore >= 75 && input.sourceDiversity >= 3) {
    return `Fresh multi-source reporting on ${anchor} kept this event near the top of the briefing.`;
  }

  if (input.topics.includes("finance") || input.topics.includes("business")) {
    return `${anchor} ranked because markets and company coverage converged across ${input.sourceDiversity} sources.`;
  }

  if (input.topics.includes("politics") || input.topics.includes("geopolitics")) {
    return `${anchor} ranked because policy and geopolitical signals spread across multiple outlets.`;
  }

  return `${anchor} ranked on current coverage breadth, freshness, and clear topic fit.`;
}

function computeConfidenceScore(input: {
  articleCount: number;
  sourceDiversity: number;
  keyEntities: string[];
  topics: string[];
  summary: string;
  matchedKeywords: string[];
}) {
  const articleSignal = normalizeArticleCount(input.articleCount);
  const sourceSignal = normalizeSourceDiversity(input.sourceDiversity);
  const entitySignal = input.keyEntities.length ? Math.min(100, input.keyEntities.length * 28) : 0;
  const summarySignal = input.summary.length >= 60 ? 100 : input.summary.length >= 35 ? 70 : 35;
  const topicSignal = input.topics.length ? Math.min(100, input.topics.length * 30) : 20;
  const keywordSignal = input.matchedKeywords.length ? Math.min(100, input.matchedKeywords.length * 20) : 10;

  return Math.round(
    articleSignal * 0.25 +
      sourceSignal * 0.25 +
      entitySignal * 0.2 +
      summarySignal * 0.15 +
      topicSignal * 0.1 +
      keywordSignal * 0.05,
  );
}

function evaluateHighSignal(input: {
  title: string;
  summary: string;
  topics: string[];
  rankingScore: number;
  articleCount: number;
  sourceDiversity: number;
}) {
  const corpus = normalizeText(`${input.title} ${input.summary} ${input.topics.join(" ")}`);

  if (LOW_SIGNAL_HINTS.some((hint) => corpus.includes(hint))) {
    return false;
  }

  if (HIGH_SIGNAL_HINTS.some((hint) => corpus.includes(hint))) {
    return true;
  }

  return input.rankingScore >= 45 && (input.articleCount >= 2 || input.sourceDiversity >= 2);
}

function cleanEntity(value: string) {
  return value
    .replace(/[^\w\s&.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isStopEntity(value: string) {
  const normalized = value.toLowerCase();
  return [
    "the",
    "a",
    "an",
    "markets",
    "market",
    "company",
    "companies",
    "today",
    "analysis",
    "live",
    "update",
    "updates",
  ].includes(normalized);
}

function isCommonSignal(value: string) {
  const normalized = value.toLowerCase();
  return TOPIC_RULES.some((rule) => rule.keywords.includes(normalized));
}

function normalizeText(value: string) {
  return stripHtml(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s&-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function ensurePeriod(value: string) {
  const trimmed = value.trim();
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function normalizeSupportSentence(leadSentence: string, fallback: string) {
  const cleaned = firstSentence(leadSentence, fallback).trim();
  const sentence = cleaned && cleaned.toLowerCase() !== fallback.toLowerCase() ? cleaned : fallback;
  return ensurePeriod(sentence);
}

function formatTopicLabel(topic: string) {
  if (topic === "tech" || topic === "finance" || topic === "politics") {
    return getHomepageCategoryLabel(topic);
  }

  return topic.charAt(0).toUpperCase() + topic.slice(1);
}
