import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BestAccessibleReads } from "@/components/home/BestAccessibleReads";
import type { HomepageEvent } from "@/lib/homepage-model";

function createEvent(overrides: Partial<HomepageEvent> = {}): HomepageEvent {
  return {
    id: overrides.id ?? "event-1",
    topicName: overrides.topicName ?? "Tech",
    title: overrides.title ?? "Open AI infrastructure read",
    whatHappened: overrides.whatHappened ?? "Operators are expanding access to compute capacity.",
    keyPoints: overrides.keyPoints ?? ["Point one", "Point two", "Point three"],
    summary: overrides.summary ?? "Operators are expanding access to compute capacity.",
    trustLayer: overrides.trustLayer ?? {
      sourceLabel: "2 sources",
      sourceTone: "supported",
      confidenceLabel: "High confidence",
      confidenceTone: "supported",
      recencyLabel: "Fresh",
      impactLabel: "High impact",
      impactTone: "supported",
      corroborationLabel: "Multi-source",
      corroborationTone: "supported",
      sourceNames: ["The Verge", "Ars Technica"],
      explanationMode: "deterministic",
      unknowns: [],
      debugLines: [],
    },
    whyItMatters: overrides.whyItMatters ?? "This changes infrastructure planning.",
    whyThisIsHere: overrides.whyThisIsHere ?? "Open-access source with strong relevance.",
    relatedArticles:
      overrides.relatedArticles ?? [
        { title: "Source story", url: "https://www.theverge.com/example", sourceName: "The Verge" },
      ],
    timeline: overrides.timeline ?? [],
    estimatedMinutes: overrides.estimatedMinutes ?? 4,
    importanceLabel: overrides.importanceLabel ?? "High",
    rankingSignals: overrides.rankingSignals ?? ["Fresh reporting"],
    rankingDisplaySignals: overrides.rankingDisplaySignals ?? ["Fresh reporting"],
    matchedKeywords: overrides.matchedKeywords ?? ["ai"],
    priority: overrides.priority ?? "normal",
    publishedAt: overrides.publishedAt ?? "2026-04-15T08:00:00.000Z",
    access_type: overrides.access_type ?? "open",
    signalRole: overrides.signalRole ?? "context",
    rankScore: overrides.rankScore ?? 90,
    sourceCount: overrides.sourceCount ?? 2,
    classification:
      overrides.classification ?? {
        primaryCategory: "tech",
        secondaryCategories: [],
        confidence: 0.8,
        scores: { tech: 10, finance: 0, politics: 0 },
        matchedSignals: { tech: ["fixture"], finance: [], politics: [] },
      },
    eventIntelligence: overrides.eventIntelligence,
    intelligence: overrides.intelligence ?? {
      sourceLabel: "2 sources",
      confidenceLabel: "High confidence",
      confidenceTone: "supported",
      corroborationLabel: "Multi-source",
      corroborationTone: "supported",
      impactLabel: "High impact",
      impactTone: "supported",
      recencyLabel: "Fresh",
      isEarlySignal: false,
      sourceCount: 2,
      sourceDiversity: 2,
      confidenceScore: 0.8,
      recencyScore: 0.8,
      velocityScore: 0.5,
      rankingReason: "Fresh reporting",
      keyEntities: ["AI"],
    },
    personalization: overrides.personalization ?? {
      matchedTopicIds: [],
      matchedSourceIds: [],
      matchedEntityNames: [],
      score: 0,
      explanation: "No personalization boost.",
    },
    semanticFingerprint: overrides.semanticFingerprint ?? "tech:open:read",
  };
}

describe("BestAccessibleReads", () => {
  it("renders a section heading when events are provided", () => {
    render(<BestAccessibleReads events={[createEvent()]} />);

    expect(screen.getByRole("heading", { name: "Best Accessible Reads" })).toBeInTheDocument();
    expect(screen.getByText("Open-access stories worth your time.")).toBeInTheDocument();
  });

  it("renders one card per event", () => {
    render(
      <BestAccessibleReads
        events={[
          createEvent({ id: "event-1", title: "First accessible read" }),
          createEvent({ id: "event-2", title: "Second accessible read" }),
        ]}
      />,
    );

    expect(screen.getByText("First accessible read")).toBeInTheDocument();
    expect(screen.getByText("Second accessible read")).toBeInTheDocument();
  });

  it("returns null when events is empty", () => {
    const { container } = render(<BestAccessibleReads events={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
