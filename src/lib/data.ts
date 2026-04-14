import { createHash } from "crypto";
import { formatISO } from "date-fns";

import { demoDashboardData, demoHistory, demoSources, demoTopics } from "@/lib/demo-data";
import { logServerEvent } from "@/lib/observability";
import { rankNewsClusters } from "@/lib/ranking";
import { clusterArticles, fetchFeedArticles } from "@/lib/rss";
import { withServerFallback } from "@/lib/server-safety";
import { summarizeCluster } from "@/lib/summarizer";
import { createSupabaseServerClient, safeGetUser } from "@/lib/supabase/server";
import { matchTopicsForArticle } from "@/lib/topic-matching";
import type { DailyBriefing, DashboardData, Source, Topic, ViewerAccount } from "@/lib/types";

type SupabaseServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

type StoredArticle = {
  id: string;
  title: string;
  summary_text: string | null;
  published_at: string | null;
  url: string;
  source_id: string | null;
};

type StoredArticleTopic = {
  article_id: string;
  topic_id: string;
  matched_keywords: string[] | null;
  match_score: number | null;
};

function createEmptyBriefing(): DailyBriefing {
  return {
    id: `generated-empty-${Date.now()}`,
    briefingDate: formatISO(new Date()),
    title: "Today's Briefing",
    intro: "No matched stories yet for your current topics. Try adjusting keywords or refreshing your briefing.",
    readingWindow: "0 minutes",
    items: [],
  };
}

export async function getViewerAccount(): Promise<ViewerAccount | null> {
  const { user, sessionCookiePresent } = await safeGetUser("/");

  if (!user?.email) {
    if (sessionCookiePresent) {
      logServerEvent("warn", "Viewer lookup fell back to guest mode", {
        route: "/",
        sessionCookiePresent,
      });
    }
    return null;
  }

  const localName = user.email.split("@")[0] ?? "Reader";
  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    localName
      .split(/[._-]+/)
      .filter(Boolean)
      .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  const initials = (displayName || user.email)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);

  return {
    id: user.id,
    email: user.email,
    displayName: displayName || user.email,
    initials: initials || user.email.charAt(0).toUpperCase(),
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  const { supabase, user, sessionCookiePresent } = await safeGetUser("/dashboard");

  if (!supabase || !user) {
    if (sessionCookiePresent) {
      logServerEvent("warn", "Dashboard SSR fell back to public mode", {
        route: "/dashboard",
        sessionCookiePresent,
      });
    }
    return getPublicDashboardData();
  }

  const dashboardQueryResults = await withServerFallback(
    "dashboard queries",
    async () =>
      Promise.all([
        supabase
          .from("topics")
          .select("id, user_id, name, description, color, keywords, exclude_keywords, created_at")
          .eq("user_id", user.id)
          .order("name"),
        supabase
          .from("sources")
          .select("id, user_id, name, feed_url, homepage_url, topic_id, status, created_at, topics(name)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]),
    null,
    { route: "/dashboard", userId: user.id },
  );

  if (!dashboardQueryResults) {
    logServerEvent("warn", "Dashboard data degraded to public fallback", {
      route: "/dashboard",
      userId: user.id,
      reason: "query bundle failed",
    });
    return getPublicDashboardData();
  }

  const [topicsResult, sourcesResult] = dashboardQueryResults;

  if (topicsResult.error || sourcesResult.error) {
    logServerEvent("warn", "Dashboard data degraded to public fallback", {
      route: "/dashboard",
      userId: user.id,
      topicsError: topicsResult.error?.message,
      sourcesError: sourcesResult.error?.message,
    });
    return getPublicDashboardData();
  }

  const topics: Topic[] =
    topicsResult.data?.map((topic) => ({
      id: topic.id,
      userId: topic.user_id,
      name: topic.name,
      description: topic.description,
      color: topic.color,
      keywords: (topic.keywords as string[] | null | undefined) ?? [],
      excludeKeywords: (topic.exclude_keywords as string[] | null | undefined) ?? [],
      createdAt: topic.created_at,
    })) ?? [];

  const sources: Source[] =
    sourcesResult.data?.map((source) => ({
      id: source.id,
      userId: source.user_id,
      name: source.name,
      feedUrl: source.feed_url,
      homepageUrl: source.homepage_url,
      topicId: source.topic_id,
      topicName: Array.isArray(source.topics) ? source.topics[0]?.name : undefined,
      status: source.status,
      createdAt: source.created_at,
    })) ?? [];

  await persistRawArticles(supabase, user.id, sources, "/dashboard");
  await syncTopicMatches(supabase, user.id, topics);

  const briefing = await buildMatchedBriefing(supabase, user.id, topics, sources);

  return {
    mode: "live",
    topics,
    sources,
    briefing,
  };
}

async function getPublicDashboardData(): Promise<DashboardData> {
  const briefing = await generateDailyBriefing(demoTopics, demoSources);

  return {
    mode: "public",
    briefing,
    topics: demoTopics,
    sources: demoSources,
  };
}

export async function getHistory() {
  const { supabase, user, sessionCookiePresent } = await safeGetUser("/history");
  if (!supabase || !user) {
    if (sessionCookiePresent) {
      logServerEvent("warn", "History SSR fell back to demo history", {
        route: "/history",
        sessionCookiePresent,
      });
    }
    return demoHistory;
  }

  const historyResult = await withServerFallback(
    "history query",
    async () =>
      supabase
        .from("daily_briefings")
        .select("id, briefing_date, title, intro, reading_window, briefing_items(id, topic_id, topic_name, title, what_happened, key_points, why_it_matters, sources, estimated_minutes, priority, is_read)")
        .eq("user_id", user.id)
        .order("briefing_date", { ascending: false })
        .limit(14),
    null,
    { route: "/history", userId: user.id },
  );

  if (!historyResult || historyResult.error) {
    logServerEvent("warn", "History data degraded to demo history", {
      route: "/history",
      userId: user.id,
      errorMessage: historyResult?.error?.message ?? "history query failed",
    });
    return demoHistory;
  }

  const { data } = historyResult;

  if (!data?.length) return demoHistory;

  return data.map(
    (briefing): DailyBriefing => ({
      id: briefing.id,
      briefingDate: briefing.briefing_date,
      title: briefing.title,
      intro: briefing.intro,
      items:
        briefing.briefing_items?.map((item) => ({
          id: item.id,
          topicId: item.topic_id,
          topicName: item.topic_name,
          title: item.title,
          whatHappened: item.what_happened,
          keyPoints: item.key_points as [string, string, string],
          whyItMatters: item.why_it_matters,
          sources: (item.sources as Array<{ title: string; url: string }>) ?? [],
          estimatedMinutes: item.estimated_minutes,
          read: item.is_read,
          priority: item.priority,
          matchedKeywords: extractMatchedKeywords(item.key_points as string[]),
          importanceScore: undefined,
          importanceLabel: undefined,
          rankingSignals: [],
        })) ?? [],
      readingWindow: deriveReadingWindow(
        briefing.briefing_items?.map((item) => item.estimated_minutes) ?? [],
        briefing.reading_window,
      ),
    }),
  );
}

export async function generateDailyBriefing(
  topics: Topic[] = demoTopics,
  sources: Source[] = demoSources,
): Promise<DailyBriefing> {
  const items = await Promise.all(
    topics.map(async (topic, index) => {
      const topicSources = sources.filter((source) => source.topicId === topic.id && source.status === "active");
      const feedArticles = await Promise.allSettled(
        topicSources.map((source) => fetchFeedArticles(source.feedUrl, source.name)),
      );

      const articles = feedArticles.flatMap((result) =>
        result.status === "fulfilled" ? result.value : [],
      );

      if (!articles.length) {
        return null;
      }

      const rankedClusters = rankNewsClusters(topic.name, clusterArticles(articles)).slice(0, 3);

      if (!rankedClusters.length) {
        return null;
      }

      const summaries = await Promise.all(
        rankedClusters.map(async (cluster, clusterIndex) => {
          const summary = await summarizeCluster(topic.name, cluster.sources);

          return {
            id: `generated-${topic.id}-${clusterIndex + 1}`,
            topicId: topic.id,
            topicName: topic.name,
            title: summary.headline,
            whatHappened: summary.whatHappened,
            keyPoints: summary.keyPoints,
            whyItMatters: summary.whyItMatters,
            sources: cluster.sources.slice(0, 3).map((article) => ({
              title: article.sourceName,
              url: article.url,
            })),
            estimatedMinutes: summary.estimatedMinutes,
            read: false,
            priority: index < 2 ? ("top" as const) : ("normal" as const),
            importanceScore: cluster.importanceScore,
            importanceLabel: cluster.importanceLabel,
            rankingSignals: cluster.rankingSignals,
          };
        }),
      );

      return summaries;
    }),
  );

  const validItems = items
    .flat()
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((left, right) => (right.importanceScore ?? 0) - (left.importanceScore ?? 0))
    .map((item, index) => ({
      ...item,
      priority: index < 5 ? ("top" as const) : ("normal" as const),
    }));

  if (!validItems.length) {
    return topics === demoTopics && sources === demoSources
      ? demoDashboardData.briefing
      : createEmptyBriefing();
  }

  const totalMinutes = validItems.reduce((sum, item) => sum + item.estimatedMinutes, 0);

  return {
    id: `generated-${Date.now()}`,
    briefingDate: formatISO(new Date()),
    title: "Daily Executive Briefing",
    intro: "A concise scan of the stories most likely to affect decisions today.",
    readingWindow: `${totalMinutes} minutes`,
    items: validItems,
  };
}

export async function syncTopicMatches(
  supabase: SupabaseServerClient,
  userId: string,
  topics: Topic[],
) {
  const articleResult = await supabase
    .from("articles")
    .select("id, title, summary_text")
    .eq("user_id", userId);

  if (articleResult.error) {
    logServerEvent("warn", "Topic matching article lookup failed", {
      route: "/dashboard",
      userId,
      errorMessage: articleResult.error.message,
    });
    return;
  }

  const articles = articleResult.data ?? [];
  const articleIds = articles.map((article) => article.id);

  if (articleIds.length) {
    const deleteResult = await supabase.from("article_topics").delete().in("article_id", articleIds);
    if (deleteResult.error) {
      logServerEvent("warn", "Topic matching cleanup failed", {
        route: "/dashboard",
        userId,
        errorMessage: deleteResult.error.message,
      });
      return;
    }
  }

  if (!articles.length || !topics.length) {
    return;
  }

  const rows = articles.flatMap((article) =>
    matchTopicsForArticle(
      {
        id: article.id,
        title: article.title,
        summaryText: article.summary_text,
      },
      topics.map((topic) => ({
        id: topic.id,
        name: topic.name,
        keywords: topic.keywords,
        excludeKeywords: topic.excludeKeywords,
      })),
    ).map((match) => ({
      article_id: article.id,
      topic_id: match.topicId,
      matched_keywords: match.matchedKeywords,
      match_score: match.matchScore,
    })),
  );

  if (!rows.length) {
    return;
  }

  const insertResult = await supabase.from("article_topics").insert(rows);
  if (insertResult.error) {
    logServerEvent("warn", "Topic matching insert failed", {
      route: "/dashboard",
      userId,
      errorMessage: insertResult.error.message,
      attemptedRows: rows.length,
    });
  }
}

export async function buildMatchedBriefing(
  supabase: SupabaseServerClient,
  userId: string,
  topics: Topic[],
  sources: Source[],
): Promise<DailyBriefing> {
  if (!topics.length) {
    return createEmptyBriefing();
  }

  const [articleResult, matchResult] = await Promise.all([
    supabase
      .from("articles")
      .select("id, title, summary_text, published_at, url, source_id")
      .eq("user_id", userId),
    supabase
      .from("article_topics")
      .select("article_id, topic_id, matched_keywords, match_score"),
  ]);

  if (articleResult.error || matchResult.error) {
    logServerEvent("warn", "Matched briefing query failed", {
      route: "/dashboard",
      userId,
      articlesError: articleResult.error?.message,
      matchesError: matchResult.error?.message,
    });
    return createEmptyBriefing();
  }

  const articles = (articleResult.data ?? []) as StoredArticle[];
  const matches = (matchResult.data ?? []) as StoredArticleTopic[];

  const articleById = new Map(articles.map((article) => [article.id, article]));
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const topicById = new Map(topics.map((topic) => [topic.id, topic]));

  const items = matches
    .map((match) => {
      const article = articleById.get(match.article_id);
      const topic = topicById.get(match.topic_id);

      if (!article || !topic) {
        return null;
      }

      const source = article.source_id ? sourceById.get(article.source_id) : undefined;
      const matchedKeywords = (match.matched_keywords ?? []).filter(Boolean);
      const sourceLabel = source?.name ?? topic.name;
      const publishedLabel = formatPublishedLabel(article.published_at);

      return {
        id: `generated-${article.id}-${topic.id}`,
        topicId: topic.id,
        topicName: topic.name,
        title: article.title,
        whatHappened: article.summary_text?.trim() || article.title,
        keyPoints: [
          `Matched on: ${matchedKeywords.join(", ")}`,
          `Source: ${sourceLabel}`,
          `Published: ${publishedLabel}`,
        ] as [string, string, string],
        whyItMatters:
          matchedKeywords.length === 1
            ? `Why this is in ${topic.name}: keyword "${matchedKeywords[0]}" matched the story text.`
            : `Why this is in ${topic.name}: keyword matches included ${matchedKeywords.join(", ")}.`,
        sources: [
          {
            title: sourceLabel,
            url: article.url,
          },
        ],
        estimatedMinutes: 3,
        read: false,
        priority: "normal" as const,
        matchedKeywords,
        matchScore: match.match_score ?? 0,
        publishedAt: article.published_at ?? undefined,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((left, right) => {
      const scoreDelta = (right.matchScore ?? 0) - (left.matchScore ?? 0);
      if (scoreDelta !== 0) return scoreDelta;
      const rightPublished = right.publishedAt ? new Date(right.publishedAt).getTime() : 0;
      const leftPublished = left.publishedAt ? new Date(left.publishedAt).getTime() : 0;
      return rightPublished - leftPublished;
    })
    .map((item, index) => ({
      ...item,
      priority: index < 5 ? ("top" as const) : ("normal" as const),
    }));

  if (!items.length) {
    return createEmptyBriefing();
  }

  return {
    id: `generated-${Date.now()}`,
    briefingDate: formatISO(new Date()),
    title: "Today's Briefing",
    intro: "Articles are now organized by deterministic topic matches from your saved keywords.",
    readingWindow: `${items.reduce((sum, item) => sum + item.estimatedMinutes, 0)} minutes`,
    items,
  };
}

export async function persistRawArticles(
  supabase: SupabaseServerClient,
  userId: string,
  sources: Source[],
  route = "/dashboard",
) {
  const activeSources = sources.filter((source) => source.status === "active");

  if (!activeSources.length) {
    logServerEvent("info", "Skipping raw article persistence because no active sources exist", {
      route,
      userId,
    });
    return;
  }

  const fetchedResults = await Promise.allSettled(
    activeSources.map(async (source) => {
      const articles = await fetchFeedArticles(source.feedUrl, source.name);
      return { source, articles };
    }),
  );

  const failedFetches = fetchedResults.filter((result) => result.status === "rejected");
  failedFetches.forEach((result, index) => {
    logServerEvent("warn", "Source fetch failed during raw article persistence", {
      route,
      userId,
      failureIndex: index,
      errorMessage: result.reason instanceof Error ? result.reason.message : String(result.reason),
    });
  });

  const fetchedArticles = fetchedResults.flatMap((result) =>
    result.status === "fulfilled"
      ? result.value.articles.map((article) => {
          const canonicalUrl = canonicalizeArticleUrl(article.url);
          return {
            sourceId: result.value.source.id,
            sourceName: article.sourceName,
            title: article.title,
            url: canonicalUrl,
            summaryText: article.summaryText,
            contentText: article.contentText,
            publishedAt: article.publishedAt,
            dedupeKey: createArticleDedupeKey(article.title, canonicalUrl),
          };
        })
      : [],
  );

  if (!fetchedArticles.length) {
    logServerEvent("warn", "No raw articles were fetched from active sources", {
      route,
      userId,
      activeSourceCount: activeSources.length,
      failedSourceCount: failedFetches.length,
    });
    return;
  }

  const fetchedCount = fetchedArticles.length;
  console.info("[ingestion] fetched_count=", fetchedCount, "failed_source_count=", failedFetches.length);

  const dedupeKeys = [...new Set(fetchedArticles.map((article) => article.dedupeKey))];

  const existingResult = await supabase
    .from("articles")
    .select("dedupe_key")
    .eq("user_id", userId)
    .in("dedupe_key", dedupeKeys);

  if (existingResult.error) {
    logServerEvent("warn", "Existing raw article lookup failed", {
      route,
      userId,
      errorMessage: existingResult.error.message,
      attemptedKeys: dedupeKeys.length,
    });
    return;
  }

  const existingKeys = new Set(
    (existingResult.data ?? [])
      .map((row) => row.dedupe_key)
      .filter((value): value is string => Boolean(value)),
  );

  const rowsToInsert = fetchedArticles
    .filter((article) => !existingKeys.has(article.dedupeKey))
    .map((article) => ({
      user_id: userId,
      source_id: article.sourceId,
      title: article.title,
      url: article.url,
      summary_text: article.summaryText,
      published_at: article.publishedAt,
      dedupe_key: article.dedupeKey,
    }));

  const skippedCount = fetchedCount - rowsToInsert.length;

  if (!rowsToInsert.length) {
    console.info(
      "[ingestion] inserted_count=",
      0,
      "skipped_count=",
      skippedCount,
      "failed_source_count=",
      failedFetches.length,
    );
    logServerEvent("info", "No new raw articles to insert after dedupe", {
      route,
      userId,
      fetchedRows: fetchedCount,
      skippedCount,
      failedSourceCount: failedFetches.length,
    });
    return;
  }

  const insertResult = await supabase.from("articles").insert(rowsToInsert);

  if (insertResult.error) {
    logServerEvent("warn", "Raw article persistence failed", {
      route,
      userId,
      errorMessage: insertResult.error.message,
      attemptedRows: rowsToInsert.length,
      skippedCount,
      failedSourceCount: failedFetches.length,
    });
    return;
  }

  console.info(
    "[ingestion] inserted_count=",
    rowsToInsert.length,
    "skipped_count=",
    skippedCount,
    "failed_source_count=",
    failedFetches.length,
  );

  logServerEvent("info", "Stored raw articles", {
    route,
    userId,
    fetchedCount,
    insertedRows: rowsToInsert.length,
    skippedCount,
    failedSourceCount: failedFetches.length,
  });
}

function extractMatchedKeywords(keyPoints: string[]) {
  const matchedOn = keyPoints.find((point) => point.startsWith("Matched on:"));
  if (!matchedOn) return [];
  return matchedOn
    .replace(/^Matched on:\s*/i, "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function formatPublishedLabel(value: string | null) {
  if (!value) {
    return "recently";
  }

  const published = new Date(value);
  if (Number.isNaN(published.getTime())) {
    return "recently";
  }

  return published.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function canonicalizeArticleUrl(value: string) {
  try {
    const url = new URL(value);
    url.hash = "";

    const allowed = new URLSearchParams();
    url.searchParams.forEach((paramValue, key) => {
      const normalizedKey = key.toLowerCase();
      if (
        normalizedKey.startsWith("utm_") ||
        normalizedKey === "fbclid" ||
        normalizedKey === "gclid" ||
        normalizedKey === "mc_cid" ||
        normalizedKey === "mc_eid"
      ) {
        return;
      }
      allowed.append(key, paramValue);
    });

    const query = allowed.toString();
    url.search = query ? `?${query}` : "";
    return url.toString();
  } catch {
    return value.trim();
  }
}

function createArticleDedupeKey(title: string, url: string) {
  return createHash("sha256")
    .update(`${title.trim().toLowerCase()}::${url.trim().toLowerCase()}`)
    .digest("hex");
}

function deriveReadingWindow(estimatedMinutes: number[], fallback: string) {
  const totalMinutes = estimatedMinutes.reduce((sum, minutes) => sum + minutes, 0);
  return totalMinutes > 0 ? `${totalMinutes} minutes` : fallback;
}
