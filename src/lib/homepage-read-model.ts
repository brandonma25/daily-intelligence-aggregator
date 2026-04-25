import { formatISO } from "date-fns";

import {
  demoDashboardData,
  demoTopics,
} from "@/lib/demo-data";
import { countSourcesByHomepageCategory } from "@/lib/homepage-taxonomy";
import { logServerEvent } from "@/lib/observability";
import { getPublishedSignalPosts, type PublishedSignalPost } from "@/lib/published-signals";
import { getSourcesForPublicSurface } from "@/lib/source-manifest";
import {
  createSupabaseServerClient,
  safeGetUser,
} from "@/lib/supabase/server";
import { getBriefingDateKey } from "@/lib/utils";
import type {
  BriefingItem,
  DailyBriefing,
  DashboardData,
  Source,
  Topic,
  ViewerAccount,
} from "@/lib/types";

type StoredBriefingItemRow = {
  id: string;
  topic_id: string | null;
  topic_name: string | null;
  title: string;
  what_happened: string;
  key_points: string[] | null;
  why_it_matters: string;
  sources: Array<{ title: string; url: string }> | null;
  estimated_minutes: number | null;
  priority: BriefingItem["priority"] | null;
  is_read: boolean | null;
};

type StoredBriefingRow = {
  id: string;
  briefing_date: string;
  title: string;
  intro: string;
  reading_window: string | null;
  briefing_items: StoredBriefingItemRow[] | null;
};

type TopicRow = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  color: string;
  keywords: string[] | null;
  exclude_keywords: string[] | null;
  created_at: string;
};

type SourceRow = {
  id: string;
  user_id: string;
  name: string;
  feed_url: string;
  homepage_url: string | null;
  topic_id: string | null;
  status: Source["status"];
  created_at: string;
  topics: Array<{ name: string | null }> | null;
};

type RequestAuthState = Awaited<ReturnType<typeof safeGetUser>> & {
  viewer: ViewerAccount | null;
  route: string;
};

const BRIEFING_SELECT =
  "id, briefing_date, title, intro, reading_window, briefing_items(id, topic_id, topic_name, title, what_happened, key_points, why_it_matters, sources, estimated_minutes, priority, is_read)";

const DEMO_PUBLIC_FALLBACK_ITEMS: BriefingItem[] = [
  {
    id: "fallback-politics-1",
    topicId: "topic-politics",
    topicName: "Politics",
    title: "The public politics briefing keeps a ready fallback card so homepage SSR stays stable when published signals are unavailable",
    whatHappened:
      "The homepage fallback keeps a politics rail populated from static safe content when the live published signal set is empty, avoiding a broken or under-filled public briefing.",
    keyPoints: [
      "This fallback activates only when no published live signal set is available for the public homepage.",
      "The SSR path stays read-only and avoids feed parsing, ingestion, and runtime source activation.",
      "The layout still preserves the signed-out homepage contract with a balanced cross-category briefing.",
    ],
    whyItMatters:
      "This preserves the homepage reading experience during storage gaps or rollout transitions without pulling ingestion code back into the render path.",
    sources: [
      { title: "BBC World News", url: "https://www.bbc.com/news/world" },
      { title: "Foreign Affairs", url: "https://www.foreignaffairs.com" },
    ],
    sourceCount: 2,
    estimatedMinutes: 4,
    read: false,
    priority: "top",
    matchedKeywords: ["politics", "world", "fallback"],
    importanceScore: 70,
    importanceLabel: "High",
    rankingSignals: [
      "Static fallback protects homepage availability.",
      "Balanced public briefing keeps cross-category coverage visible.",
    ],
  },
];

function buildViewerAccount(user: Awaited<ReturnType<typeof safeGetUser>>["user"]): ViewerAccount | null {
  if (!user?.email) {
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
    avatarUrl:
      typeof user.user_metadata?.avatar_url === "string"
        ? user.user_metadata.avatar_url
        : typeof user.user_metadata?.picture === "string"
          ? user.user_metadata.picture
          : null,
  };
}

async function getRequestAuthState(route: string): Promise<RequestAuthState> {
  const authState = await safeGetUser(route);

  return {
    ...authState,
    route,
    viewer: buildViewerAccount(authState.user),
  };
}

function deriveReadingWindow(minutes: number[], storedReadingWindow?: string | null) {
  const totalMinutes = minutes.reduce((sum, value) => sum + value, 0);
  if (totalMinutes > 0) {
    return `${totalMinutes} minutes`;
  }

  return storedReadingWindow?.trim() || "0 minutes";
}

function mapStoredBriefingItem(row: StoredBriefingItemRow): BriefingItem {
  const normalizedKeyPoints = Array.isArray(row.key_points)
    ? row.key_points.filter((point): point is string => typeof point === "string").slice(0, 3)
    : [];
  const normalizedSources = Array.isArray(row.sources)
    ? row.sources.filter((source): source is { title: string; url: string } => Boolean(source?.title && source?.url))
    : [];
  while (normalizedKeyPoints.length < 3) {
    normalizedKeyPoints.push("");
  }

  return {
    id: row.id,
    topicId: row.topic_id ?? "topic-tech",
    topicName: row.topic_name ?? "Tech",
    title: row.title,
    whatHappened: row.what_happened,
    keyPoints: [normalizedKeyPoints[0], normalizedKeyPoints[1], normalizedKeyPoints[2]],
    whyItMatters: row.why_it_matters,
    sources: normalizedSources,
    sourceCount: normalizedSources.length,
    estimatedMinutes: row.estimated_minutes ?? 3,
    read: Boolean(row.is_read),
    priority: row.priority === "top" ? "top" : "normal",
    matchedKeywords: [],
    rankingSignals: [],
  };
}

function mapStoredBriefing(row: StoredBriefingRow): DailyBriefing {
  const items = (row.briefing_items ?? [])
    .map(mapStoredBriefingItem)
    .sort((left, right) => {
      if (left.priority !== right.priority) {
        return left.priority === "top" ? -1 : 1;
      }

      return left.title.localeCompare(right.title);
    });

  return {
    id: row.id,
    briefingDate: row.briefing_date,
    title: row.title,
    intro: row.intro,
    readingWindow: deriveReadingWindow(
      items.map((item) => item.estimatedMinutes),
      row.reading_window,
    ),
    items,
  };
}

function inferTopicName(tags: string[]) {
  const normalizedTags = tags.map((tag) => tag.trim().toLowerCase());

  if (
    normalizedTags.some((tag) =>
      ["finance", "economics", "economy", "markets", "macro", "business"].includes(tag),
    )
  ) {
    return "Finance";
  }

  if (
    normalizedTags.some((tag) =>
      ["politics", "policy", "world", "geopolitics", "government"].includes(tag),
    )
  ) {
    return "Politics";
  }

  return "Tech";
}

function getTopicId(topicName: string) {
  switch (topicName) {
    case "Finance":
      return "topic-finance";
    case "Politics":
      return "topic-politics";
    default:
      return "topic-tech";
  }
}

function getImportanceLabel(score: number | null) {
  if (typeof score !== "number") {
    return undefined;
  }

  if (score >= 80) {
    return "Critical" as const;
  }

  if (score >= 65) {
    return "High" as const;
  }

  return "Watch" as const;
}

function buildPublishedSignalKeyPoints(post: PublishedSignalPost): [string, string, string] {
  const sourcePoint = post.sourceName
    ? `Lead coverage is anchored by ${post.sourceName}.`
    : "Lead coverage is anchored by the published signal set.";
  const rankPoint = `Published as live signal #${post.rank} for the homepage briefing.`;
  const summaryPoint = post.summary || post.selectionReason || post.publishedWhyItMatters;

  return [sourcePoint, rankPoint, summaryPoint];
}

function mapPublishedSignalPostToBriefingItem(post: PublishedSignalPost): BriefingItem {
  const topicName = inferTopicName(post.tags);

  return {
    id: post.id,
    topicId: getTopicId(topicName),
    topicName,
    title: post.title,
    whatHappened: post.summary || post.selectionReason || post.publishedWhyItMatters,
    keyPoints: buildPublishedSignalKeyPoints(post),
    whyItMatters: post.publishedWhyItMatters,
    publishedWhyItMatters: post.publishedWhyItMatters,
    editorialWhyItMatters: post.publishedWhyItMattersStructured,
    publishedWhyItMattersStructured: post.publishedWhyItMattersStructured,
    editorialStatus: "published",
    sources: post.sourceUrl ? [{ title: post.sourceName || "Source", url: post.sourceUrl }] : [],
    sourceCount: post.sourceUrl ? 1 : 0,
    estimatedMinutes: 4,
    read: false,
    priority: post.rank <= 5 ? "top" : "normal",
    matchedKeywords: post.tags,
    importanceScore: post.signalScore ?? undefined,
    importanceLabel: getImportanceLabel(post.signalScore),
    rankingSignals: [post.selectionReason].filter(Boolean),
  };
}

function buildHomepageDiagnostics(sources: Source[], itemCount: number): DashboardData["homepageDiagnostics"] {
  return {
    totalArticlesFetched: null,
    totalCandidateEvents: itemCount,
    failedSourceCount: 0,
    fallbackSourceCount: 0,
    degradedSourceNames: [],
    sourceCountsByCategory: countSourcesByHomepageCategory(sources),
  };
}

function normalizeCalendarSafeBriefingDate(dateKey: string) {
  return `${dateKey}T12:00:00`;
}

function buildDemoHomepageData(): DashboardData {
  const sources = getSourcesForPublicSurface("public.home");
  const items = [...demoDashboardData.briefing.items, ...DEMO_PUBLIC_FALLBACK_ITEMS].slice(0, 5);
  const briefingDate = normalizeCalendarSafeBriefingDate(
    getBriefingDateKey(demoDashboardData.briefing.briefingDate),
  );

  return {
    ...demoDashboardData,
    mode: "public",
    briefing: {
      ...demoDashboardData.briefing,
      briefingDate,
      readingWindow: `${items.reduce((sum, item) => sum + item.estimatedMinutes, 0)} minutes`,
      items,
    },
    topics: demoTopics,
    sources,
    publicRankedItems: items,
    homepageDiagnostics: buildHomepageDiagnostics(sources, items.length),
  };
}

async function buildPublicHomepageData(): Promise<DashboardData> {
  const publishedSignals = await getPublishedSignalPosts();
  const sources = getSourcesForPublicSurface("public.home");

  if (publishedSignals.length === 0) {
    return buildDemoHomepageData();
  }

  const briefingDateKey =
    publishedSignals[0]?.briefingDate &&
    /^\d{4}-\d{2}-\d{2}$/.test(publishedSignals[0].briefingDate)
      ? publishedSignals[0].briefingDate
      : getBriefingDateKey(formatISO(new Date()));
  const briefingDate = normalizeCalendarSafeBriefingDate(briefingDateKey);
  const items = publishedSignals.map(mapPublishedSignalPostToBriefingItem);

  return {
    mode: "public",
    briefing: {
      id: `published-homepage-${getBriefingDateKey(briefingDate)}`,
      briefingDate,
      title: "Daily Executive Briefing",
      intro:
        "The homepage renders from the published live signal set instead of triggering feed ingestion during SSR.",
      readingWindow: `${items.reduce((sum, item) => sum + item.estimatedMinutes, 0)} minutes`,
      items,
    },
    topics: demoTopics,
    sources,
    publicRankedItems: items,
    homepageDiagnostics: buildHomepageDiagnostics(sources, items.length),
  };
}

async function loadUserTopics(supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>, userId: string) {
  const result = await supabase
    .from("topics")
    .select("id, user_id, name, description, color, keywords, exclude_keywords, created_at")
    .eq("user_id", userId)
    .order("name");

  if (result.error) {
    logServerEvent("warn", "Homepage topic query failed", {
      route: "/",
      userId,
      errorMessage: result.error.message,
    });
    return [] as Topic[];
  }

  return ((result.data ?? []) as unknown as TopicRow[]).map((topic) => ({
    id: topic.id,
    userId: topic.user_id,
    name: topic.name,
    description: topic.description,
    color: topic.color,
    keywords: topic.keywords ?? [],
    excludeKeywords: topic.exclude_keywords ?? [],
    createdAt: topic.created_at,
  }));
}

async function loadUserSources(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  userId: string,
) {
  const result = await supabase
    .from("sources")
    .select("id, user_id, name, feed_url, homepage_url, topic_id, status, created_at, topics(name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (result.error) {
    logServerEvent("warn", "Homepage source query failed", {
      route: "/",
      userId,
      errorMessage: result.error.message,
    });
    return [] as Source[];
  }

  return ((result.data ?? []) as unknown as SourceRow[]).map((source) => ({
    id: source.id,
    userId: source.user_id,
    name: source.name,
    feedUrl: source.feed_url,
    homepageUrl: source.homepage_url ?? undefined,
    topicId: source.topic_id ?? undefined,
    topicName: Array.isArray(source.topics) ? source.topics[0]?.name ?? undefined : undefined,
    status: source.status,
    createdAt: source.created_at,
  }));
}

async function loadStoredBriefings(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  userId: string,
  limit: number,
  route: string,
) {
  const result = await supabase
    .from("daily_briefings")
    .select(BRIEFING_SELECT)
    .eq("user_id", userId)
    .order("briefing_date", { ascending: false })
    .limit(limit);

  if (result.error) {
    logServerEvent("warn", "Stored briefing query failed", {
      route,
      userId,
      errorMessage: result.error.message,
    });
    return [] as DailyBriefing[];
  }

  return ((result.data ?? []) as unknown as StoredBriefingRow[]).map(mapStoredBriefing);
}

async function buildSignedInHomepageData(authState: RequestAuthState): Promise<DashboardData> {
  if (!authState.supabase || !authState.user) {
    return buildPublicHomepageData();
  }

  const [topics, sources, briefings] = await Promise.all([
    loadUserTopics(authState.supabase, authState.user.id),
    loadUserSources(authState.supabase, authState.user.id),
    loadStoredBriefings(authState.supabase, authState.user.id, 1, authState.route),
  ]);
  const latestBriefing = briefings[0];

  if (!latestBriefing) {
    const publicData = await buildPublicHomepageData();
    return {
      ...publicData,
      mode: "live",
      topics,
      sources,
      homepageDiagnostics: buildHomepageDiagnostics(sources, publicData.briefing.items.length),
    };
  }

  return {
    mode: "live",
    briefing: latestBriefing,
    topics,
    sources,
    publicRankedItems: latestBriefing.items,
    homepageDiagnostics: buildHomepageDiagnostics(sources, latestBriefing.items.length),
  };
}

export async function getHomepagePageState(route = "/"): Promise<{
  data: DashboardData;
  viewer: ViewerAccount | null;
}> {
  const authState = await getRequestAuthState(route);
  const data = authState.user
    ? await buildSignedInHomepageData(authState)
    : await buildPublicHomepageData();

  return {
    data,
    viewer: authState.viewer,
  };
}

export async function getHistoryPageState(route = "/history") {
  const authState = await getRequestAuthState(route);

  if (!authState.supabase || !authState.user) {
    return {
      history: [] as DailyBriefing[],
      viewer: authState.viewer,
    };
  }

  return {
    history: await loadStoredBriefings(authState.supabase, authState.user.id, 14, route),
    viewer: authState.viewer,
  };
}

export async function getBriefingDetailPageState(dateKey: string, route = `/briefing/${dateKey}`): Promise<{
  data: DashboardData;
  briefing: DailyBriefing | null;
  viewer: ViewerAccount | null;
}> {
  const authState = await getRequestAuthState(route);
  const data = authState.user
    ? await buildSignedInHomepageData(authState)
    : await buildPublicHomepageData();

  if (authState.supabase && authState.user) {
    const history = await loadStoredBriefings(authState.supabase, authState.user.id, 14, route);
    const briefing =
      history.find((candidate) => getBriefingDateKey(candidate.briefingDate) === dateKey) ?? null;

    return {
      data: briefing ? { ...data, briefing } : data,
      briefing,
      viewer: authState.viewer,
    };
  }

  const currentBriefing =
    getBriefingDateKey(data.briefing.briefingDate) === dateKey ? data.briefing : null;

  return {
    data: currentBriefing ? { ...data, briefing: currentBriefing } : data,
    briefing: currentBriefing,
    viewer: authState.viewer,
  };
}
