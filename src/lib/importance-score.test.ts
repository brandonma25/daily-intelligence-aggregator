import { describe, expect, it } from "vitest";

import {
  buildImportanceClassifierInput,
  classifyArticleImportance,
} from "@/lib/importance-classifier";
import {
  compareImportanceScores,
  computeImportanceScore,
  getSignalLabel,
} from "@/lib/importance-score";
import type { FeedArticle } from "@/lib/rss";

function createArticle(overrides: Partial<FeedArticle>): FeedArticle {
  return {
    title: overrides.title ?? "Default title",
    url: overrides.url ?? "https://example.com/story",
    summaryText: overrides.summaryText ?? "Default summary",
    contentText: overrides.contentText,
    sourceName: overrides.sourceName ?? "Reuters",
    publishedAt: overrides.publishedAt ?? "2026-04-17T07:00:00.000Z",
  };
}

describe("importance scoring", () => {
  it("scores a clearly high-signal article near the top of the scale", () => {
    const article = createArticle({
      title: "Federal Reserve launches emergency response after inflation shock",
      summaryText: "Reuters reports the Fed outlined a rapid central bank response after a macro shock.",
      url: "https://www.reuters.com/world/us/fed-response",
      sourceName: "Reuters",
    });

    const result = computeImportanceScore(
      classifyArticleImportance(buildImportanceClassifierInput(article)),
    );

    expect(result.score).toBeGreaterThanOrEqual(15);
    expect(result.signalLabel).toBe("High Signal");
    expect(result.eventType).toBe("central-bank");
  });

  it("scores a medium-signal article in the middle bucket", () => {
    const article = createArticle({
      title: "Intel expands enterprise AI rollout with new partners",
      summaryText: "CNBC says Intel is widening an enterprise rollout after a partner update.",
      url: "https://www.cnbc.com/2026/04/17/intel-rollout.html",
      sourceName: "CNBC",
    });

    const result = computeImportanceScore(
      classifyArticleImportance(buildImportanceClassifierInput(article)),
    );

    expect(result.score).toBeGreaterThanOrEqual(8);
    expect(result.score).toBeLessThan(13);
    expect(result.signalLabel).toBe("Medium Signal");
  });

  it("scores a low-signal commentary article in the low bucket", () => {
    const article = createArticle({
      title: "Opinion: startup roadmap could get more interesting",
      summaryText: "A small blog commentary revisits product plans without a material new event.",
      url: "https://unknown.example.com/opinion",
      sourceName: "Unknown Blog",
    });

    const result = computeImportanceScore(
      classifyArticleImportance(buildImportanceClassifierInput(article)),
    );

    expect(result.score).toBeLessThan(8);
    expect(result.signalLabel).toBe("Low Signal");
  });

  it("uses safe defaults for unknown sources and sparse metadata", () => {
    const article = createArticle({
      title: "Update posted",
      summaryText: "",
      publishedAt: "",
      url: "notaurl",
      sourceName: "Mystery Wire",
    });

    const result = computeImportanceScore(
      classifyArticleImportance(buildImportanceClassifierInput(article)),
    );

    expect(result.score).toBeGreaterThanOrEqual(3);
    expect(result.sourceTier).toBe("tier3");
  });

  it("orders higher importance scores first and breaks ties by freshness", () => {
    const ordered = [
      {
        importanceScore: 8,
        publishedAt: "2026-04-17T05:00:00.000Z",
      },
      {
        importanceScore: 13,
        publishedAt: "2026-04-17T04:00:00.000Z",
      },
      {
        importanceScore: 13,
        publishedAt: "2026-04-17T06:00:00.000Z",
      },
    ].sort(compareImportanceScores);

    expect(ordered).toEqual([
      {
        importanceScore: 13,
        publishedAt: "2026-04-17T06:00:00.000Z",
      },
      {
        importanceScore: 13,
        publishedAt: "2026-04-17T04:00:00.000Z",
      },
      {
        importanceScore: 8,
        publishedAt: "2026-04-17T05:00:00.000Z",
      },
    ]);
  });

  it("maps score ranges to the expected UI labels", () => {
    expect(getSignalLabel(15)).toBe("High Signal");
    expect(getSignalLabel(9)).toBe("Medium Signal");
    expect(getSignalLabel(3)).toBe("Low Signal");
  });
});
