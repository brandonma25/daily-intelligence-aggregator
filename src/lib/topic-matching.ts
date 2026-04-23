export type TopicMatcherTopic = {
  id: string;
  name: string;
  keywords?: string[];
  excludeKeywords?: string[];
};

export type TopicMatcherArticle = {
  id: string;
  title: string;
  summaryText?: string | null;
};

export type TopicMatch = {
  topicId: string;
  matchedKeywords: string[];
  matchScore: number;
};

type KeywordEntry = {
  raw: string;
  normalized: string;
};

export function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function createKeywordEntries(values: string[] | undefined, fallback: string[] = []): KeywordEntry[] {
  const seen = new Set<string>();

  return [...(values ?? []), ...fallback]
    .map((value) => value.trim())
    .filter(Boolean)
    .map((raw) => ({ raw, normalized: normalizeText(raw) }))
    .filter((entry) => {
      if (!entry.normalized || seen.has(entry.normalized)) {
        return false;
      }
      seen.add(entry.normalized);
      return true;
    });
}

export function matchTopicToArticle(
  article: TopicMatcherArticle,
  topic: TopicMatcherTopic,
): TopicMatch | null {
  const title = normalizeText(article.title);
  const summary = normalizeText(article.summaryText ?? "");
  const combined = `${title} ${summary}`.trim();

  if (!combined) {
    return null;
  }

  const includeKeywords = createKeywordEntries(topic.keywords, [topic.name]);
  const excludeKeywords = createKeywordEntries(topic.excludeKeywords);

  if (!includeKeywords.length) {
    return null;
  }

  const hasExclude = excludeKeywords.some((keyword) => combined.includes(keyword.normalized));
  if (hasExclude) {
    return null;
  }

  const titleMatches = includeKeywords.filter((keyword) => title.includes(keyword.normalized));
  const summaryMatches = includeKeywords.filter(
    (keyword) => !titleMatches.some((match) => match.normalized === keyword.normalized) && summary.includes(keyword.normalized),
  );
  const matchedKeywords = [...titleMatches, ...summaryMatches].map((keyword) => keyword.raw);

  if (!matchedKeywords.length) {
    return null;
  }

  const matchScore = titleMatches.length * 10 + summaryMatches.length * 4 + matchedKeywords.length;

  return {
    topicId: topic.id,
    matchedKeywords,
    matchScore,
  };
}

export function matchTopicsForArticle(
  article: TopicMatcherArticle,
  topics: TopicMatcherTopic[],
): TopicMatch[] {
  return topics
    .map((topic) => matchTopicToArticle(article, topic))
    .filter((match): match is TopicMatch => Boolean(match))
    .sort((left, right) => right.matchScore - left.matchScore || left.topicId.localeCompare(right.topicId));
}

export function parseKeywordList(value: FormDataEntryValue | string | null | undefined) {
  const input = typeof value === "string" ? value : value?.toString() ?? "";
  const seen = new Set<string>();

  return input
    .split(/[\n,]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => {
      const normalized = normalizeText(part);
      if (!normalized || seen.has(normalized)) {
        return false;
      }
      seen.add(normalized);
      return true;
    });
}
