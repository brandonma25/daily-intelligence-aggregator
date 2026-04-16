import { describe, expect, it } from "vitest";

import {
  __testing__,
  generateWhyThisMatters,
  generateWhyThisMattersHeuristically,
} from "@/lib/why-it-matters";
import type { EventIntelligence } from "@/lib/types";

function createIntelligence(overrides: Partial<EventIntelligence> = {}): EventIntelligence {
  return {
    id: "evt-1",
    title: "Nvidia faces new U.S. chip export restrictions",
    summary: "New restrictions would limit advanced AI chip sales into China.",
    primaryChange: "Nvidia faces new U.S. chip export restrictions",
    entities: ["Nvidia", "United States", "China"],
    eventType: "geopolitics",
    primaryImpact: "Nvidia may face tighter market access and pricing pressure across semiconductors.",
    affectedMarkets: ["semiconductors", "technology"],
    timeHorizon: "long",
    signalStrength: "strong",
    keyEntities: ["Nvidia", "United States", "China"],
    topics: ["tech", "geopolitics"],
    signals: {
      articleCount: 3,
      sourceDiversity: 3,
      recencyScore: 90,
      velocityScore: 80,
    },
    rankingScore: 82,
    rankingReason: "Fresh multi-source reporting on Nvidia kept this event near the top of the briefing.",
    confidenceScore: 78,
    isHighSignal: true,
    createdAt: "2026-04-16T00:00:00.000Z",
    ...overrides,
  };
}

describe("why-it-matters", () => {
  it("builds a causal heuristic explanation with a signal label", async () => {
    const intelligence = createIntelligence();

    const text = await generateWhyThisMatters(intelligence);

    expect(text).toContain("Nvidia");
    expect(text).toContain("semiconductors");
    expect(text).toContain("(Signal: Strong)");
    expect(text.toLowerCase()).not.toContain("this is important because");
  });

  it("rephrases when the first draft is too similar to recent outputs", async () => {
    const intelligence = createIntelligence({
      eventType: "macro_market_move",
      entities: ["Federal Reserve"],
      primaryImpact: "The Federal Reserve changes the rate backdrop for equities.",
      affectedMarkets: ["rates", "equities"],
      timeHorizon: "medium",
      signalStrength: "strong",
    });
    const firstDraft = `${generateWhyThisMattersHeuristically(intelligence)} (Signal: Strong)`;

    const deduped = await generateWhyThisMatters(intelligence, {
      previousOutputs: [firstDraft],
    });

    expect(deduped).not.toBe(firstDraft);
    expect(deduped).toContain("(Signal: Strong)");
  });

  it("rejects malformed anchors and falls back to event-based phrasing", async () => {
    const intelligence = createIntelligence({
      title: "You're feeling the pinch at the gas pump. Wait until the electric bill comes.",
      entities: ["Wait", "Energy"],
      eventType: "macro_market_move",
      signalStrength: "weak",
      confidenceScore: 40,
      signals: {
        articleCount: 1,
        sourceDiversity: 1,
        recencyScore: 88,
        velocityScore: 20,
      },
    });

    const text = await generateWhyThisMatters(intelligence);

    expect(text).toContain("This is an early signal with limited confirmed impact.");
    expect(text.toLowerCase()).not.toContain("wait matters because wait");
  });

  it("keeps template reuse under control across a batch", async () => {
    const outputs = [];

    for (let index = 0; index < 3; index += 1) {
      outputs.push(
        await generateWhyThisMatters(
          createIntelligence({
            id: `evt-${index}`,
            title: `Fed move ${index}`,
            entities: ["Federal Reserve"],
            eventType: "macro_market_move",
            primaryImpact: "The Federal Reserve changes the rate backdrop for equities.",
          }),
          { previousOutputs: outputs },
        ),
      );
    }

    const patternKeys = outputs.map((output) => __testing__.getPatternKey(output));
    const firstPatternUsage = patternKeys.filter((key) => key === patternKeys[0]).length;

    expect(firstPatternUsage).toBeLessThanOrEqual(2);
  });

  it("extracts a meaningful primary anchor when available", () => {
    const anchor = __testing__.extractPrimaryAnchor(
      createIntelligence({
        title: "Google adds Nano Banana-powered image generation to Gemini",
        entities: ["Google", "Gemini"],
      }),
    );

    expect(anchor?.label).toBe("Google");
    expect(__testing__.isMeaningfulAnchor("Wait")).toBe(false);
  });
});
