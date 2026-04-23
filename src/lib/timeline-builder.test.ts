import { describe, expect, it } from "vitest";

import { buildTimelineGroups } from "@/lib/timeline-builder";

describe("buildTimelineGroups", () => {
  it("sorts entries oldest to newest and groups them by date", () => {
    const groups = buildTimelineGroups([
      {
        title: "Third update",
        sourceName: "Reuters",
        summaryText: "Third summary",
        publishedAt: "2026-04-11T09:00:00.000Z",
        url: "https://example.com/3",
      },
      {
        title: "First update",
        sourceName: "AP",
        summaryText: "First summary",
        publishedAt: "2026-04-10T08:00:00.000Z",
        url: "https://example.com/1",
      },
      {
        title: "Second update",
        sourceName: "Bloomberg",
        summaryText: "Second summary",
        publishedAt: "2026-04-10T12:00:00.000Z",
        url: "https://example.com/2",
      },
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0]?.dateKey).toBe("2026-04-10");
    expect(groups[0]?.entries.map((entry) => entry.title)).toEqual(["First update", "Second update"]);
    expect(groups[1]?.dateKey).toBe("2026-04-11");
  });

  it("removes duplicate entries and handles missing timestamps", () => {
    const groups = buildTimelineGroups([
      {
        title: "Only update",
        sourceName: "Reuters",
        summaryText: "Only summary",
        publishedAt: null,
        url: "https://example.com/1",
      },
      {
        title: "Only update",
        sourceName: "Reuters",
        summaryText: "Only summary",
        publishedAt: null,
        url: "https://example.com/1",
      },
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.dateLabel).toBe("Undated");
    expect(groups[0]?.entries).toHaveLength(1);
  });
});
