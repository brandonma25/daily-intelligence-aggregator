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
    title: "InsightFinder raises $15M to help companies monitor AI agents",
    summary: "The startup raised funding to expand its AI reliability platform.",
    primaryChange: "InsightFinder raised $15M to expand its AI reliability platform",
    entities: ["InsightFinder"],
    eventType: "mna_funding",
    primaryImpact: "The funding could change competition in AI tooling and model governance.",
    affectedMarkets: ["ai tooling", "enterprise software"],
    timeHorizon: "medium",
    signalStrength: "moderate",
    keyEntities: ["InsightFinder"],
    topics: ["tech", "business"],
    signals: {
      articleCount: 1,
      sourceDiversity: 1,
      recencyScore: 86,
      velocityScore: 20,
    },
    rankingScore: 58,
    rankingReason: "Fresh funding coverage put the startup on the radar.",
    confidenceScore: 54,
    isHighSignal: true,
    createdAt: "2026-04-17T00:00:00.000Z",
    ...overrides,
  };
}

function firstClause(text: string) {
  return text.split(".")[0] ?? text;
}

describe("why-it-matters", () => {
  it("keeps subject anchoring in the opening clause for non-fallback funding stories", async () => {
    const text = await generateWhyThisMatters(createIntelligence());

    expect(firstClause(text)).toContain("InsightFinder");
    expect(text.toLowerCase()).not.toContain("this is an early signal with limited confirmed impact");
  });

  it("uses visibly different reasoning across funding, demand, governance, and macro stories", async () => {
    const funding = await generateWhyThisMatters(
      createIntelligence({
        id: "funding",
      }),
    );
    const demand = await generateWhyThisMatters(
      createIntelligence({
        id: "demand",
        title: "Adobe says AI-driven retail traffic surged in the first quarter",
        summary: "Adobe data showed sharp AI referral growth for U.S. retailers.",
        primaryChange: "Adobe reported a surge in AI-driven retail traffic",
        entities: ["Adobe"],
        eventType: "macro_market_move",
        primaryImpact: "The data could affect demand expectations across e-commerce and ad spending.",
        affectedMarkets: ["retail demand", "e-commerce"],
        topics: ["finance", "business"],
        signalStrength: "moderate",
        confidenceScore: 63,
      }),
    );
    const governance = await generateWhyThisMatters(
      createIntelligence({
        id: "governance",
        title: "Peter Mandelson failed UK Foreign Office vetting",
        summary: "The setback raises questions about UK diplomatic judgment and political accountability.",
        primaryChange: "Peter Mandelson failed UK Foreign Office vetting",
        entities: ["UK Foreign Office", "Peter Mandelson"],
        eventType: "governance_politics",
        primaryImpact: "The development could affect diplomatic credibility and political accountability.",
        affectedMarkets: ["diplomatic credibility", "political accountability"],
        topics: ["politics", "geopolitics"],
        timeHorizon: "medium",
        signalStrength: "weak",
        confidenceScore: 52,
      }),
    );
    const macro = await generateWhyThisMatters(
      createIntelligence({
        id: "macro",
        title: "Lower mortgage rates lift refinancing activity",
        summary: "Falling mortgage rates are starting to change housing demand and refinancing behavior.",
        primaryChange: "Lower mortgage rates lifted refinancing activity",
        entities: ["Mortgage rates"],
        eventType: "macro_market_move",
        primaryImpact: "Lower mortgage rates could affect housing demand and household cash flow.",
        affectedMarkets: ["housing", "consumer demand"],
        topics: ["finance"],
        signalStrength: "strong",
        confidenceScore: 68,
      }),
    );

    expect(funding.toLowerCase()).toContain("capital");
    expect(demand.toLowerCase()).toMatch(/demand|markets price|market expectations|rates/);
    expect(governance.toLowerCase()).toMatch(/governance|diplomatic|political accountability/);
    expect(governance.toLowerCase()).not.toMatch(/equities|technology/);
    expect(macro.toLowerCase()).toMatch(/mortgage|rates|housing/);
  });

  it("fails the swap test across unrelated event types", async () => {
    const funding = await generateWhyThisMatters(createIntelligence());
    const governance = await generateWhyThisMatters(
      createIntelligence({
        id: "governance-swap",
        title: "Peter Mandelson failed UK Foreign Office vetting",
        summary: "The setback raises questions about UK diplomatic judgment and political accountability.",
        primaryChange: "Peter Mandelson failed UK Foreign Office vetting",
        entities: ["UK Foreign Office", "Peter Mandelson"],
        eventType: "governance_politics",
        primaryImpact: "The development could affect diplomatic credibility and political accountability.",
        affectedMarkets: ["diplomatic credibility", "political accountability"],
        topics: ["politics", "geopolitics"],
        signalStrength: "weak",
        confidenceScore: 52,
      }),
    );

    expect(funding).not.toBe(governance);
    expect(funding.toLowerCase()).not.toContain("diplomatic credibility");
    expect(governance.toLowerCase()).not.toContain("capital availability");
  });

  it("falls back honestly for low-data governance stories without drifting into finance or tech language", async () => {
    const text = await generateWhyThisMatters(
      createIntelligence({
        id: "governance-fallback",
        title: "Peter Mandelson failed UK Foreign Office vetting",
        summary: "The setback raises questions about UK diplomatic judgment and political accountability.",
        entities: ["Wait"],
        keyEntities: ["Wait"],
        eventType: "governance_politics",
        primaryImpact: "The development could affect diplomatic credibility and political accountability.",
        affectedMarkets: ["diplomatic credibility", "political accountability"],
        topics: ["politics"],
        signalStrength: "weak",
        confidenceScore: 24,
      }),
    );

    expect(text).toMatch(/UK|This governance story|Early coverage around/);
    expect(text.toLowerCase()).toMatch(/governance|diplomatic|political accountability/);
    expect(text.toLowerCase()).not.toMatch(/equities|technology|wait matters because wait/);
  });

  it("prevents one fallback opener from dominating an entire low-data batch", async () => {
    const outputs: string[] = [];

    for (const [index, title] of [
      "Startup X raises $8M for warehouse robots",
      "UK minister faces vetting scrutiny",
      "Mortgage demand softens after rate volatility",
      "Product teaser hints at enterprise launch timing",
    ].entries()) {
      outputs.push(
        await generateWhyThisMatters(
          createIntelligence({
            id: `fallback-${index}`,
            title,
            entities: ["Wait"],
            keyEntities: ["Wait"],
            eventType:
              index === 0
                ? "mna_funding"
                : index === 1
                  ? "governance_politics"
                  : index === 2
                    ? "macro_market_move"
                    : "product_launch_major",
            affectedMarkets:
              index === 1 ? ["diplomatic credibility"] : ["technology"],
            topics: index === 1 ? ["politics"] : ["tech"],
            signalStrength: "weak",
            confidenceScore: 22,
            signals: {
              articleCount: 1,
              sourceDiversity: 1,
              recencyScore: 84,
              velocityScore: 20,
            },
          }),
          { previousOutputs: outputs },
        ),
      );
    }

    const patternKeys = outputs.map((output) => __testing__.getPatternKey(output));
    const highestReuse = Math.max(
      ...patternKeys.map((key) => patternKeys.filter((candidate) => candidate === key).length),
    );

    expect(highestReuse).toBeLessThanOrEqual(2);
    expect(new Set(patternKeys).size).toBeGreaterThan(1);
  });

  it("keeps heuristic outputs from collapsing into fallback for valid anchored stories", () => {
    const text = generateWhyThisMattersHeuristically(
      createIntelligence({
        title: "Adobe says AI-driven retail traffic surged in the first quarter",
        summary: "Adobe data showed sharp AI referral growth for U.S. retailers.",
        primaryChange: "Adobe reported a surge in AI-driven retail traffic",
        entities: ["Adobe"],
        eventType: "macro_market_move",
        primaryImpact: "The data could affect demand expectations across e-commerce and ad spending.",
        affectedMarkets: ["retail demand", "e-commerce"],
        topics: ["finance", "business"],
        signalStrength: "moderate",
        confidenceScore: 63,
      }),
    );

    expect(text.startsWith("Adobe")).toBe(true);
    expect(text.toLowerCase()).not.toContain("still an early signal");
  });

  it("extracts meaningful anchors and rejects stray-token subjects", () => {
    const anchor = __testing__.extractPrimaryAnchor(
      createIntelligence({
        title: "Google adds Nano Banana-powered image generation to Gemini",
        entities: ["Google", "Gemini"],
      }),
    );

    expect(anchor?.label).toBe("Google");
    expect(__testing__.isMeaningfulAnchor("Wait")).toBe(false);
    expect(__testing__.isLowDataScenario(createIntelligence())).toBe(false);
  });
});
