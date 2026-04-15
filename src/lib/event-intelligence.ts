import type { BriefingItem } from "@/lib/types";

export const TOP_EVENT_SOURCE_THRESHOLD = 2;

export type EventTimelineIndicator = "New" | "Updated" | "Escalating";
export type EventConfidenceLabel = "High confidence" | "Medium confidence" | "Developing";

export type EventIntelligenceSignals = {
  sourceCount: number;
  isEarlySignal: boolean;
  timelineIndicator: EventTimelineIndicator;
  confidenceLabel: EventConfidenceLabel;
  confidenceTone: "high" | "medium" | "developing";
  keyEntities: string[];
  impactLabel: string;
  recencyLabel: string;
  sourceLabel: string;
  rankingReason: string;
};

export function buildEventIntelligenceSignals(
  item: Pick<
    BriefingItem,
    | "title"
    | "topicName"
    | "publishedAt"
    | "matchedKeywords"
    | "importanceLabel"
    | "importanceScore"
    | "sourceCount"
    | "sources"
    | "displayState"
  >,
): EventIntelligenceSignals {
  const sourceCount = item.sourceCount ?? item.sources.length;
  const isEarlySignal = sourceCount < TOP_EVENT_SOURCE_THRESHOLD;

  const timelineIndicator = getTimelineIndicator(item);
  const confidenceTone =
    sourceCount >= 4 || (item.importanceScore ?? 0) >= 85
      ? "high"
      : sourceCount >= TOP_EVENT_SOURCE_THRESHOLD
        ? "medium"
        : "developing";
  const confidenceLabel =
    confidenceTone === "high"
      ? "High confidence"
      : confidenceTone === "medium"
        ? "Medium confidence"
        : "Developing";

  const impactLabel = getImpactLabel(item.importanceLabel, item.importanceScore ?? 0);
  const recencyLabel = getRecencyLabel(item.publishedAt);
  const sourceLabel = `${sourceCount} ${sourceCount === 1 ? "source" : "sources"}`;

  return {
    sourceCount,
    isEarlySignal,
    timelineIndicator,
    confidenceLabel,
    confidenceTone,
    keyEntities: extractKeyEntities(item).slice(0, 4),
    impactLabel,
    recencyLabel,
    sourceLabel,
    rankingReason: `${impactLabel} • ${sourceLabel} • ${recencyLabel}`,
  };
}

export function isTopEventEligible(item: Pick<BriefingItem, "sourceCount" | "sources">) {
  const sourceCount = item.sourceCount ?? item.sources.length;
  return sourceCount >= TOP_EVENT_SOURCE_THRESHOLD;
}

function getTimelineIndicator(
  item: Pick<BriefingItem, "displayState" | "publishedAt">,
): EventTimelineIndicator {
  if (item.displayState === "escalated") return "Escalating";
  if (item.displayState === "changed") return "Updated";
  if (item.displayState === "new") return "New";

  const publishedAt = item.publishedAt ? new Date(item.publishedAt).getTime() : 0;
  const ageHours = publishedAt
    ? (Date.now() - publishedAt) / (1000 * 60 * 60)
    : Number.POSITIVE_INFINITY;

  if (ageHours <= 12) return "New";
  return "Updated";
}

function getImpactLabel(
  importanceLabel: BriefingItem["importanceLabel"],
  importanceScore: number,
) {
  if (importanceLabel === "Critical" || importanceScore >= 80) return "High impact";
  if (importanceLabel === "High" || importanceScore >= 65) return "Meaningful impact";
  return "Watch impact";
}

function getRecencyLabel(publishedAt?: string) {
  if (!publishedAt) return "timing unclear";

  const ageHours = Math.max(
    0,
    (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60),
  );

  if (ageHours < 1) {
    return "last hour";
  }

  if (ageHours < 24) {
    return `last ${Math.round(ageHours)} hours`;
  }

  const ageDays = Math.round(ageHours / 24);
  return ageDays <= 1 ? "last day" : `last ${ageDays} days`;
}

function extractKeyEntities(
  item: Pick<BriefingItem, "title" | "topicName" | "matchedKeywords">,
) {
  const entities = [
    ...(item.matchedKeywords ?? []),
    ...extractTitleEntities(item.title),
    item.topicName,
  ]
    .map((value) => value.trim())
    .filter(Boolean);

  return entities.filter((value, index) => {
    const normalized = value.toLowerCase();
    return entities.findIndex((candidate) => candidate.toLowerCase() === normalized) === index;
  });
}

function extractTitleEntities(title: string) {
  const matches =
    title.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}|[A-Z]{2,}(?:\s+[A-Z]{2,})*)\b/g) ?? [];
  return matches.filter((value) => value.length > 2);
}
