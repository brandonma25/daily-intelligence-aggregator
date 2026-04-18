import type { Source } from "@/lib/types";
import { getDefaultDonorFeeds, type DonorFeed } from "@/adapters/donors";
import type { RawItem } from "@/lib/models/raw-item";
import { logPipelineEvent } from "@/lib/observability/logger";
import { fetchFeedArticles } from "@/lib/rss";
import { cleanText, stableId } from "@/lib/pipeline/shared/text";

import { seedRawItems } from "./seed-items";

type IngestionFailure = {
  source: string;
  feedUrl: string;
  error: string;
};

type IngestionResult = {
  items: RawItem[];
  failures: IngestionFailure[];
  usedSeedFallback: boolean;
  feeds: DonorFeed[];
};

function feedsFromSources(sources?: Source[]): DonorFeed[] {
  if (!sources?.length) {
    return getDefaultDonorFeeds();
  }

  return sources
    .filter((source) => source.status === "active")
    .slice(0, 5)
    .map((source) => ({
      donor: "openclaw",
      source: source.name,
      feedUrl: source.feedUrl,
      homepageUrl: source.homepageUrl ?? source.feedUrl,
      topic: source.topicName === "Finance" ? "Finance" : source.topicName === "World" ? "World" : "Tech",
      credibility: source.topicName === "Finance" ? 80 : 76,
    }));
}

async function fetchFeedWithStageRetry(feed: DonorFeed) {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await fetchFeedArticles(feed.feedUrl, feed.source, {
        timeoutMs: 4_500 + attempt * 1_500,
        retryCount: 1,
      });
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError ?? new Error(`Unknown ingestion error for ${feed.source}`);
}

export async function ingestRawItems(options: { sources?: Source[] } = {}): Promise<IngestionResult> {
  const feeds = feedsFromSources(options.sources);
  const failures: IngestionFailure[] = [];
  const batches = await Promise.all(
    feeds.map(async (feed) => {
      try {
        const articles = await fetchFeedWithStageRetry(feed);
        return articles.slice(0, 6).map<RawItem>((article) => ({
          id: stableId(feed.source, article.url, article.publishedAt),
          source: article.sourceName || feed.source,
          title: cleanText(article.title),
          url: article.url,
          published_at: article.publishedAt,
          raw_content: cleanText(article.contentText ?? article.summaryText),
        }));
      } catch (error) {
        const failure = {
          source: feed.source,
          feedUrl: feed.feedUrl,
          error: error instanceof Error ? error.message : String(error),
        };
        failures.push(failure);
        logPipelineEvent("warn", "Feed ingestion failed", failure);
        return [];
      }
    }),
  );

  const items = batches.flat();
  if (items.length > 0) {
    return {
      items,
      failures,
      usedSeedFallback: false,
      feeds,
    };
  }

  logPipelineEvent("warn", "All live feed requests failed, using deterministic seed fallback", {
    failureCount: failures.length,
  });

  return {
    items: seedRawItems,
    failures,
    usedSeedFallback: true,
    feeds,
  };
}
