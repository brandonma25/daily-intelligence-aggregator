import { describe, expect, it } from "vitest";

import { buildWhyItMattersContent, evaluateWhyItMattersTier } from "@/lib/why-it-matters";

describe("why-it-matters trust layer", () => {
  it("uses tier 1 when event data is rich and specific", () => {
    const presentation = buildWhyItMattersContent({
      id: "finance-1",
      title: "Fed signals rates will stay elevated",
      topicName: "Finance",
      summary: "Markets and banks are repricing after a new Federal Reserve signal.",
      whyItMatters: "It changes funding expectations across the market.",
      matchedKeywords: ["fed", "rates", "markets"],
      rankingSignals: ["Covered by 4 sources, which boosts confidence."],
      sourceCount: 4,
      importanceLabel: "Critical",
      primaryCategory: "finance",
    });

    expect(presentation.tier).toBe("high");
    expect(presentation.heading).toBe("Why it matters");
    expect(presentation.body).toContain("Markets and banks are repricing");
    expect(presentation.body).toMatch(/ranked|surfaced|stayed near the top/i);
  });

  it("uses tier 2 when there are real signals but not enough confidence for synthesis", () => {
    const presentation = buildWhyItMattersContent({
      id: "politics-1",
      title: "Senate committee opens a new review",
      topicName: "Politics",
      summary: "A new review is underway.",
      whyItMatters: "It matters because it changes expectations.",
      matchedKeywords: ["senate"],
      rankingSignals: [],
      sourceCount: 2,
      primaryCategory: "politics",
    });

    expect(presentation.tier).toBe("medium");
    expect(presentation.heading).toBe("Why this is here");
    expect(presentation.body).toContain("Tracked here because");
    expect(presentation.body).toContain("2 sources");
  });

  it("uses tier 3 when inputs are too weak for a credible explanation", () => {
    const presentation = buildWhyItMattersContent({
      id: "general-1",
      title: "General update",
      topicName: "General Briefing",
      summary: "A development happened.",
      whyItMatters: "",
      matchedKeywords: [],
      rankingSignals: [],
      sourceCount: 1,
    });

    expect(evaluateWhyItMattersTier({
      id: "general-1",
      title: "General update",
      topicName: "General Briefing",
      summary: "A development happened.",
      whyItMatters: "",
      matchedKeywords: [],
      rankingSignals: [],
      sourceCount: 1,
    })).toBe("low");
    expect(presentation.tier).toBe("low");
    expect(presentation.body).toBe("Connect AI for analysis");
  });

  it("avoids repeating the exact same high-confidence sentence pattern across events", () => {
    const finance = buildWhyItMattersContent({
      id: "finance-variant",
      title: "Treasury markets brace for inflation print",
      topicName: "Finance",
      summary: "Bond markets are repricing before the latest inflation data.",
      whyItMatters: "It may move expectations around rates.",
      matchedKeywords: ["treasury", "inflation", "rates"],
      rankingSignals: ["Covered by 3 sources, which boosts confidence."],
      sourceCount: 3,
      primaryCategory: "finance",
    });
    const tech = buildWhyItMattersContent({
      id: "tech-variant",
      title: "Cloud providers expand AI data center plans",
      topicName: "Tech",
      summary: "Cloud and semiconductor groups are expanding AI capacity.",
      whyItMatters: "Platform capacity shifts can reshape competitive dynamics.",
      matchedKeywords: ["cloud", "ai", "data center"],
      rankingSignals: ["Fresh reporting in the current cycle."],
      sourceCount: 3,
      primaryCategory: "tech",
    });

    expect(finance.body).not.toBe(tech.body);
  });
});
