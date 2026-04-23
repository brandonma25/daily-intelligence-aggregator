import { describe, expect, it } from "vitest";

import { recommendedSources } from "@/lib/source-catalog";

describe("source catalog governance", () => {
  const activatedExpansionSourceIds = [
    "ars-technica",
    "mit-technology-review",
    "foreign-affairs",
    "the-diplomat",
    "npr-world",
    "foreign-policy",
    "guardian-world",
    "hacker-news-best",
  ];
  const failedMixedDomainSourceIds = ["brookings-research", "csis-analysis"];

  it("keeps BBC and CNBC out of the onboarding catalog", () => {
    const serialized = JSON.stringify(recommendedSources).toLowerCase();

    expect(serialized).not.toContain("bbc");
    expect(serialized).not.toContain("cnbc");
  });

  it("marks active default catalog entries explicitly", () => {
    const defaultCatalogEntries = recommendedSources.filter((source) => source.lifecycleStatus === "active_default");

    expect(defaultCatalogEntries.length).toBeGreaterThan(0);
    expect(defaultCatalogEntries.every((source) => source.mvpDefaultAllowed)).toBe(true);
    expect(
      defaultCatalogEntries
        .filter((source) => source.validationStatus !== "validated")
        .map((source) => source.id),
    ).toEqual([]);
  });

  it("does not label broken, key-gated, or manual-only sources as importable", () => {
    const importableSources = recommendedSources.filter((source) => source.importStatus === "ready");

    expect(importableSources.length).toBeGreaterThan(0);
    expect(importableSources.every((source) => Boolean(source.feedUrl))).toBe(true);
    expect(
      importableSources.every(
        (source) =>
          source.validationStatus !== "failed" &&
          source.validationStatus !== "requires_key" &&
          source.validationStatus !== "manual_only",
      ),
    ).toBe(true);
  });

  it("marks validated expansion sources as active public defaults without preference boosts", () => {
    const sourcesById = new Map(recommendedSources.map((source) => [source.id, source]));

    for (const sourceId of activatedExpansionSourceIds) {
      const source = sourcesById.get(sourceId);

      expect(source).toBeDefined();
      expect(source?.importStatus).toBe("ready");
      expect(source?.validationStatus).toBe("validated");
      expect(source?.mvpDefaultAllowed).toBe(true);
      expect(source?.editorialPreference).toBe(sourceId === "ars-technica" ? "approved" : "none");
      expect(source?.lifecycleStatus).toBe("active_default");
    }
  });

  it("keeps failed mixed-domain endpoints registered but disabled", () => {
    const sourcesById = new Map(recommendedSources.map((source) => [source.id, source]));

    for (const sourceId of failedMixedDomainSourceIds) {
      const source = sourcesById.get(sourceId);

      expect(source).toBeDefined();
      expect(source?.topicLabel).toBe("Mixed-domain");
      expect(source?.importStatus).toBe("manual");
      expect(source?.validationStatus).toBe("failed");
      expect(source?.mvpDefaultAllowed).toBe(false);
      expect(source?.lifecycleStatus).toBe("disabled");
    }
  });

  it("keeps MIT Technology Review catalog support separate from default activation metadata", () => {
    const source = recommendedSources.find((entry) => entry.id === "mit-technology-review");

    expect(source).toBeDefined();
    expect(source?.importStatus).toBe("ready");
    expect(source?.validationStatus).toBe("validated");
    expect(source?.mvpDefaultAllowed).toBe(true);
    expect(source?.editorialPreference).toBe("none");
    expect(source?.lifecycleStatus).toBe("active_default");
  });

  it("does not duplicate source feed URLs", () => {
    const feedUrls = recommendedSources.flatMap((source) => (source.feedUrl ? [source.feedUrl] : []));
    const duplicateFeedUrls = feedUrls.filter((feedUrl, index) => feedUrls.indexOf(feedUrl) !== index);

    expect(duplicateFeedUrls).toEqual([]);
    expect(recommendedSources.filter((source) => source.id === "ars-technica")).toHaveLength(1);
    expect(recommendedSources.some((source) => source.feedUrl === "https://www.theverge.com/rss/index.xml")).toBe(false);
    expect(recommendedSources.some((source) => source.id === "npr-economy")).toBe(false);
    expect(recommendedSources.filter((source) => source.id === "brookings-research")).toHaveLength(1);
    expect(recommendedSources.filter((source) => source.id === "csis-analysis")).toHaveLength(1);
    expect(recommendedSources.some((source) => source.feedUrl === "https://feeds.content.dowjones.io/public/rss/mktw_wsjonline")).toBe(false);
  });
});
