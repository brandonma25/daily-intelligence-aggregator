import type { FeedArticle } from "@/lib/rss";
import type { Source } from "@/lib/types";

export type ImportanceTier = "tier1" | "tier2" | "tier3";

export type ImportanceClassification = {
  entityTags: string[];
  entityTier: ImportanceTier;
  entityWeight: number;
  eventType: string;
  eventTypeWeight: number;
  sourceTier: ImportanceTier;
  sourceWeight: number;
  recencyWeight: number;
};

type ArticleImportanceInput = Pick<FeedArticle, "title" | "summaryText" | "publishedAt" | "url" | "sourceName"> & {
  homepageUrl?: string;
};

const ENTITY_TIERS = {
  tier1: [
    "Federal Reserve",
    "White House",
    "U.S. Treasury",
    "SEC",
    "DOJ",
    "Congress",
    "Supreme Court",
    "European Union",
    "European Commission",
    "ECB",
    "NATO",
    "IMF",
    "World Bank",
    "China",
    "Russia",
    "Ukraine",
    "Taiwan",
    "Nvidia",
    "Microsoft",
    "Apple",
    "Amazon",
    "Google",
    "Alphabet",
    "Meta",
    "Tesla",
    "TSMC",
    "OpenAI",
    "OPEC",
  ],
  tier2: [
    "Intel",
    "AMD",
    "Qualcomm",
    "Broadcom",
    "Palantir",
    "Oracle",
    "Salesforce",
    "Uber",
    "Airbnb",
    "Stripe",
    "Anthropic",
    "Mistral",
    "Bank of England",
    "Bank of Japan",
    "People's Bank of China",
    "EU",
    "UK",
    "Japan",
    "India",
    "Saudi Arabia",
  ],
} as const;

const SOURCE_TIERS: Record<ImportanceTier, string[]> = {
  tier1: [
    "reuters.com",
    "bloomberg.com",
    "apnews.com",
    "ft.com",
    "wsj.com",
    "nytimes.com",
    "federalreserve.gov",
    "ecb.europa.eu",
    "sec.gov",
    "justice.gov",
  ],
  tier2: [
    "cnbc.com",
    "theinformation.com",
    "techcrunch.com",
    "theverge.com",
    "axios.com",
    "politico.com",
    "semafor.com",
    "marketwatch.com",
    "cnn.com",
    "bbc.com",
  ],
  tier3: [],
};

const EVENT_TYPE_RULES: Array<{ eventType: string; weight: number; keywords: string[] }> = [
  {
    eventType: "war-or-crisis",
    weight: 5,
    keywords: ["war", "crisis", "attack", "missile", "military", "conflict", "invasion"],
  },
  {
    eventType: "regulation",
    weight: 5,
    keywords: ["regulation", "regulatory", "antitrust", "sanctions", "ban", "lawsuit", "legal action", "probe", "investigation"],
  },
  {
    eventType: "central-bank",
    weight: 5,
    keywords: ["federal reserve", "fed", "ecb", "bank of england", "bank of japan", "interest rates", "rate cut", "rate hike"],
  },
  {
    eventType: "election-or-policy",
    weight: 5,
    keywords: ["election", "vote", "white house", "congress", "senate", "executive order", "policy"],
  },
  {
    eventType: "macro-shock",
    weight: 5,
    keywords: ["inflation", "cpi", "jobs report", "gdp", "recession", "tariff", "trade war"],
  },
  {
    eventType: "earnings",
    weight: 4,
    keywords: ["earnings", "revenue", "profit", "guidance", "quarterly results"],
  },
  {
    eventType: "major-corporate-move",
    weight: 4,
    keywords: ["merger", "acquisition", "buyout", "layoffs", "funding", "raises", "product launch", "launches", "partnership"],
  },
  {
    eventType: "company-update",
    weight: 3,
    keywords: ["expands", "hires", "roadmap", "rollout", "forecast", "outlook"],
  },
  {
    eventType: "commentary",
    weight: 1,
    keywords: ["opinion", "analysis", "commentary", "interview", "feature", "review", "preview"],
  },
];

export function classifyArticleImportance(
  article: ArticleImportanceInput,
): ImportanceClassification {
  const entityMatch = classifyEntitySignal(article);
  const eventMatch = classifyEventType(article);
  const sourceTier = classifySourceTier(article);

  return {
    entityTags: entityMatch.tags,
    entityTier: entityMatch.tier,
    entityWeight: getTierWeight(entityMatch.tier, 5, 3, 1),
    eventType: eventMatch.eventType,
    eventTypeWeight: eventMatch.weight,
    sourceTier,
    sourceWeight: getTierWeight(sourceTier, 5, 3, 1),
    recencyWeight: getRecencyWeight(article.publishedAt),
  };
}

export function buildImportanceClassifierInput(
  article: FeedArticle,
  source?: Pick<Source, "homepageUrl">,
): ArticleImportanceInput {
  return {
    ...article,
    homepageUrl: source?.homepageUrl,
  };
}

export function getRecencyWeight(publishedAt: string | null | undefined, now = Date.now()) {
  const timestamp = publishedAt ? new Date(publishedAt).getTime() : Number.NaN;
  if (!Number.isFinite(timestamp)) {
    return 0;
  }

  const ageHours = Math.max(0, (now - timestamp) / (1000 * 60 * 60));
  if (ageHours <= 6) return 2;
  if (ageHours <= 24) return 1;
  return 0;
}

function classifyEntitySignal(article: ArticleImportanceInput) {
  const corpus = `${article.title} ${article.summaryText}`;
  const tier1Tags = ENTITY_TIERS.tier1.filter((entity) => includesNormalized(corpus, entity));
  if (tier1Tags.length) {
    return { tier: "tier1" as const, tags: tier1Tags.slice(0, 4) };
  }

  const tier2Tags = ENTITY_TIERS.tier2.filter((entity) => includesNormalized(corpus, entity));
  if (tier2Tags.length) {
    return { tier: "tier2" as const, tags: tier2Tags.slice(0, 4) };
  }

  const genericTags = extractGenericEntities(corpus);
  if (genericTags.length) {
    return { tier: "tier3" as const, tags: genericTags.slice(0, 4) };
  }

  return { tier: "tier3" as const, tags: [] };
}

function classifyEventType(article: ArticleImportanceInput) {
  const corpus = normalizeText(`${article.title} ${article.summaryText}`);
  const matchedRule = EVENT_TYPE_RULES.find((rule) =>
    rule.keywords.some((keyword) => includesNormalized(corpus, keyword)),
  );

  return matchedRule ?? { eventType: "minor-update", weight: 1, keywords: [] };
}

function classifySourceTier(article: ArticleImportanceInput): ImportanceTier {
  const domain = getDomain(article.homepageUrl ?? article.url);

  if (matchesSourceTier(domain, article.sourceName, SOURCE_TIERS.tier1)) {
    return "tier1";
  }

  if (matchesSourceTier(domain, article.sourceName, SOURCE_TIERS.tier2)) {
    return "tier2";
  }

  return "tier3";
}

function extractGenericEntities(value: string) {
  const matches = value.match(/\b(?:[A-Z]{2,}|[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/g) ?? [];

  return [...new Set(matches.map((match) => match.trim()).filter(isGenericEntityCandidate))];
}

function isGenericEntityCandidate(value: string) {
  return value.length >= 3 && !["The", "And", "For", "With", "Today"].includes(value);
}

function includesNormalized(corpus: string, entity: string) {
  const normalizedCorpus = ` ${normalizeText(corpus)} `;
  const normalizedEntity = normalizeText(entity)
    .trim()
    .replace(/\s+/g, "\\s+");

  return new RegExp(`\\b${normalizedEntity}\\b`, "i").test(normalizedCorpus);
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
}

function getDomain(value: string | undefined) {
  if (!value) {
    return "";
  }

  try {
    return new URL(value).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function matchesSourceTier(domain: string, sourceName: string, domains: string[]) {
  return domains.some((candidate) => {
    const normalizedSourceName = sourceName.toLowerCase();
    return domain === candidate || normalizedSourceName.includes(candidate.split(".")[0] ?? "");
  });
}

function getTierWeight(tier: ImportanceTier, tier1Weight: number, tier2Weight: number, tier3Weight: number) {
  switch (tier) {
    case "tier1":
      return tier1Weight;
    case "tier2":
      return tier2Weight;
    case "tier3":
      return tier3Weight;
  }
}
