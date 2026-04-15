import type { DashboardData, BriefingItem } from "@/lib/types";
import {
  classifyHomepageCategory,
  countSourcesByHomepageCategory,
  getHomepageCategoryDescription,
  getHomepageCategoryLabel,
  HOMEPAGE_CATEGORY_CONFIG,
  type HomepageCategoryClassification,
  type HomepageCategoryKey,
} from "@/lib/homepage-taxonomy";
import {
  buildEventIntelligenceSignals,
  TOP_EVENT_SOURCE_THRESHOLD,
  type EventIntelligenceSignals,
} from "@/lib/event-intelligence";
import { firstSentence } from "@/lib/utils";

export type EventArticle = {
  title: string;
  url: string;
  sourceName: string;
  note?: string;
};

export type EventTimelineMilestone = {
  label: string;
  detail: string;
};

export type HomepageEvent = {
  id: string;
  topicName: string;
  title: string;
  summary: string;
  whyItMatters: string;
  whyThisIsHere: string;
  relatedArticles: EventArticle[];
  timeline: EventTimelineMilestone[];
  estimatedMinutes: number;
  importanceLabel?: BriefingItem["importanceLabel"];
  rankingSignals: string[];
  matchedKeywords: string[];
  priority: BriefingItem["priority"];
  rankScore: number;
  sourceCount: number;
  classification: HomepageCategoryClassification;
  intelligence: EventIntelligenceSignals;
};

export type HomepageCategorySection = {
  key: HomepageCategoryKey;
  label: string;
  description: string;
  events: HomepageEvent[];
  fallbackEvents: HomepageEvent[];
  placeholderCount: number;
  state: "populated" | "sparse" | "empty";
  emptyReason: string;
  excludedReasons: string[];
};

export type HomepageDebugModel = {
  totalArticlesFetched: number | null;
  totalCandidateEvents: number | null;
  rankedEventsCount: number;
  uncategorizedEventsCount: number;
  categoryCounts: Record<HomepageCategoryKey, number>;
  sourceCountsByCategory: Record<HomepageCategoryKey, number>;
  lastSuccessfulFetchTime?: string;
  lastRankingRunTime?: string;
  categoryEmptyReasons: Record<HomepageCategoryKey, string>;
  categoryExclusionReasons: Record<HomepageCategoryKey, string[]>;
};

export type HomepageViewModel = {
  featured: HomepageEvent | null;
  topRanked: HomepageEvent[];
  categorySections: HomepageCategorySection[];
  trending: HomepageEvent[];
  earlySignals: HomepageEvent[];
  debug: HomepageDebugModel;
};

const TOP_EVENTS_LIMIT = 4;
const CATEGORY_EVENT_LIMIT = 2;
const TRENDING_EVENT_LIMIT = 3;
const EARLY_SIGNAL_LIMIT = 3;

export function buildHomepageViewModel(data: DashboardData): HomepageViewModel {
  const events = buildHomepageEvents(data.briefing.items);
  const confirmedEvents = events.filter((event) => !event.intelligence.isEarlySignal);
  const earlySignals = events.filter((event) => event.intelligence.isEarlySignal);
  const featured = confirmedEvents[0] ?? events[0] ?? null;
  const topRanked = confirmedEvents.slice(0, TOP_EVENTS_LIMIT);

  const categorySections = HOMEPAGE_CATEGORY_CONFIG.map((category) => {
    const eligibleEvents = events.filter((event) => event.classification.primaryCategory === category.key);
    const displayEvents = eligibleEvents.slice(0, CATEGORY_EVENT_LIMIT);
    const heldBackEvents = eligibleEvents.slice(CATEGORY_EVENT_LIMIT);
    const fallbackEvents =
      displayEvents.length === 0
        ? confirmedEvents
            .filter((event) => event.classification.primaryCategory !== category.key)
            .slice(0, 2)
        : [];

    const placeholderCount =
      displayEvents.length > 0 ? Math.max(0, CATEGORY_EVENT_LIMIT - displayEvents.length) : 0;

    const excludedReasons = [
      ...events
        .filter((event) => event.classification.primaryCategory !== category.key)
        .map((event) => getExclusionReason(event, category.key)),
      ...heldBackEvents.map(
        () =>
          `Held back because ${getHomepageCategoryLabel(category.key)} is capped at ${CATEGORY_EVENT_LIMIT} event cards.`,
      ),
    ];

    return {
      key: category.key,
      label: category.label,
      description: getHomepageCategoryDescription(category.key),
      events: displayEvents,
      fallbackEvents,
      placeholderCount,
      state:
        displayEvents.length >= CATEGORY_EVENT_LIMIT
          ? "populated"
          : displayEvents.length > 0
            ? "sparse"
            : "empty",
      emptyReason: getEmptyReason(category.key, eligibleEvents.length, fallbackEvents.length),
      excludedReasons: dedupeStrings(excludedReasons).slice(0, 6),
    } satisfies HomepageCategorySection;
  });

  const reservedIds = new Set(topRanked.map((event) => event.id));
  const trending = confirmedEvents
    .filter((event) => !reservedIds.has(event.id))
    .slice(0, TRENDING_EVENT_LIMIT);
  const sourceCountsByCategory =
    data.homepageDiagnostics?.sourceCountsByCategory ?? countSourcesByHomepageCategory(data.sources);

  return {
    featured,
    topRanked,
    categorySections,
    trending,
    earlySignals: earlySignals.slice(0, EARLY_SIGNAL_LIMIT),
    debug: {
      totalArticlesFetched: data.homepageDiagnostics?.totalArticlesFetched ?? null,
      totalCandidateEvents: data.homepageDiagnostics?.totalCandidateEvents ?? null,
      rankedEventsCount: events.length,
      uncategorizedEventsCount: events.filter((event) => !event.classification.primaryCategory).length,
      categoryCounts: {
        tech: events.filter((event) => event.classification.primaryCategory === "tech").length,
        finance: events.filter((event) => event.classification.primaryCategory === "finance").length,
        politics: events.filter((event) => event.classification.primaryCategory === "politics").length,
      },
      sourceCountsByCategory,
      lastSuccessfulFetchTime: data.homepageDiagnostics?.lastSuccessfulFetchTime,
      lastRankingRunTime: data.homepageDiagnostics?.lastRankingRunTime ?? data.briefing.briefingDate,
      categoryEmptyReasons: Object.fromEntries(
        categorySections.map((section) => [section.key, section.emptyReason]),
      ) as Record<HomepageCategoryKey, string>,
      categoryExclusionReasons: Object.fromEntries(
        categorySections.map((section) => [section.key, section.excludedReasons]),
      ) as Record<HomepageCategoryKey, string[]>,
    },
  };
}

export function buildHomepageEvents(items: BriefingItem[]) {
  return items
    .slice()
    .sort((left, right) => getRankScore(right) - getRankScore(left))
    .map((item, index, sortedItems) => {
      const intelligence = buildEventIntelligenceSignals(item);
      const classification = classifyHomepageCategory({
        topicName: item.topicName,
        title: item.title,
        summary: item.whatHappened,
        whyItMatters: item.whyItMatters,
        matchedKeywords: item.matchedKeywords,
        rankingSignals: item.rankingSignals,
        sourceNames: item.sources.map((source) => source.title),
      });
      const siblingItems = sortedItems.filter(
        (candidate) => candidate.id !== item.id && candidate.topicId === item.topicId,
      );

      return {
        id: item.id,
        topicName: item.topicName,
        title: item.title,
        summary: summarize(item.whatHappened, 2),
        whyItMatters: sanitizeWhyItMatters(item.whyItMatters, item.title),
        whyThisIsHere: buildWhyThisIsHere(item, classification, intelligence),
        relatedArticles: buildHomepageRelatedArticles(item),
        timeline: buildEventTimeline(item, siblingItems),
        estimatedMinutes: item.estimatedMinutes,
        importanceLabel: item.importanceLabel,
        rankingSignals: item.rankingSignals ?? [],
        matchedKeywords: item.matchedKeywords ?? [],
        priority: item.priority,
        rankScore: getRankScore(item) - index * 0.01,
        sourceCount: intelligence.sourceCount,
        classification,
        intelligence,
      } satisfies HomepageEvent;
    });
}

function buildHomepageRelatedArticles(item: BriefingItem) {
  const candidates =
    (item.relatedArticles?.length ? item.relatedArticles : undefined) ??
    item.sources.map((source) => ({
      title: source.title,
      url: source.url,
      sourceName: source.title,
    }));

  const seenSources = new Set<string>();
  const seenTitles = new Set<string>();

  return candidates
    .filter((article) => isValidStoryUrl(article.url))
    .filter((article) => {
      const normalizedTitle = article.title.trim().toLowerCase();
      if (!normalizedTitle || seenTitles.has(normalizedTitle)) {
        return false;
      }
      seenTitles.add(normalizedTitle);
      return true;
    })
    .filter((article) => {
      const normalizedSource = article.sourceName.trim().toLowerCase();
      if (!normalizedSource || seenSources.has(normalizedSource)) {
        return false;
      }
      seenSources.add(normalizedSource);
      return true;
    })
    .slice(0, 4)
    .map((article, index) => ({
      title: article.title,
      url: article.url,
      sourceName: article.sourceName,
      note: index === 0 ? "Lead coverage" : "Corroborating coverage",
    }));
}

function buildEventTimeline(item: BriefingItem, siblingItems: BriefingItem[]) {
  const keywordMilestone = item.matchedKeywords?.length
    ? {
        label: "Trigger",
        detail: `This event surfaced through signals like ${item.matchedKeywords.slice(0, 3).join(", ")}.`,
      }
    : null;

  const keyPointMilestones = item.keyPoints
    .filter((point) => !point.startsWith("Matched on:"))
    .map((point, index) => ({
      label: index === 0 ? "Earlier" : index === 1 ? "Shift" : "Now",
      detail: point,
    }));

  const siblingMilestones = siblingItems.slice(0, 2).map((sibling, index) => ({
    label: index === 0 ? "Build-up" : "Follow-on",
    detail: summarize(sibling.whatHappened, 1),
  }));

  return [keywordMilestone, ...keyPointMilestones, ...siblingMilestones]
    .filter((milestone): milestone is EventTimelineMilestone => Boolean(milestone))
    .slice(0, 3);
}

function buildWhyThisIsHere(
  item: BriefingItem,
  classification: HomepageCategoryClassification,
  intelligence: EventIntelligenceSignals,
) {
  const primaryCategory = classification.primaryCategory
    ? getHomepageCategoryLabel(classification.primaryCategory)
    : "General";
  const leadingSignal = item.matchedKeywords?.[0];
  const signalContext = leadingSignal ? `triggered by \"${leadingSignal}\"` : "matched your tracked topics";

  if (intelligence.isEarlySignal) {
    return `${primaryCategory} ${signalContext}, but only ${intelligence.sourceCount} source has picked it up so far. It stays visible as an early signal rather than a top-ranked event until more coverage confirms the cluster.`;
  }

  return `${primaryCategory} ${signalContext} and ranked because ${intelligence.rankingReason.toLowerCase()} with ${intelligence.confidenceLabel.toLowerCase()}.`;
}

function sanitizeWhyItMatters(value: string, title: string) {
  const trimmed = summarize(value, 1).replace(/\s+/g, " ").trim();
  if (!trimmed) {
    return `This development is worth watching because it can change assumptions around ${title.toLowerCase()}.`;
  }

  return trimmed
    .replace(/connect an ai key in settings to get analyst-quality analysis instead of this heuristic summary\.?/gi, "")
    .replace(/operators tracking this area should note it:\s*/i, "")
    .trim();
}

function getEmptyReason(categoryKey: HomepageCategoryKey, eligibleCount: number, fallbackCount: number) {
  const label = getHomepageCategoryLabel(categoryKey);

  if (eligibleCount > 0) {
    return `${label} has ${eligibleCount} eligible event${eligibleCount === 1 ? "" : "s"}, so placeholders keep the section calm while more clustered coverage builds.`;
  }

  if (fallbackCount > 0) {
    return `No ${label.toLowerCase()} events qualified yet, so the section borrows other confirmed multi-source events instead of falling back to loose article cards.`;
  }

  return `No eligible ${label.toLowerCase()} events qualified in the current ranked briefing.`;
}

function getExclusionReason(event: HomepageEvent, categoryKey: HomepageCategoryKey) {
  if (!event.classification.primaryCategory) {
    return `\"${event.title}\" stayed out because it never cleared the category confidence threshold.`;
  }

  if (event.classification.primaryCategory === categoryKey) {
    return `\"${event.title}\" is eligible for ${getHomepageCategoryLabel(categoryKey)}.`;
  }

  return `\"${event.title}\" was classified as ${getHomepageCategoryLabel(event.classification.primaryCategory)}, not ${getHomepageCategoryLabel(categoryKey)}.`;
}

function getRankScore(item: BriefingItem) {
  return (item.importanceScore ?? 0) + (item.matchScore ?? 0) + (item.priority === "top" ? 100 : 0);
}

function summarize(value: string, maxSentences: number) {
  const sentences = value
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  return sentences.slice(0, maxSentences).join(" ") || value;
}

function isValidStoryUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function dedupeStrings(values: string[]) {
  return values.filter((value, index) => values.indexOf(value) === index);
}

export function buildOverallNoDataMessage(itemCount: number) {
  if (itemCount > 0) {
    return {
      title: "Coverage is loading normally",
      body: `Ranked events are available below once they clear the ${TOP_EVENT_SOURCE_THRESHOLD}-source confirmation threshold.`,
    };
  }

  return {
    title: "Coverage unavailable right now",
    body: "We could not build ranked events from the latest coverage yet. Refresh shortly to try again.",
  };
}

export function buildEventFallbackSummary(item: BriefingItem) {
  return firstSentence(item.whatHappened, item.title);
}
