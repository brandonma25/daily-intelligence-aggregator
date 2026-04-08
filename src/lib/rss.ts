import Parser from "rss-parser";

import { env } from "@/lib/env";
import { stripHtml } from "@/lib/utils";

export type FeedArticle = {
  title: string;
  url: string;
  summaryText: string;
  sourceName: string;
  publishedAt: string;
};

const parser = new Parser();

export async function fetchFeedArticles(feedUrl: string, sourceName: string) {
  if (feedUrl.startsWith("newsapi://")) {
    return fetchNewsApiArticles(feedUrl, sourceName);
  }

  const response = await fetch(feedUrl, {
    next: { revalidate: 900 },
    headers: {
      "User-Agent": "Daily-Intelligence-Aggregator/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Feed request failed for ${sourceName}`);
  }

  const xml = await response.text();
  const feed = await parser.parseString(xml);

  return (feed.items ?? []).slice(0, 15).map<FeedArticle>((item, index) => ({
    title: item.title?.trim() || `Untitled article ${index + 1}`,
    url: item.link?.trim() || feedUrl,
    summaryText: stripHtml(
      item.contentSnippet ?? item.content ?? item.summary ?? item.title ?? "",
    ),
    sourceName,
    publishedAt: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
  }));
}

async function fetchNewsApiArticles(feedUrl: string, sourceName: string) {
  if (!env.newsApiKey) {
    throw new Error(`NewsAPI key is not configured for ${sourceName}`);
  }

  const normalizedUrl = feedUrl.replace("newsapi://", "https://");
  const url = new URL(normalizedUrl);
  url.searchParams.set("pageSize", url.searchParams.get("pageSize") ?? "15");
  url.searchParams.set("language", url.searchParams.get("language") ?? "en");

  const response = await fetch(url.toString(), {
    next: { revalidate: 900 },
    headers: {
      "X-Api-Key": env.newsApiKey,
      "User-Agent": "Daily-Intelligence-Aggregator/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`NewsAPI request failed for ${sourceName}`);
  }

  const payload = await response.json();

  return (payload.articles ?? []).slice(0, 15).map<FeedArticle>(
    (
      article: {
        title?: string;
        url?: string;
        description?: string;
        content?: string;
        publishedAt?: string;
      },
      index: number,
    ) => ({
      title: article.title?.trim() || `Untitled article ${index + 1}`,
      url: article.url?.trim() || url.toString(),
      summaryText: stripHtml(article.description ?? article.content ?? article.title ?? ""),
      sourceName,
      publishedAt: article.publishedAt ?? new Date().toISOString(),
    }),
  );
}

export function clusterArticles(
  articles: FeedArticle[],
): Array<{ representative: FeedArticle; sources: FeedArticle[] }> {
  const sortedArticles = [...articles].sort(
    (left, right) =>
      new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime(),
  );
  const clusters: Array<{ representative: FeedArticle; sources: FeedArticle[] }> = [];

  for (const article of sortedArticles) {
    const normalized = normalize(article.title);
    const match = clusters.find((cluster) => similarity(normalized, normalize(cluster.representative.title)) >= 0.55);

    if (match) {
      match.sources.push(article);
    } else {
      clusters.push({ representative: article, sources: [article] });
    }
  }

  return clusters.sort((left, right) => clusterScore(right) - clusterScore(left));
}

function clusterScore(cluster: { representative: FeedArticle; sources: FeedArticle[] }) {
  const freshestPublishedAt = Math.max(
    ...cluster.sources.map((article) => new Date(article.publishedAt).getTime()),
  );

  // Favor clusters that are both recent and corroborated by multiple sources.
  return freshestPublishedAt + cluster.sources.length * 60 * 60 * 1000;
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .slice(0, 8);
}

function similarity(left: string[], right: string[]) {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const overlap = [...leftSet].filter((word) => rightSet.has(word)).length;
  const union = new Set([...leftSet, ...rightSet]).size;
  return union === 0 ? 0 : overlap / union;
}
