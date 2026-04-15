import type { EventIntelligence } from "@/lib/types";

export type TrustLayerPresentation = {
  tier: "high" | "medium" | "low";
  heading: string;
  body: string;
  supportingSignals: string[];
};

export function buildTrustLayerPresentation(
  intelligence: EventIntelligence | undefined,
  fallback: {
    title: string;
    topicName: string;
    whyItMatters?: string;
    sourceCount?: number;
    rankingSignals?: string[];
  },
): TrustLayerPresentation {
  if (!intelligence) {
    return {
      tier: "medium",
      heading: "Why this is here",
      body: fallback.whyItMatters || `Tracked in ${fallback.topicName} because it cleared the current briefing filters.`,
      supportingSignals: fallback.rankingSignals?.slice(0, 2) ?? [],
    };
  }

  const tier = intelligence.confidenceScore >= 72 ? "high" : intelligence.confidenceScore >= 45 ? "medium" : "low";

  if (tier === "high") {
    return {
      tier,
      heading: "Why it matters",
      body: `${intelligence.primaryChange}. ${deriveImpactSentence(intelligence)} ${intelligence.rankingReason}`,
      supportingSignals: buildSignalChips(intelligence).slice(0, 3),
    };
  }

  if (tier === "medium") {
    return {
      tier,
      heading: "Why this is here",
      body: `Tracked because ${intelligence.rankingReason.charAt(0).toLowerCase()}${intelligence.rankingReason.slice(1)}`,
      supportingSignals: buildSignalChips(intelligence).slice(0, 3),
    };
  }

  return {
    tier,
    heading: "Analysis",
    body: "Connect AI for analysis",
    supportingSignals: [],
  };
}

function buildSignalChips(intelligence: EventIntelligence) {
  return [
    intelligence.keyEntities[0],
    intelligence.topics[0],
    intelligence.signals.sourceDiversity > 1
      ? `${intelligence.signals.sourceDiversity} sources`
      : "Early coverage",
    intelligence.signals.articleCount > 1
      ? `${intelligence.signals.articleCount} articles`
      : null,
  ].filter((value): value is string => Boolean(value));
}

function deriveImpactSentence(intelligence: EventIntelligence) {
  if (intelligence.topics.includes("finance") || intelligence.topics.includes("business")) {
    return "This matters because it can reset market, funding, or company assumptions quickly.";
  }

  if (intelligence.topics.includes("politics") || intelligence.topics.includes("geopolitics")) {
    return "This matters because policy and geopolitical shifts can change the operating environment quickly.";
  }

  if (intelligence.topics.includes("tech")) {
    return "This matters because technology and infrastructure shifts can change execution and competitive positioning quickly.";
  }

  return "This matters because it can change near-term planning assumptions quickly.";
}
