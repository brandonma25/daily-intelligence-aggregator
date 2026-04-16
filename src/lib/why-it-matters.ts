import type { EventIntelligence } from "@/lib/types";

export type TrustLayerPresentation = {
  tier: "high" | "medium" | "low";
  heading: string;
  body: string;
  supportingSignals: string[];
};

type GenerateWhyThisMattersOptions = {
  previousOutputs?: string[];
};

type NormalizedReasoningCategory =
  | "policy_regulation"
  | "earnings_financials"
  | "mna_funding"
  | "product_launch_major"
  | "governance_politics"
  | "geopolitics"
  | "legal_investigation"
  | "macro_market_move"
  | "company_update";

type NormalizedIntelligence = EventIntelligence & {
  entities: string[];
  affectedMarkets: string[];
  timeHorizon: EventIntelligence["timeHorizon"];
  signalStrength: EventIntelligence["signalStrength"];
  reasoningCategory: NormalizedReasoningCategory;
};

type PatternTemplate = {
  key: string;
  build: (input: {
    anchor: string;
    mechanism: string;
    impact: string;
    horizonLabel: string;
    marketLabel: string;
  }) => string;
};

const INVALID_ANCHORS = new Set([
  "ai",
  "wait",
  "according",
  "conservatives",
  "markets",
  "technology",
  "finance",
  "business",
  "politics",
  "tech",
  "update",
  "report",
  "reports",
  "analysis",
  "commentary",
  "watch",
  "live",
  "breaking",
]);

const REASONING_TEMPLATES: Record<NormalizedReasoningCategory, PatternTemplate[]> = {
  policy_regulation: [
    {
      key: "policy_framework",
      build: ({ anchor, mechanism, impact, horizonLabel }) =>
        `${anchor} changes the policy framework around the story, which ${mechanism}, so ${impact} over the ${horizonLabel}.`,
    },
    {
      key: "policy_constraint",
      build: ({ anchor, mechanism, impact, horizonLabel }) =>
        `${anchor} tightens the operating constraints companies or governments have to work within, which ${mechanism}, and that can ${impact} over the ${horizonLabel}.`,
    },
    {
      key: "policy_repricing",
      build: ({ anchor, mechanism, impact, horizonLabel }) =>
        `${anchor} forces investors and operators to reprice the rule set they are working under, because ${mechanism}, so ${impact} over the ${horizonLabel}.`,
    },
  ],
  earnings_financials: [
    {
      key: "earnings_baseline",
      build: ({ anchor, mechanism, impact, horizonLabel }) =>
        `${anchor} resets the earnings and guidance baseline, which ${mechanism}, so ${impact} over the ${horizonLabel}.`,
    },
    {
      key: "earnings_expectations",
      build: ({ anchor, mechanism, impact, horizonLabel }) =>
        `${anchor} changes near-term expectations investors use to value the story, because ${mechanism}, which can ${impact} over the ${horizonLabel}.`,
    },
    {
      key: "earnings_visibility",
      build: ({ anchor, mechanism, impact, horizonLabel }) =>
        `${anchor} increases the visibility around revenue, margins, or guidance, which ${mechanism}, and that may ${impact} over the ${horizonLabel}.`,
    },
  ],
  mna_funding: [
    {
      key: "market_structure",
      build: ({ anchor, mechanism, impact, horizonLabel }) =>
        `${anchor} can reshape market structure, because ${mechanism}, so ${impact} over the ${horizonLabel}.`,
    },
    {
      key: "competition_funding",
      build: ({ anchor, mechanism, impact, horizonLabel }) =>
        `${anchor} changes competitive intensity and capital availability, which ${mechanism}, and that can ${impact} over the ${horizonLabel}.`,
    },
    {
      key: "allocation_funding",
      build: ({ anchor, mechanism, impact, horizonLabel }) =>
        `${anchor} changes how capital and strategic attention are allocated, because ${mechanism}, so ${impact} over the ${horizonLabel}.`,
    },
  ],
  product_launch_major: [
    {
      key: "product_adoption",
      build: ({ anchor, mechanism, impact, horizonLabel }) =>
        `${anchor} could shift product adoption and buyer expectations, because ${mechanism}, so ${impact} over the ${horizonLabel}.`,
    },
    {
      key: "platform_competition",
      build: ({ anchor, mechanism, impact, horizonLabel }) =>
        `${anchor} changes the platform comparison buyers and rivals are making, which ${mechanism}, and that can ${impact} over the ${horizonLabel}.`,
    },
    {
      key: "product_positioning",
      build: ({ anchor, mechanism, impact, horizonLabel }) =>
        `${anchor} puts pressure on competing product roadmaps, because ${mechanism}, so ${impact} over the ${horizonLabel}.`,
    },
  ],
  governance_politics: [
    {
      key: "governance_accountability",
      build: ({ anchor, mechanism, impact, horizonLabel }) =>
        `${anchor} raises governance and accountability questions, which ${mechanism}, so ${impact} over the ${horizonLabel}.`,
    },
    {
      key: "governance_credibility",
      build: ({ anchor, mechanism, impact, horizonLabel }) =>
        `${anchor} can affect political or diplomatic credibility, because ${mechanism}, and that may ${impact} over the ${horizonLabel}.`,
    },
    {
      key: "governance_followthrough",
      build: ({ anchor, mechanism, impact, horizonLabel }) =>
        `${anchor} tests whether this develops into a broader governance problem, which ${mechanism}, so ${impact} over the ${horizonLabel}.`,
    },
  ],
  geopolitics: [
    {
      key: "geopolitics_risk",
      build: ({ anchor, mechanism, impact, horizonLabel }) =>
        `${anchor} raises geopolitical risk, which ${mechanism}, so ${impact} over the ${horizonLabel}.`,
    },
    {
      key: "geopolitics_trade",
      build: ({ anchor, mechanism, impact, horizonLabel }) =>
        `${anchor} can disrupt trade, supply, or energy flows, because ${mechanism}, and that may ${impact} over the ${horizonLabel}.`,
    },
    {
      key: "geopolitics_premium",
      build: ({ anchor, mechanism, impact, horizonLabel }) =>
        `${anchor} changes the risk premium markets attach to the story, which ${mechanism}, so ${impact} over the ${horizonLabel}.`,
    },
  ],
  legal_investigation: [
    {
      key: "legal_liability",
      build: ({ anchor, mechanism, impact, horizonLabel }) =>
        `${anchor} raises legal and liability risk, because ${mechanism}, so ${impact} over the ${horizonLabel}.`,
    },
    {
      key: "legal_operations",
      build: ({ anchor, mechanism, impact, horizonLabel }) =>
        `${anchor} may constrain operations or strategic flexibility, which ${mechanism}, and that can ${impact} over the ${horizonLabel}.`,
    },
    {
      key: "legal_reputation",
      build: ({ anchor, mechanism, impact, horizonLabel }) =>
        `${anchor} puts reputational and regulatory pressure on the story, because ${mechanism}, so ${impact} over the ${horizonLabel}.`,
    },
  ],
  macro_market_move: [
    {
      key: "macro_backdrop",
      build: ({ anchor, mechanism, impact, horizonLabel }) =>
        `${anchor} changes the macro backdrop investors are using, which ${mechanism}, so ${impact} over the ${horizonLabel}.`,
    },
    {
      key: "macro_pricing",
      build: ({ anchor, mechanism, impact, horizonLabel }) =>
        `${anchor} changes how markets price growth, rates, or demand, because ${mechanism}, and that can ${impact} over the ${horizonLabel}.`,
    },
    {
      key: "macro_expectations",
      build: ({ anchor, mechanism, impact, horizonLabel }) =>
        `${anchor} shifts the baseline assumptions behind market expectations, which ${mechanism}, so ${impact} over the ${horizonLabel}.`,
    },
  ],
  company_update: [
    {
      key: "company_execution",
      build: ({ anchor, mechanism, impact, horizonLabel }) =>
        `${anchor} changes the company-specific execution picture, because ${mechanism}, so ${impact} over the ${horizonLabel}.`,
    },
    {
      key: "company_expectations",
      build: ({ anchor, mechanism, impact, horizonLabel }) =>
        `${anchor} alters the operating assumptions around the story, which ${mechanism}, and that can ${impact} over the ${horizonLabel}.`,
    },
    {
      key: "company_watch",
      build: ({ anchor, mechanism, impact, horizonLabel }) =>
        `${anchor} is worth watching because ${mechanism}, so ${impact} over the ${horizonLabel}.`,
    },
  ],
};

export async function generateWhyThisMatters(
  intelligence: EventIntelligence,
  options: GenerateWhyThisMattersOptions = {},
) {
  const normalized = normalizeIntelligence(intelligence);
  const previousOutputs = options.previousOutputs ?? [];
  const body = buildGroundedWhyThisMatters(normalized, previousOutputs);
  return formatWhyThisMatters(body, normalized.signalStrength);
}

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
  const normalized = normalizeIntelligence(intelligence);
  const body = formatWhyThisMatters(
    buildGroundedWhyThisMatters(normalized, []),
    normalized.signalStrength,
  );

  return {
    tier,
    heading: "Why it matters",
    body,
    supportingSignals: buildSignalChips(normalized).slice(0, tier === "low" ? 2 : 3),
  };
}

function buildSignalChips(intelligence: NormalizedIntelligence) {
  const anchor = extractPrimaryAnchor(intelligence);

  return [
    anchor?.label ?? "Event-specific",
    intelligence.reasoningCategory.replace(/_/g, " "),
    intelligence.signals.sourceDiversity > 1
      ? `${intelligence.signals.sourceDiversity} sources`
      : "Early coverage",
    intelligence.signals.articleCount > 1
      ? `${intelligence.signals.articleCount} articles`
      : null,
  ].filter((value): value is string => Boolean(value));
}

export function generateWhyThisMattersHeuristically(intelligence: EventIntelligence) {
  return buildGroundedWhyThisMatters(normalizeIntelligence(intelligence), []);
}

function buildGroundedWhyThisMatters(
  intelligence: NormalizedIntelligence,
  previousOutputs: string[],
) {
  if (isLowDataScenario(intelligence)) {
    return buildLowConfidenceFallback(intelligence, previousOutputs);
  }

  const anchor = extractPrimaryAnchor(intelligence);
  const anchorLabel = anchor?.label ?? buildEventLabel(intelligence);
  const marketLabel = intelligence.affectedMarkets.slice(0, 2).join(" and ");
  const horizonLabel = getTimeHorizonLabel(intelligence.timeHorizon);
  const mechanism = buildMechanism(intelligence, marketLabel);
  const impact = buildImpact(intelligence, marketLabel);
  const templates = REASONING_TEMPLATES[intelligence.reasoningCategory];
  const usageByKey = countPatternUsage(previousOutputs);

  const rankedTemplates = templates
    .map((template) => ({
      template,
      usage: usageByKey.get(template.key) ?? 0,
      text: template.build({
        anchor: anchorLabel,
        mechanism,
        impact,
        horizonLabel,
        marketLabel,
      }),
    }))
    .sort((left, right) => left.usage - right.usage);

  const chosen = chooseBestCandidate(rankedTemplates, previousOutputs);

  return chosen?.text ?? buildLowConfidenceFallback(intelligence, previousOutputs);
}

function extractPrimaryAnchor(intelligence: NormalizedIntelligence) {
  const candidates = [
    ...(intelligence.entities ?? []),
    ...(intelligence.keyEntities ?? []),
    ...extractHeadlineCandidates(intelligence.title),
  ];

  for (const candidate of candidates) {
    const normalized = candidate.trim();
    if (isMeaningfulAnchor(normalized)) {
      return { label: normalized };
    }
  }

  return null;
}

function extractHeadlineCandidates(title: string) {
  return (
    title.match(/\b(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}|[A-Z]{2,}|U\.S\.|UK|EU|Federal Reserve|White House)\b/g) ?? []
  )
    .map((match) => match.trim())
    .filter(Boolean);
}

function isMeaningfulAnchor(value: string) {
  const normalized = value.toLowerCase();
  if (!normalized || INVALID_ANCHORS.has(normalized)) {
    return false;
  }

  if (/^\d+$/.test(normalized)) {
    return false;
  }

  if (value.split(/\s+/).length === 2 && /^[A-Z][a-z]+\s+[A-Z][a-z]+$/.test(value)) {
    return /(bank|fund|group|holdings|inc|corp|ltd|plc|ministry|office|department|agency|commission|reserve|house|union)/i.test(value);
  }

  return (
    /^[A-Z]/.test(value) ||
    /(u\.s\.|uk|eu|federal reserve|white house|opec|nato|sec|doj)/i.test(value)
  );
}

function buildEventLabel(intelligence: NormalizedIntelligence) {
  switch (intelligence.reasoningCategory) {
    case "policy_regulation":
      return "This policy move";
    case "earnings_financials":
      return "This earnings update";
    case "mna_funding":
      return "This deal or funding round";
    case "product_launch_major":
      return "This product release";
    case "governance_politics":
      return "This governance story";
    case "geopolitics":
      return "This geopolitical development";
    case "legal_investigation":
      return "This legal development";
    case "macro_market_move":
      return "This macro signal";
    default:
      return "This development";
  }
}

function buildMechanism(intelligence: NormalizedIntelligence, marketLabel: string) {
  switch (intelligence.reasoningCategory) {
    case "policy_regulation":
      return `changes regulation, compliance, or market-access assumptions around ${marketLabel}`;
    case "earnings_financials":
      return `changes revenue, margin, or guidance expectations tied to ${marketLabel}`;
    case "mna_funding":
      return `changes capital availability, competitive positioning, or market structure in ${marketLabel}`;
    case "product_launch_major":
      return `changes adoption expectations and the competitive benchmark in ${marketLabel}`;
    case "governance_politics":
      return `changes assumptions about political accountability, diplomatic credibility, or institutional follow-through`;
    case "geopolitics":
      return `changes risk, trade, supply, or energy assumptions feeding into ${marketLabel}`;
    case "legal_investigation":
      return `changes liability, operating flexibility, or reputational assumptions around ${marketLabel}`;
    case "macro_market_move":
      return `changes how investors price rates, demand, or risk in ${marketLabel}`;
    default:
      return trimTrailingPeriod(intelligence.primaryImpact).toLowerCase();
  }
}

function buildImpact(intelligence: NormalizedIntelligence, marketLabel: string) {
  switch (intelligence.reasoningCategory) {
    case "policy_regulation":
      return `shift sector constraints, cost structures, or strategic flexibility in ${marketLabel}`;
    case "earnings_financials":
      return `move valuation, guidance credibility, or sector sentiment in ${marketLabel}`;
    case "mna_funding":
      return `shift competitive intensity, consolidation expectations, or valuation support in ${marketLabel}`;
    case "product_launch_major":
      return `change buyer adoption, platform share, or roadmap pressure in ${marketLabel}`;
    case "governance_politics":
      return `shift diplomatic standing, political accountability, or policy credibility around the story`;
    case "geopolitics":
      return `move trade exposure, energy sensitivity, or risk premia in ${marketLabel}`;
    case "legal_investigation":
      return `raise downside risk for operations, cash flow, or reputation in ${marketLabel}`;
    case "macro_market_move":
      return `move market expectations, sector sentiment, or pricing in ${marketLabel}`;
    default:
      return trimTrailingPeriod(intelligence.primaryImpact).toLowerCase();
  }
}

function buildLowConfidenceFallback(
  intelligence: NormalizedIntelligence,
  previousOutputs: string[] = [],
) {
  const marketLabel = intelligence.affectedMarkets.slice(0, 2).join(" and ");
  const watchFor = buildWatchForPhrase(intelligence, marketLabel);
  const anchor = extractPrimaryAnchor(intelligence);
  const anchorLabel = anchor?.label ?? buildEventLabel(intelligence);
  const horizonLabel = getTimeHorizonLabel(intelligence.timeHorizon);
  const templates = [
    {
      key: "early_signal_subject",
      text: `${anchorLabel} is still an early signal, but watch for ${watchFor} over the ${horizonLabel}.`,
    },
    {
      key: "early_signal_question",
      text: `${anchorLabel} is still lightly confirmed, so the key question is whether ${watchFor} over the ${horizonLabel}.`,
    },
    {
      key: "early_signal_coverage",
      text: `Early coverage around ${anchorLabel} is still thin, but it is worth watching for ${watchFor} over the ${horizonLabel}.`,
    },
  ];
  const usageByKey = countPatternUsage(previousOutputs);
  const rankedTemplates = templates
    .map((template, index) => ({
      ...template,
      usage: usageByKey.get(template.key) ?? 0,
      index,
    }))
    .sort((left, right) => {
      if (left.usage !== right.usage) {
        return left.usage - right.usage;
      }

      return left.index - right.index;
    });
  const chosen = chooseBestCandidate(rankedTemplates, previousOutputs);

  return chosen?.text ?? templates[getFallbackVariantIndex(intelligence)]?.text ?? templates[0].text;
}

function buildWatchForPhrase(intelligence: NormalizedIntelligence, marketLabel: string) {
  switch (intelligence.reasoningCategory) {
    case "policy_regulation":
      return `follow-through on regulation, compliance requirements, or market-access changes tied to ${marketLabel}`;
    case "earnings_financials":
      return `additional confirmation on guidance, margins, or demand in ${marketLabel}`;
    case "mna_funding":
      return `evidence that competition, funding capacity, or consolidation in ${marketLabel} is actually changing`;
    case "product_launch_major":
      return `evidence of real adoption, pricing power, or competitive response in ${marketLabel}`;
    case "governance_politics":
      return `whether it turns into a broader governance, diplomatic, or political accountability issue`;
    case "geopolitics":
      return `further confirmation that trade, supply, or energy risk is moving in ${marketLabel}`;
    case "legal_investigation":
      return `signs the legal pressure expands into operational, financial, or reputational consequences`;
    case "macro_market_move":
      return `confirmation that rates, demand, or macro pricing in ${marketLabel} is actually shifting`;
    default:
      return `further confirmation on how this changes ${marketLabel}`;
  }
}

function isLowDataScenario(intelligence: NormalizedIntelligence) {
  const thinEvidence =
    intelligence.signals.sourceDiversity <= 1 && intelligence.signals.articleCount <= 1;
  const missingAnchor = !extractPrimaryAnchor(intelligence);
  const weakEventType = intelligence.reasoningCategory === "company_update";
  const veryLowConfidence = intelligence.confidenceScore < 32;
  const weakThinStory =
    thinEvidence &&
    intelligence.signalStrength === "weak" &&
    intelligence.confidenceScore < 48;

  return (
    veryLowConfidence ||
    (thinEvidence && missingAnchor) ||
    (thinEvidence && weakEventType && weakThinStory)
  );
}

function formatWhyThisMatters(text: string, signalStrength: EventIntelligence["signalStrength"]) {
  const normalized = ensureSentence(text);
  return `${normalized} (Signal: ${capitalize(signalStrength)})`;
}

function countPatternUsage(previousOutputs: string[]) {
  const usage = new Map<string, number>();

  for (const output of previousOutputs) {
    const key = getPatternKey(output);
    usage.set(key, (usage.get(key) ?? 0) + 1);
  }

  return usage;
}

function chooseBestCandidate<T extends { text: string; usage: number }>(
  candidates: T[],
  previousOutputs: string[],
) {
  return (
    candidates.find((candidate) => candidate.usage < 2 && !isTooSimilar(candidate.text, previousOutputs)) ??
    candidates.find((candidate) => !isTooSimilar(candidate.text, previousOutputs)) ??
    candidates[0]
  );
}

function getPatternKey(output: string) {
  const normalized = output.toLowerCase();

  if (normalized.startsWith("this is an early signal")) return "early_signal";
  if (normalized.includes("is still an early signal")) return "early_signal_subject";
  if (normalized.includes("is still lightly confirmed")) return "early_signal_question";
  if (normalized.includes("early coverage around")) return "early_signal_coverage";
  if (normalized.includes("changes the policy framework")) return "policy_framework";
  if (normalized.includes("tightens the operating constraints")) return "policy_constraint";
  if (normalized.includes("forces investors and operators to reprice")) return "policy_repricing";
  if (normalized.includes("resets the earnings and guidance baseline")) return "earnings_baseline";
  if (normalized.includes("changes near-term expectations investors use to value")) return "earnings_expectations";
  if (normalized.includes("increases the visibility around revenue")) return "earnings_visibility";
  if (normalized.includes("can reshape market structure")) return "market_structure";
  if (normalized.includes("changes competitive intensity and capital availability")) return "competition_funding";
  if (normalized.includes("changes how capital and strategic attention are allocated")) return "allocation_funding";
  if (normalized.includes("could shift product adoption")) return "product_adoption";
  if (normalized.includes("changes the platform comparison")) return "platform_competition";
  if (normalized.includes("puts pressure on competing product roadmaps")) return "product_positioning";
  if (normalized.includes("raises governance and accountability questions")) return "governance_accountability";
  if (normalized.includes("can affect political or diplomatic credibility")) return "governance_credibility";
  if (normalized.includes("tests whether this develops into a broader governance problem")) return "governance_followthrough";
  if (normalized.includes("raises geopolitical risk")) return "geopolitics_risk";
  if (normalized.includes("can disrupt trade, supply, or energy flows")) return "geopolitics_trade";
  if (normalized.includes("changes the risk premium")) return "geopolitics_premium";
  if (normalized.includes("raises legal and liability risk")) return "legal_liability";
  if (normalized.includes("may constrain operations or strategic flexibility")) return "legal_operations";
  if (normalized.includes("puts reputational and regulatory pressure")) return "legal_reputation";
  if (normalized.includes("changes the macro backdrop investors are using")) return "macro_backdrop";
  if (normalized.includes("changes how markets price growth, rates, or demand")) return "macro_pricing";
  if (normalized.includes("shifts the baseline assumptions behind market expectations")) return "macro_expectations";
  if (normalized.includes("changes the company-specific execution picture")) return "company_execution";
  if (normalized.includes("alters the operating assumptions around the story")) return "company_expectations";
  return "company_watch";
}

function isTooSimilar(candidate: string, previousOutputs: string[]) {
  return previousOutputs.some((previous) => similarityScore(candidate, previous) >= 0.72);
}

function similarityScore(left: string, right: string) {
  const leftWords = new Set(normalizeForSimilarity(left).split(" ").filter(Boolean));
  const rightWords = new Set(normalizeForSimilarity(right).split(" ").filter(Boolean));
  const overlap = [...leftWords].filter((word) => rightWords.has(word)).length;
  const union = new Set([...leftWords, ...rightWords]).size;
  return union === 0 ? 0 : overlap / union;
}

function normalizeForSimilarity(value: string) {
  return value
    .toLowerCase()
    .replace(/\(signal:\s+\w+\)/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function ensureSentence(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "This is an early signal with limited confirmed impact.";
  }

  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function trimTrailingPeriod(value: string) {
  return value.trim().replace(/[.!?]+$/, "");
}

function getTimeHorizonLabel(horizon: EventIntelligence["timeHorizon"]) {
  switch (horizon) {
    case "short":
      return "next few sessions";
    case "medium":
      return "next few quarters";
    default:
      return "longer term";
  }
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function normalizeIntelligence(intelligence: EventIntelligence): NormalizedIntelligence {
  const entities = intelligence.entities?.length
    ? intelligence.entities
    : intelligence.keyEntities?.length
      ? intelligence.keyEntities
      : [intelligence.title];
  const primaryTopic = intelligence.topics?.[0] ?? "markets";
  const affectedMarkets = intelligence.affectedMarkets?.length
    ? intelligence.affectedMarkets
    : [primaryTopic];

  return {
    ...intelligence,
    entities,
    eventType: intelligence.eventType || deriveLegacyEventType(intelligence),
    primaryImpact:
      intelligence.primaryImpact ||
      `it can change expectations around ${affectedMarkets[0] ?? primaryTopic}`,
    affectedMarkets,
    timeHorizon: intelligence.timeHorizon || "medium",
    signalStrength: intelligence.signalStrength || "moderate",
    reasoningCategory: mapReasoningCategory(intelligence.eventType || deriveLegacyEventType(intelligence)),
  };
}

function mapReasoningCategory(eventType: string): NormalizedReasoningCategory {
  switch (eventType) {
    case "policy_regulation":
    case "regulation":
      return "policy_regulation";
    case "earnings_financials":
    case "earnings":
      return "earnings_financials";
    case "mna_funding":
    case "m&a":
      return "mna_funding";
    case "product_launch_major":
      return "product_launch_major";
    case "governance_politics":
      return "governance_politics";
    case "geopolitics":
    case "geopolitical":
      return "geopolitics";
    case "legal_investigation":
      return "legal_investigation";
    case "macro_market_move":
    case "macro":
      return "macro_market_move";
    default:
      return "company_update";
  }
}

function deriveLegacyEventType(intelligence: EventIntelligence) {
  const corpus = `${intelligence.title} ${intelligence.summary} ${intelligence.topics?.join(" ") ?? ""}`.toLowerCase();

  if (/earnings|guidance|revenue|profit|quarter/.test(corpus)) return "earnings_financials";
  if (/lawsuit|probe|investigation|charges|sec|doj/.test(corpus)) return "legal_investigation";
  if (/vetting|ambassador|minister|foreign office|parliament|cabinet|governance|diplomatic|diplomacy|appointment/.test(corpus)) return "governance_politics";
  if (/regulation|regulatory|policy|senate|congress|ban|antitrust/.test(corpus)) return "policy_regulation";
  if (/fed|inflation|rates|treasury|economy|macro/.test(corpus)) return "macro_market_move";
  if (/acquisition|merger|buyout|deal|takeover|funding|raises/.test(corpus)) return "mna_funding";
  if (/launch|launched|release|released|unveiled|rollout|debut/.test(corpus)) return "product_launch_major";
  if (/sanctions|war|export restrictions|geopolit/.test(corpus)) return "geopolitics";
  return "company_update";
}

export const __testing__ = {
  extractPrimaryAnchor,
  mapReasoningCategory,
  buildLowConfidenceFallback,
  getPatternKey,
  isMeaningfulAnchor,
  isLowDataScenario,
};

function getFallbackVariantIndex(intelligence: NormalizedIntelligence) {
  const seed = `${intelligence.id}:${intelligence.reasoningCategory}:${intelligence.title}`.length;
  return seed % 3;
}
