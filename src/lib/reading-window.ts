import type { BriefingItem, DailyReadingMetric, ReadingWindowContext } from "@/lib/types";

export const READING_WINDOW_THRESHOLDS = {
  lightMax: 10,
  normalMax: 25,
} as const;

const READING_WINDOW_PATTERN = /(\d+)/;

export function calculateReadingWindow(items: BriefingItem[]) {
  const totalMinutes = items.reduce((sum, item) => sum + normalizeReadingMinutes(item.estimatedMinutes), 0);

  return {
    totalMinutes,
    label: formatReadingWindow(totalMinutes),
  };
}

export function buildDailyReadingMetric(date: string, totalMinutes: number): DailyReadingMetric {
  return {
    date: date.slice(0, 10),
    totalMinutes: Math.max(0, Math.round(totalMinutes)),
  };
}

export function getReadingWindowContext(
  todayMinutes: number,
  previousMetric: DailyReadingMetric | null,
): ReadingWindowContext {
  const interpretation = classifyReadingWindow(todayMinutes);

  if (!previousMetric) {
    return {
      comparisonLabel: "First briefing",
      deltaMinutes: null,
      interpretation,
    };
  }

  const deltaMinutes = todayMinutes - previousMetric.totalMinutes;
  const comparisonLabel =
    deltaMinutes === 0
      ? "No change vs yesterday"
      : `${deltaMinutes > 0 ? "+" : ""}${deltaMinutes} min vs yesterday`;

  return {
    comparisonLabel,
    deltaMinutes,
    interpretation,
  };
}

export function classifyReadingWindow(totalMinutes: number): ReadingWindowContext["interpretation"] {
  if (totalMinutes <= READING_WINDOW_THRESHOLDS.lightMax) {
    return "Light";
  }

  if (totalMinutes <= READING_WINDOW_THRESHOLDS.normalMax) {
    return "Normal";
  }

  return "Heavy";
}

export function parseReadingWindowMinutes(value: string | null | undefined) {
  if (!value) {
    return 0;
  }

  const match = value.match(READING_WINDOW_PATTERN);
  return match ? Number(match[1]) || 0 : 0;
}

export function formatReadingWindow(totalMinutes: number) {
  const minutes = Math.max(0, Math.round(totalMinutes));
  return `${minutes} min reading time today`;
}

function normalizeReadingMinutes(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}
