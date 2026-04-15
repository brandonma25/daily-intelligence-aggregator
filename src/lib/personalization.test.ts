import { describe, expect, it } from "vitest";

import {
  buildPersonalizationMatch,
  compareBriefingItemsByPersonalization,
  createDefaultPersonalizationProfile,
} from "@/lib/personalization";
import type { BriefingItem } from "@/lib/types";

function createItem(overrides: Partial<BriefingItem>): BriefingItem {
  return {
    id: overrides.id ?? "item-1",
    topicId: overrides.topicId ?? "topic-1",
    topicName: overrides.topicName ?? "General",
    title: overrides.title ?? "Generic event",
    whatHappened: overrides.whatHappened ?? "A development happened.",
    keyPoints: overrides.keyPoints ?? ["Point one", "Point two", "Point three"],
    whyItMatters: overrides.whyItMatters ?? "It matters because expectations changed.",
    sources:
      overrides.sources ?? [
        { title: "Reuters", url: "https://www.reuters.com/example" },
        { title: "AP", url: "https://apnews.com/example" },
      ],
    estimatedMinutes: overrides.estimatedMinutes ?? 4,
    read: overrides.read ?? false,
    priority: overrides.priority ?? "top",
    matchedKeywords: overrides.matchedKeywords ?? [],
    matchScore: overrides.matchScore ?? 8,
    publishedAt: overrides.publishedAt ?? "2026-04-15T08:00:00.000Z",
    sourceCount: overrides.sourceCount ?? 2,
    relatedArticles: overrides.relatedArticles,
    importanceScore: overrides.importanceScore ?? 82,
    importanceLabel: overrides.importanceLabel ?? "High",
    rankingSignals: overrides.rankingSignals ?? ["Fresh reporting in the current cycle."],
    eventIntelligence:
      overrides.eventIntelligence ?? {
        id: `intel-${overrides.id ?? "item-1"}`,
        title: overrides.title ?? "Generic event",
        summary: overrides.whatHappened ?? "A development happened.",
        primaryChange: overrides.title ?? "Generic event",
        keyEntities: ["Nvidia"],
        topics: ["tech"],
        signals: {
          articleCount: overrides.sourceCount ?? 2,
          sourceDiversity: overrides.sourceCount ?? 2,
          recencyScore: 75,
          velocityScore: 62,
        },
        rankingScore: overrides.importanceScore ?? 82,
        rankingReason: "High impact • 2 sources • last 6 hours",
        confidenceScore: 76,
        isHighSignal: true,
        createdAt: overrides.publishedAt ?? "2026-04-15T08:00:00.000Z",
      },
  };
}

describe("personalization weighting", () => {
  it("moves a followed-topic confirmed event above a nearby non-followed event", () => {
    const profile = {
      ...createDefaultPersonalizationProfile("reader@example.com"),
      followedTopicIds: ["tech"],
      followedTopicNames: ["Tech"],
    };
    const finance = createItem({
      id: "finance",
      topicId: "finance",
      topicName: "Finance",
      title: "Finance event",
      importanceScore: 81,
      eventIntelligence: {
        id: "intel-finance",
        title: "Finance event",
        summary: "Finance event",
        primaryChange: "Finance event",
        keyEntities: ["Federal Reserve"],
        topics: ["finance"],
        signals: { articleCount: 4, sourceDiversity: 4, recencyScore: 70, velocityScore: 55 },
        rankingScore: 81,
        rankingReason: "Meaningful impact • 4 sources • last 6 hours",
        confidenceScore: 74,
        isHighSignal: true,
        createdAt: "2026-04-15T08:00:00.000Z",
      },
    });
    const tech = createItem({
      id: "tech",
      topicId: "tech",
      topicName: "Tech",
      title: "Tech event",
      importanceScore: 74,
      matchedKeywords: ["nvidia", "ai"],
      eventIntelligence: {
        id: "intel-tech",
        title: "Tech event",
        summary: "Tech event",
        primaryChange: "Tech event",
        keyEntities: ["Nvidia"],
        topics: ["tech"],
        signals: { articleCount: 4, sourceDiversity: 3, recencyScore: 78, velocityScore: 70 },
        rankingScore: 74,
        rankingReason: "Meaningful impact • 3 sources • last 6 hours",
        confidenceScore: 73,
        isHighSignal: true,
        createdAt: "2026-04-15T08:00:00.000Z",
      },
    });

    expect(compareBriefingItemsByPersonalization(tech, finance, profile)).toBeLessThan(0);
  });

  it("caps the boost on single-source items so weak content stays weak", () => {
    const profile = {
      ...createDefaultPersonalizationProfile("reader@example.com"),
      followedTopicIds: ["tech"],
      followedTopicNames: ["Tech"],
      followedEntities: ["Nvidia"],
    };
    const early = createItem({
      id: "early",
      topicId: "tech",
      topicName: "Tech",
      title: "Single-source tech rumor",
      sourceCount: 1,
      sources: [{ title: "Reuters", url: "https://www.reuters.com/example" }],
      importanceScore: 45,
      importanceLabel: "Watch",
      eventIntelligence: {
        id: "intel-early",
        title: "Single-source tech rumor",
        summary: "A single source reported a rumor.",
        primaryChange: "Single-source tech rumor",
        keyEntities: ["Nvidia"],
        topics: ["tech"],
        signals: { articleCount: 1, sourceDiversity: 1, recencyScore: 70, velocityScore: 20 },
        rankingScore: 45,
        rankingReason: "Watch impact • 1 source • last 6 hours",
        confidenceScore: 35,
        isHighSignal: false,
        createdAt: "2026-04-15T08:00:00.000Z",
      },
    });

    const match = buildPersonalizationMatch(early, profile);

    expect(match.active).toBe(true);
    expect(match.bonus).toBeLessThanOrEqual(3);
  });
});
