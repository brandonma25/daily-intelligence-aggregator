import { compareBriefingItemsByRanking, getBriefingRankSnapshot } from "@/lib/ranking";
import type { BriefingItem, Topic } from "@/lib/types";

export const PERSONALIZATION_STORAGE_KEY = "daily-intel-preferences";
const PERSONALIZATION_EVENT = "daily-intel-preferences-updated";
const PERSONALIZATION_STORAGE_VERSION = 1;

export type BriefingPersonalizationProfile = {
  displayName: string;
  digestEnabled: boolean;
  landingPage: "/dashboard" | "/topics" | "/sources";
  readingDensity: "comfortable" | "compact";
  autoRefresh: boolean;
  personalizationEnabled: boolean;
  followedTopicIds: string[];
  followedTopicNames: string[];
  followedEntities: string[];
};

export type StoredPersonalizationState = {
  profile: BriefingPersonalizationProfile;
  savedAt: string | null;
  version: number;
};

export type PersonalizationTopicOption = {
  id: string;
  label: string;
};

export type PersonalizationMatch = {
  active: boolean;
  bonus: number;
  matchedTopics: string[];
  matchedEntities: string[];
  reason: string | null;
  shortReason: string | null;
};

export function createDefaultPersonalizationProfile(
  defaultEmail?: string,
): BriefingPersonalizationProfile {
  return {
    displayName: defaultEmail?.split("@")[0] ?? "",
    digestEnabled: true,
    landingPage: "/dashboard",
    readingDensity: "comfortable",
    autoRefresh: true,
    personalizationEnabled: true,
    followedTopicIds: [],
    followedTopicNames: [],
    followedEntities: [],
  };
}

export function readStoredPersonalizationState(
  storedPayload: string | null | undefined,
  defaultEmail?: string,
): StoredPersonalizationState {
  const defaults = createDefaultPersonalizationProfile(defaultEmail);
  if (!storedPayload) {
    return {
      profile: defaults,
      savedAt: null,
      version: PERSONALIZATION_STORAGE_VERSION,
    };
  }

  try {
    const parsed = JSON.parse(storedPayload) as
      | Partial<StoredPersonalizationState>
      | Partial<BriefingPersonalizationProfile>;

    const hasWrappedProfile = parsed && typeof parsed === "object" && "profile" in parsed;
    const rawProfile = hasWrappedProfile
      ? (parsed as Partial<StoredPersonalizationState>).profile
      : (parsed as Partial<BriefingPersonalizationProfile>);

    return {
      profile: {
        ...defaults,
        ...rawProfile,
        followedTopicIds: dedupeStrings(rawProfile?.followedTopicIds ?? []),
        followedTopicNames: dedupeStrings(rawProfile?.followedTopicNames ?? []),
        followedEntities: dedupeStrings(rawProfile?.followedEntities ?? []),
      },
      savedAt:
        hasWrappedProfile && typeof (parsed as Partial<StoredPersonalizationState>).savedAt === "string"
          ? (parsed as Partial<StoredPersonalizationState>).savedAt ?? null
          : null,
      version:
        hasWrappedProfile && typeof (parsed as Partial<StoredPersonalizationState>).version === "number"
          ? (parsed as Partial<StoredPersonalizationState>).version ?? PERSONALIZATION_STORAGE_VERSION
          : PERSONALIZATION_STORAGE_VERSION,
    };
  } catch {
    return {
      profile: defaults,
      savedAt: null,
      version: PERSONALIZATION_STORAGE_VERSION,
    };
  }
}

export function parsePersonalizationProfile(
  storedPayload: string | null | undefined,
  defaultEmail?: string,
): BriefingPersonalizationProfile {
  return readStoredPersonalizationState(storedPayload, defaultEmail).profile;
}

export function hasActivePersonalization(profile: BriefingPersonalizationProfile | null | undefined) {
  return Boolean(
    profile?.personalizationEnabled &&
      ((profile.followedTopicIds?.length ?? 0) > 0 ||
        (profile.followedTopicNames?.length ?? 0) > 0 ||
        (profile.followedEntities?.length ?? 0) > 0),
  );
}

export function getStoredPersonalizationPayload() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(PERSONALIZATION_STORAGE_KEY) ?? "";
}

export function subscribeToPersonalizationStore(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key && event.key !== PERSONALIZATION_STORAGE_KEY) {
      return;
    }

    onStoreChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(PERSONALIZATION_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(PERSONALIZATION_EVENT, onStoreChange);
  };
}

export function persistPersonalizationProfile(profile: BriefingPersonalizationProfile) {
  if (typeof window === "undefined") {
    return null;
  }

  const savedAt = new Date().toISOString();
  const payload: StoredPersonalizationState = {
    profile,
    savedAt,
    version: PERSONALIZATION_STORAGE_VERSION,
  };

  window.localStorage.setItem(PERSONALIZATION_STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new Event(PERSONALIZATION_EVENT));
  return payload;
}

export function formatSavedAtLabel(savedAt: string | null | undefined) {
  if (!savedAt) {
    return "Not saved on this browser yet.";
  }

  const date = new Date(savedAt);
  if (Number.isNaN(date.getTime())) {
    return "Saved on this browser.";
  }

  return `Saved on this browser at ${date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })}.`;
}

export function buildPersonalizationTopicOptions(
  topics: Pick<Topic, "id" | "name">[],
  items: Pick<BriefingItem, "topicId" | "topicName">[] = [],
) {
  const options = new Map<string, PersonalizationTopicOption>();

  topics.forEach((topic) => {
    options.set(topic.id, { id: topic.id, label: topic.name });
  });

  items.forEach((item) => {
    if (!options.has(item.topicId)) {
      options.set(item.topicId, { id: item.topicId, label: item.topicName });
    }
  });

  return [...options.values()].sort((left, right) => left.label.localeCompare(right.label));
}

export function buildSuggestedEntities(items: BriefingItem[], limit = 12) {
  const counts = new Map<string, number>();

  items.forEach((item) => {
    collectEntities(item).forEach((entity) => {
      counts.set(entity, (counts.get(entity) ?? 0) + 1);
    });
  });

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([entity]) => entity)
    .slice(0, limit);
}

export function buildPersonalizationMatch(
  item: BriefingItem,
  profile: BriefingPersonalizationProfile | null | undefined,
): PersonalizationMatch {
  if (!hasActivePersonalization(profile)) {
    return {
      active: false,
      bonus: 0,
      matchedTopics: [],
      matchedEntities: [],
      reason: null,
      shortReason: null,
    };
  }

  const trackedTopicIds = new Set((profile?.followedTopicIds ?? []).map(normalizeToken));
  const trackedTopicNames = new Set((profile?.followedTopicNames ?? []).map(normalizeToken));
  const trackedEntities = new Set((profile?.followedEntities ?? []).map(normalizeToken));
  const matchedTopics: string[] = [];

  if (
    trackedTopicIds.has(normalizeToken(item.topicId)) ||
    trackedTopicNames.has(normalizeToken(item.topicName))
  ) {
    matchedTopics.push(item.topicName);
  }

  const matchedEntities = collectEntities(item).filter((entity) =>
    trackedEntities.has(normalizeToken(entity)),
  );
  const snapshot = getBriefingRankSnapshot(item);
  const rawBonus = (matchedTopics.length ? 10 : 0) + Math.min(2, matchedEntities.length) * 4;
  const qualityFactor = snapshot.isHighSignal
    ? clamp((snapshot.rankingScore + snapshot.confidenceScore) / 180, 0.55, 1)
    : clamp(snapshot.rankingScore / 100, 0.15, 0.35);
  const maxBonus =
    snapshot.isHighSignal && snapshot.sourceDiversity >= 2
      ? 16
      : snapshot.sourceDiversity >= 2
        ? 6
        : 3;
  const bonus = Math.min(maxBonus, Math.round(rawBonus * qualityFactor));

  if (!matchedTopics.length && !matchedEntities.length) {
    return {
      active: false,
      bonus: 0,
      matchedTopics: [],
      matchedEntities: [],
      reason: null,
      shortReason: null,
    };
  }

  return {
    active: bonus > 0,
    bonus,
    matchedTopics: dedupeStrings(matchedTopics),
    matchedEntities: dedupeStrings(matchedEntities).slice(0, 2),
    reason: buildPersonalizationReason({
      matchedTopics,
      matchedEntities,
    }),
    shortReason: buildPersonalizationShortReason({
      matchedTopics,
      matchedEntities,
    }),
  };
}

export function compareBriefingItemsByPersonalization(
  left: BriefingItem,
  right: BriefingItem,
  profile: BriefingPersonalizationProfile | null | undefined,
) {
  const baselineOrder = compareBriefingItemsByRanking(left, right);
  if (baselineOrder !== 0) {
    return baselineOrder;
  }

  const leftSnapshot = getBriefingRankSnapshot(left);
  const rightSnapshot = getBriefingRankSnapshot(right);

  const leftScore = leftSnapshot.rankingScore + buildPersonalizationMatch(left, profile).bonus;
  const rightScore = rightSnapshot.rankingScore + buildPersonalizationMatch(right, profile).bonus;
  const scoreDelta = rightScore - leftScore;
  if (scoreDelta !== 0) {
    return scoreDelta;
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

export function sortBriefingItemsByPersonalization(
  items: BriefingItem[],
  profile: BriefingPersonalizationProfile | null | undefined,
) {
  if (!hasActivePersonalization(profile)) {
    return items.slice();
  }

  return items.slice().sort((left, right) => compareBriefingItemsByPersonalization(left, right, profile));
}

export function buildPersonalizationSummary(profile: BriefingPersonalizationProfile | null | undefined) {
  if (!hasActivePersonalization(profile)) {
    return null;
  }

  const topicCount = dedupeStrings([
    ...(profile?.followedTopicIds ?? []),
    ...(profile?.followedTopicNames ?? []),
  ]).length;
  const entityCount = dedupeStrings(profile?.followedEntities ?? []).length;
  const parts = [];

  if (topicCount) {
    parts.push(`${topicCount} ${topicCount === 1 ? "topic" : "topics"} tracked`);
  }
  if (entityCount) {
    parts.push(`${entityCount} ${entityCount === 1 ? "entity" : "entities"} followed`);
  }

  return parts.join(" • ");
}

function buildPersonalizationReason(input: {
  matchedTopics: string[];
  matchedEntities: string[];
}) {
  const topic = dedupeStrings(input.matchedTopics)[0];
  const entity = dedupeStrings(input.matchedEntities)[0];

  if (topic && entity) {
    return `Higher for you because you track ${topic} and follow ${entity}.`;
  }

  if (topic) {
    return `Higher for you because you track ${topic}.`;
  }

  if (entity) {
    return `Higher for you because you follow ${entity}.`;
  }

  return null;
}

function buildPersonalizationShortReason(input: {
  matchedTopics: string[];
  matchedEntities: string[];
}) {
  const topic = dedupeStrings(input.matchedTopics)[0];
  const entity = dedupeStrings(input.matchedEntities)[0];

  if (topic && entity) {
    return `${topic} + ${entity}`;
  }

  if (topic) {
    return topic;
  }

  if (entity) {
    return entity;
  }

  return null;
}

function collectEntities(item: BriefingItem) {
  return dedupeStrings([
    ...(item.eventIntelligence?.keyEntities ?? []),
    ...(item.matchedKeywords ?? []).map(formatLabel),
  ]).filter(Boolean);
}

function normalizeToken(value: string) {
  return value.trim().toLowerCase();
}

function formatLabel(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^[A-Z0-9]{2,}$/.test(trimmed)) return trimmed;

  return trimmed
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function dedupeStrings(values: string[]) {
  return values.filter((value, index) => {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return false;
    }

    return values.findIndex((candidate) => candidate.trim().toLowerCase() === normalized) === index;
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
