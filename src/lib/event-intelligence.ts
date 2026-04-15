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

const ENTITY_STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "by",
  "for",
  "from",
  "in",
  "into",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
  "just",
  "new",
  "latest",
  "update",
  "report",
  "reports",
  "says",
  "show",
  "shows",
  "after",
  "ahead",
  "amid",
]);

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
  const recencyLabel = getRecencyLabel(item.publishedAt, item.displayState);
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

function getRecencyLabel(
  publishedAt: string | undefined,
  displayState: BriefingItem["displayState"],
) {
  if (!publishedAt) {
    if (displayState === "new") return "new this cycle";
    if (displayState === "changed") return "updated this cycle";
    if (displayState === "escalated") return "escalating this cycle";
    return "current briefing cycle";
  }

  const ageHours = Math.max(
    0,
    (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60),
  );

  if (ageHours < 1) {
    return "last hour";
  }

  if (ageHours < 24) {
    const roundedHours = Math.max(1, Math.round(ageHours));
    return roundedHours === 1 ? "last hour" : `last ${roundedHours} hours`;
  }

  const ageDays = Math.max(1, Math.round(ageHours / 24));
  return ageDays === 1 ? "last day" : `last ${ageDays} days`;
}

function extractKeyEntities(
  item: Pick<BriefingItem, "title" | "topicName" | "matchedKeywords">,
) {
  const entities = [
    ...(item.matchedKeywords ?? []).map(formatKeywordEntity),
    ...extractTitleEntities(item.title),
    item.topicName,
  ]
    .map((value) => cleanEntity(value))
    .filter(Boolean);

  return entities.filter((value, index) => {
    const normalized = value.toLowerCase();
    return entities.findIndex((candidate) => candidate.toLowerCase() === normalized) === index;
  });
}

function extractTitleEntities(title: string) {
  const normalizedTitle = title.replace(/[|:]/g, " ").replace(/\s+/g, " ").trim();
  const words = normalizedTitle.split(" ").filter(Boolean);
  const titleCaseRatio =
    words.length > 0
      ? words.filter((word) => /^[A-Z][a-z]/.test(word)).length / words.length
      : 0;

  if (titleCaseRatio > 0.75) {
    return [];
  }

  const matches = normalizedTitle.match(/\b(?:[A-Z][a-z0-9]+|[A-Z]{2,}|AI|TV)(?:\s+(?:[A-Z][a-z0-9]+|[A-Z]{2,}|AI|TV)){0,3}\b/g) ?? [];
  return matches
    .map((value) => value.trim())
    .filter((value) => isCredibleEntity(value));
}

function formatKeywordEntity(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^[A-Z0-9]{2,}$/.test(trimmed)) return trimmed;
  return trimmed
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function cleanEntity(value: string) {
  return value.replace(/[.,;:!?]+$/g, "").replace(/\s+/g, " ").trim();
}

function isCredibleEntity(value: string) {
  const parts = value.split(/\s+/).filter(Boolean);
  if (!parts.length || parts.length > 4) return false;
  if (parts.every((part) => ENTITY_STOPWORDS.has(part.toLowerCase()))) return false;
  if (value.length < 3 || value.length > 28) return false;
  return parts.every((part) => {
    const normalized = part.toLowerCase();
    return !ENTITY_STOPWORDS.has(normalized) || /^[A-Z]{2,}$/.test(part);
  });
}
