import { getHomepageCategoryLabel, type HomepageCategoryKey } from "@/lib/homepage-taxonomy";
import { firstSentence } from "@/lib/utils";

export type WhyItMattersTier = "high" | "medium" | "low";

export type WhyItMattersPresentation = {
  tier: WhyItMattersTier;
  heading: string;
  body: string;
  supportingSignals: string[];
};

export type WhyItMattersInput = {
  id?: string;
  title: string;
  topicName: string;
  summary: string;
  whyItMatters?: string;
  matchedKeywords?: string[];
  rankingSignals?: string[];
  sourceCount: number;
  importanceLabel?: "Critical" | "High" | "Watch";
  primaryCategory?: HomepageCategoryKey | null;
};

const GENERIC_PATTERNS = [
  /connect an ai key/i,
  /connect ai for analysis/i,
  /operators tracking this area should note it/i,
  /worth watching/i,
  /changes expectations/i,
  /broad update/i,
  /generic development/i,
  /notable .* development/i,
];

export function evaluateWhyItMattersTier(input: WhyItMattersInput): WhyItMattersTier {
  const cleanWhy = normalizeSentence(input.whyItMatters ?? "");
  const cleanSummary = normalizeSentence(firstSentence(input.summary, input.title));
  const keywordCount = dedupeValues(input.matchedKeywords).length;
  const rankingSignalCount = dedupeValues(input.rankingSignals).length;
  const hasSpecificWhy = Boolean(cleanWhy) && !looksGeneric(cleanWhy);
  const hasSpecificSummary = cleanSummary.length >= 36 && !looksGeneric(cleanSummary);
  const hasStrongRanking = input.importanceLabel === "Critical" || input.importanceLabel === "High";

  if (
    input.sourceCount >= 3 &&
    (hasSpecificWhy || hasSpecificSummary) &&
    (keywordCount >= 2 || rankingSignalCount > 0 || hasStrongRanking)
  ) {
    return "high";
  }

  if (input.sourceCount >= 2 || keywordCount > 0 || rankingSignalCount > 0 || Boolean(input.primaryCategory)) {
    return "medium";
  }

  return "low";
}

export function buildWhyItMattersContent(input: WhyItMattersInput): WhyItMattersPresentation {
  const tier = evaluateWhyItMattersTier(input);

  if (tier === "high") {
    return {
      tier,
      heading: "Why it matters",
      body: buildHighConfidenceBody(input),
      supportingSignals: buildSupportingSignals(input).slice(0, 2),
    };
  }

  if (tier === "medium") {
    return {
      tier,
      heading: "Why this is here",
      body: buildMediumConfidenceBody(input),
      supportingSignals: buildSupportingSignals(input).slice(0, 3),
    };
  }

  return {
    tier,
    heading: "Analysis",
    body: "Connect AI for analysis",
    supportingSignals: [],
  };
}

function buildHighConfidenceBody(input: WhyItMattersInput) {
  const summary = normalizeSentence(firstSentence(input.summary, input.title));
  const whyText = normalizeSentence(input.whyItMatters ?? "");
  const consequence = looksGeneric(whyText) ? buildConsequenceClause(input) : lowercaseFirst(whyText);
  const rankReason = buildRankingClause(input);

  return `${ensurePeriod(summary)} ${capitalizeFirst(consequence)}, and ${rankReason}.`;
}

function buildMediumConfidenceBody(input: WhyItMattersInput) {
  const categoryLabel = input.primaryCategory ? getHomepageCategoryLabel(input.primaryCategory) : input.topicName;
  const keywords = dedupeValues(input.matchedKeywords).slice(0, 3);
  const sourceLabel =
    input.sourceCount > 1 ? `${input.sourceCount} sources` : "an early source signal";
  const signalBits = [
    categoryLabel.toLowerCase(),
    keywords.length ? keywords.join(", ") : null,
    input.rankingSignals?.[0] ? simplifyRankingSignal(input.rankingSignals[0]) : null,
  ].filter((value): value is string => Boolean(value));

  return `Tracked here because ${sourceLabel} aligned around ${signalBits.slice(0, 2).join(" and ")}.`;
}

function buildConsequenceClause(input: WhyItMattersInput) {
  const normalized = `${input.title} ${input.summary} ${(input.matchedKeywords ?? []).join(" ")}`.toLowerCase();
  const variant = deterministicIndex(input, 3);

  if (/rates|inflation|fed|treasury|bond|earnings|revenue|tariff|trade|markets?/.test(normalized)) {
    return [
      "funding, pricing, and market assumptions can shift quickly",
      "rate and valuation assumptions can reset quickly",
      "capital and pricing expectations can move quickly",
    ][variant];
  }

  if (/election|senate|congress|white house|sanction|policy|regulation|cabinet|parliament|minister/.test(normalized)) {
    return [
      "policy moves can reset the operating environment quickly",
      "government action can change risk and compliance assumptions quickly",
      "regulatory and geopolitical shifts can alter planning quickly",
    ][variant];
  }

  if (/ai|chip|semiconductor|cloud|software|platform|cyber|developer|data center|device/.test(normalized)) {
    return [
      "platform and infrastructure decisions can reshape execution quickly",
      "technology shifts can change product and capacity planning quickly",
      "competitive positioning can move quickly when the stack changes",
    ][variant];
  }

  return [
    "decision-makers may need to update near-term assumptions quickly",
    "the planning impact can spread quickly once coverage converges",
    "it can change the near-term read on risk and execution",
  ][variant];
}

function buildRankingClause(input: WhyItMattersInput) {
  const rankingSignal = input.rankingSignals?.[0];

  if (rankingSignal) {
    return `${pickVariant(input, ["it ranked on", "it surfaced on", "it stayed near the top on"])} ${simplifyRankingSignal(rankingSignal)}`;
  }

  if (input.sourceCount >= 3) {
    return `${pickVariant(input, ["it ranked on", "it surfaced on", "it stayed near the top on"])} confirmation across ${input.sourceCount} sources`;
  }

  if (input.importanceLabel) {
    return `${pickVariant(input, ["it ranked on", "it surfaced on", "it stayed near the top on"])} a ${input.importanceLabel.toLowerCase()} priority signal`;
  }

  return `${pickVariant(input, ["it ranked on", "it surfaced on", "it stayed near the top on"])} topic fit and current momentum`;
}

function buildSupportingSignals(input: WhyItMattersInput) {
  const values = [
    input.primaryCategory ? getHomepageCategoryLabel(input.primaryCategory) : null,
    input.sourceCount > 1 ? `${input.sourceCount} sources` : "Single-source early signal",
    ...dedupeValues(input.matchedKeywords).slice(0, 2),
  ].filter((value): value is string => Boolean(value));

  return dedupeValues(values);
}

function simplifyRankingSignal(value: string) {
  return normalizeSentence(
    value
      .replace(/\.$/, "")
      .replace(/^covered by\s+/i, "")
      .replace(/^matched on:\s*/i, "")
      .replace(/^why this is in .*?:\s*/i, ""),
  ).toLowerCase();
}

function looksGeneric(value: string) {
  return GENERIC_PATTERNS.some((pattern) => pattern.test(value));
}

function normalizeSentence(value: string) {
  return value.replace(/\s+/g, " ").trim().replace(/[.!?]+$/, "");
}

function ensurePeriod(value: string) {
  const trimmed = value.trim();
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function dedupeValues(values: string[] | undefined) {
  const seen = new Set<string>();

  return (values ?? []).filter((value) => {
    const normalized = value.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) {
      return false;
    }

    seen.add(normalized);
    return true;
  });
}

function deterministicIndex(input: WhyItMattersInput, modulo: number) {
  const seed = `${input.id ?? ""}${input.title}${input.topicName}`;
  let total = 0;

  for (const char of seed) {
    total += char.charCodeAt(0);
  }

  return total % modulo;
}

function pickVariant(input: WhyItMattersInput, variants: string[]) {
  return variants[deterministicIndex(input, variants.length)];
}

function capitalizeFirst(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function lowercaseFirst(value: string) {
  if (!value) return value;
  return value.charAt(0).toLowerCase() + value.slice(1);
}
