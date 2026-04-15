import { describe, expect, it } from "vitest";

import {
  buildDailyReadingMetric,
  calculateReadingWindow,
  classifyReadingWindow,
  formatReadingWindow,
  getReadingWindowContext,
  parseReadingWindowMinutes,
} from "@/lib/reading-window";
import type { BriefingItem } from "@/lib/types";

function createItem(overrides: Partial<BriefingItem> = {}): BriefingItem {
  return {
    id: overrides.id ?? "item-1",
    topicId: overrides.topicId ?? "topic-1",
    topicName: overrides.topicName ?? "Finance",
    title: overrides.title ?? "Fed signals rates will stay elevated",
    whatHappened: overrides.whatHappened ?? "Markets are repricing.",
    keyPoints: overrides.keyPoints ?? ["Point one", "Point two", "Point three"],
    whyItMatters: overrides.whyItMatters ?? "It matters.",
    sources: overrides.sources ?? [{ title: "Reuters", url: "https://example.com/story" }],
    estimatedMinutes: overrides.estimatedMinutes ?? 4,
    read: overrides.read ?? false,
    priority: overrides.priority ?? "normal",
  };
}

describe("reading window helpers", () => {
  it("aggregates event reading time into a dashboard reading window", () => {
    const readingWindow = calculateReadingWindow([
      createItem({ estimatedMinutes: 5 }),
      createItem({ id: "item-2", estimatedMinutes: 7 }),
    ]);

    expect(readingWindow.totalMinutes).toBe(12);
    expect(readingWindow.label).toBe("12 min reading time today");
  });

  it("parses saved reading window strings safely", () => {
    expect(parseReadingWindowMinutes("18 min reading time today")).toBe(18);
    expect(parseReadingWindowMinutes("0 min reading time today")).toBe(0);
    expect(parseReadingWindowMinutes(null)).toBe(0);
  });

  it("returns first-briefing context when no prior metric exists", () => {
    expect(getReadingWindowContext(18, null)).toEqual({
      comparisonLabel: "First briefing",
      deltaMinutes: null,
      interpretation: "Normal",
    });
  });

  it("returns a signed delta against yesterday when prior data exists", () => {
    const previous = buildDailyReadingMetric("2026-04-14", 12);

    expect(getReadingWindowContext(18, previous)).toEqual({
      comparisonLabel: "+6 min vs yesterday",
      deltaMinutes: 6,
      interpretation: "Normal",
    });
  });

  it("classifies reading load consistently", () => {
    expect(classifyReadingWindow(6)).toBe("Light");
    expect(classifyReadingWindow(18)).toBe("Normal");
    expect(classifyReadingWindow(32)).toBe("Heavy");
  });

  it("formats the reading window label consistently", () => {
    expect(formatReadingWindow(0)).toBe("0 min reading time today");
    expect(formatReadingWindow(18)).toBe("18 min reading time today");
  });
});
