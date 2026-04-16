import type { DashboardData } from "@/lib/types";

export function getDashboardFixture(name: string): DashboardData | null {
  if (name !== "importance-ranking") {
    return null;
  }

  return {
    mode: "public",
    topics: [
      {
        id: "topic-policy",
        name: "Policy",
        description: "Policy and macro developments",
        color: "#1F4F46",
      },
    ],
    sources: [],
    briefing: {
      id: "fixture-importance-ranking",
      briefingDate: "2026-04-17T08:00:00.000Z",
      title: "Today's Briefing",
      intro: "Fixture briefing for deterministic importance ranking tests.",
      readingWindow: "12 minutes",
      items: [
        {
          id: "fixture-high",
          topicId: "topic-policy",
          topicName: "Policy",
          title: "Federal Reserve signals emergency liquidity response",
          whatHappened: "The Fed outlined a fast-moving liquidity response after a macro shock.",
          keyPoints: [
            "Federal Reserve action moved to the center of the story.",
            "Reuters and Bloomberg both carried confirming coverage.",
            "Markets are recalibrating around the policy signal.",
          ],
          whyItMatters: "This is the kind of high-signal policy move the importance engine should push to the top.",
          sources: [
            { title: "Reuters", url: "https://example.com/high-1" },
            { title: "Bloomberg", url: "https://example.com/high-2" },
          ],
          relatedArticles: [
            { title: "Reuters report", url: "https://example.com/high-1", sourceName: "Reuters" },
            { title: "Bloomberg report", url: "https://example.com/high-2", sourceName: "Bloomberg" },
          ],
          estimatedMinutes: 4,
          read: false,
          priority: "top",
          publishedAt: "2026-04-17T07:30:00.000Z",
          sourceCount: 2,
          importanceScore: 17,
          importanceLabel: "Critical",
          signalLabel: "High Signal",
          eventType: "central-bank",
          sourceTier: "tier1",
          entityTags: ["Federal Reserve"],
          rankingSignals: ["High Signal from central bank coverage."],
        },
        {
          id: "fixture-medium",
          topicId: "topic-policy",
          topicName: "Policy",
          title: "Intel expands enterprise AI rollout after partner update",
          whatHappened: "Intel detailed a meaningful but lower-impact rollout update with partner commentary.",
          keyPoints: [
            "The move matters for the company and its partners.",
            "Coverage is fresh but less market-wide.",
            "The story still deserves to sit above low-signal updates.",
          ],
          whyItMatters: "This should land in the middle of the stack as a medium-signal corporate development.",
          sources: [
            { title: "CNBC", url: "https://example.com/medium-1" },
            { title: "TechCrunch", url: "https://example.com/medium-2" },
          ],
          relatedArticles: [
            { title: "CNBC report", url: "https://example.com/medium-1", sourceName: "CNBC" },
            { title: "TechCrunch report", url: "https://example.com/medium-2", sourceName: "TechCrunch" },
          ],
          estimatedMinutes: 4,
          read: false,
          priority: "normal",
          publishedAt: "2026-04-17T06:30:00.000Z",
          sourceCount: 2,
          importanceScore: 10,
          importanceLabel: "High",
          signalLabel: "Medium Signal",
          eventType: "major-corporate-move",
          sourceTier: "tier2",
          entityTags: ["Intel"],
          rankingSignals: ["Medium Signal from major corporate move coverage."],
        },
        {
          id: "fixture-low",
          topicId: "topic-policy",
          topicName: "Policy",
          title: "Analyst commentary revisits startup roadmap",
          whatHappened: "A commentary-style update offers light analysis without a material new development.",
          keyPoints: [
            "The piece is recent but low impact.",
            "Coverage quality is lighter and less corroborated.",
            "This should remain visible without dominating the dashboard.",
          ],
          whyItMatters: "The card should still render, but it should stay below the stronger stories.",
          sources: [
            { title: "Unknown Blog", url: "https://example.com/low-1" },
            { title: "Second Blog", url: "https://example.com/low-2" },
          ],
          relatedArticles: [
            { title: "Unknown Blog note", url: "https://example.com/low-1", sourceName: "Unknown Blog" },
            { title: "Second Blog note", url: "https://example.com/low-2", sourceName: "Second Blog" },
          ],
          estimatedMinutes: 4,
          read: false,
          priority: "normal",
          publishedAt: "2026-04-17T05:30:00.000Z",
          sourceCount: 2,
          importanceScore: 4,
          importanceLabel: "Watch",
          signalLabel: "Low Signal",
          eventType: "commentary",
          sourceTier: "tier3",
          entityTags: ["Startup"],
          rankingSignals: ["Low Signal from commentary coverage."],
        },
      ],
    },
    homepageDiagnostics: {
      totalArticlesFetched: 3,
      totalCandidateEvents: 3,
      lastSuccessfulFetchTime: "2026-04-17T08:00:00.000Z",
      lastRankingRunTime: "2026-04-17T08:00:00.000Z",
      failedSourceCount: 0,
      fallbackSourceCount: 0,
      degradedSourceNames: [],
      sourceCountsByCategory: {
        tech: 0,
        finance: 0,
        politics: 1,
      },
    },
  };
}
