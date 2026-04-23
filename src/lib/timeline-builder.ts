import { format } from "date-fns";

import type { TimelineEntry, TimelineGroup } from "@/lib/types";
import { firstSentence } from "@/lib/utils";

type TimelineSource = {
  title: string;
  url?: string;
  sourceName: string;
  summaryText?: string | null;
  publishedAt?: string | null;
};

export function buildTimelineGroups(items: TimelineSource[]): TimelineGroup[] {
  const deduped = dedupeTimelineItems(items);

  const sorted = deduped.sort((left, right) => {
    const leftTime = left.publishedAt ? new Date(left.publishedAt).getTime() : Number.POSITIVE_INFINITY;
    const rightTime = right.publishedAt ? new Date(right.publishedAt).getTime() : Number.POSITIVE_INFINITY;
    return leftTime - rightTime;
  });

  const groups = new Map<string, TimelineEntry[]>();
  const labels = new Map<string, string>();

  for (const item of sorted) {
    const { dateKey, dateLabel } = buildDateParts(item.publishedAt);
    const bucket = groups.get(dateKey) ?? [];
    bucket.push({
      title: item.title,
      summary: firstSentence(item.summaryText ?? "", item.title),
      source: item.sourceName,
      publishedAt: item.publishedAt ?? undefined,
      url: item.url,
    });
    groups.set(dateKey, bucket);
    labels.set(dateKey, dateLabel);
  }

  return [...groups.entries()].map(([dateKey, entries]) => ({
    dateKey,
    dateLabel: labels.get(dateKey) ?? "Undated",
    entries,
  }));
}

function dedupeTimelineItems(items: TimelineSource[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = item.url?.trim()
      ? `url:${item.url.trim()}`
      : `fallback:${item.title.trim().toLowerCase()}|${item.sourceName.trim().toLowerCase()}|${item.publishedAt ?? ""}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function buildDateParts(value?: string | null) {
  if (!value) {
    return {
      dateKey: "undated",
      dateLabel: "Undated",
    };
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return {
      dateKey: "undated",
      dateLabel: "Undated",
    };
  }

  return {
    dateKey: format(parsed, "yyyy-MM-dd"),
    dateLabel: format(parsed, "MMM d"),
  };
}
