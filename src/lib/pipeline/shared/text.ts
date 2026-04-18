import { createHash } from "crypto";

import { stripHtml } from "@/lib/utils";

const STOP_WORDS = new Set([
  "about",
  "after",
  "also",
  "amid",
  "and",
  "are",
  "been",
  "from",
  "have",
  "into",
  "over",
  "that",
  "their",
  "there",
  "these",
  "they",
  "this",
  "under",
  "with",
]);

export function cleanText(value: string | null | undefined) {
  return stripHtml(value ?? "")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeUrl(value: string) {
  try {
    const url = new URL(value);
    url.hash = "";
    const droppedParams = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
    droppedParams.forEach((key) => url.searchParams.delete(key));
    return url.toString().replace(/\/$/, "");
  } catch {
    return value.trim();
  }
}

export function tokenize(value: string) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

export function extractKeywords(value: string, limit = 8) {
  const counts = new Map<string, number>();

  tokenize(value).forEach((token) => {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  });

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([token]) => token);
}

export function extractEntities(value: string, limit = 6) {
  const matches =
    cleanText(value)
      .match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}|[A-Z]{2,})\b/g)
      ?.map((match) => match.trim()) ?? [];

  return [...new Set(matches)].slice(0, limit);
}

export function jaccardSimilarity(left: string[], right: string[]) {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const overlap = [...leftSet].filter((token) => rightSet.has(token)).length;
  const union = new Set([...leftSet, ...rightSet]).size;
  return union === 0 ? 0 : overlap / union;
}

export function stableId(...parts: string[]) {
  return createHash("sha1").update(parts.join("|")).digest("hex").slice(0, 12);
}

export function clipSentence(value: string, maxLength = 240) {
  const clean = cleanText(value);
  if (clean.length <= maxLength) {
    return clean;
  }

  const trimmed = clean.slice(0, maxLength);
  return `${trimmed.slice(0, trimmed.lastIndexOf(" "))}...`;
}
