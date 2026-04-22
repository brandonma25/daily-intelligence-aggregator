import { describe, expect, it } from "vitest";

import {
  DEFAULT_DONOR_FEED_IDS,
  PROBATIONARY_RUNTIME_FEED_IDS,
  getDefaultDonorFeeds,
  getProbationaryRuntimeFeeds,
} from "@/adapters/donors";
import {
  areMvpDefaultPublicSources,
  demoSources,
  getMvpDefaultPublicSources,
  MVP_DEFAULT_PUBLIC_SOURCE_IDS,
} from "@/lib/demo-data";
import { buildRuntimeSourceResolutionSnapshot } from "@/lib/observability/pipeline-run";
import { recommendedSources } from "@/lib/source-catalog";

describe("MVP default source governance", () => {
  const guardedBatchOneSourceIds = [
    "financial-times-global-economy",
    "brookings-research",
    "csis-analysis",
  ];

  it("declares the public MVP default source set explicitly", () => {
    expect(MVP_DEFAULT_PUBLIC_SOURCE_IDS).toEqual([
      "source-verge",
      "source-ars",
      "source-mit-technology-review",
      "source-hacker-news-best",
      "source-tldr-tech",
      "source-techcrunch",
      "source-ft",
      "source-foreign-affairs",
      "source-the-diplomat",
      "source-npr-world",
      "source-foreign-policy",
      "source-guardian-world",
    ]);
    expect(getMvpDefaultPublicSources().map((source) => source.name)).toEqual([
      "The Verge",
      "Ars Technica",
      "MIT Technology Review",
      "Hacker News Best",
      "TLDR",
      "TechCrunch",
      "Financial Times",
      "Foreign Affairs",
      "The Diplomat",
      "NPR World",
      "Foreign Policy",
      "The Guardian World",
    ]);
  });

  it("does not treat later demo/catalog entries as default public ingestion", () => {
    const defaultSourceIds = new Set(getMvpDefaultPublicSources().map((source) => source.id));
    const nonDefaultDemoSources = demoSources.filter((source) => !defaultSourceIds.has(source.id));

    expect(nonDefaultDemoSources.map((source) => source.name)).toEqual(
      expect.arrayContaining(["MarketWatch", "ZeroHedge", "AP Top News", "Brookings Research", "CSIS Analysis"]),
    );
    expect(areMvpDefaultPublicSources(demoSources)).toBe(false);
    expect(
      recommendedSources
        .filter((source) => source.lifecycleStatus === "active_default")
        .map((source) => source.id),
    ).toEqual(
      expect.arrayContaining([
        "ars-technica",
        "mit-technology-review",
        "foreign-affairs",
        "the-diplomat",
        "npr-world",
        "foreign-policy",
        "guardian-world",
        "hacker-news-best",
      ]),
    );
  });

  it("declares the donor fallback defaults explicitly", () => {
    expect(DEFAULT_DONOR_FEED_IDS).toEqual([
      "openclaw-the-verge",
      "openclaw-ars-technica",
      "foreign-affairs",
      "the-diplomat",
      "npr-world",
      "foreign-policy",
      "guardian-world",
      "hacker-news-best",
      "horizon-reuters-world",
      "horizon-reuters-business",
    ]);
    expect(getDefaultDonorFeeds().map((source) => source.id)).toEqual([...DEFAULT_DONOR_FEED_IDS]);
  });

  it("declares the probationary runtime activation set explicitly", () => {
    expect(PROBATIONARY_RUNTIME_FEED_IDS).toEqual(["mit-technology-review"]);
    expect(getProbationaryRuntimeFeeds().map((source) => source.id)).toEqual(["mit-technology-review"]);
    expect(getProbationaryRuntimeFeeds().map((source) => source.availability)).toEqual(["probationary"]);
    expect(getProbationaryRuntimeFeeds().map((source) => source.source)).toEqual(["MIT Technology Review"]);
  });

  it("builds a safe no-argument runtime source resolution snapshot", () => {
    const snapshot = buildRuntimeSourceResolutionSnapshot({
      resolutionMode: "no_argument_runtime",
      resolvedSources: [
        ...getDefaultDonorFeeds(),
        ...getProbationaryRuntimeFeeds(),
      ].map((feed) => ({
        sourceId: feed.id,
        donor: feed.donor,
        source: feed.source,
        homepageUrl: feed.homepageUrl,
        topic: feed.topic,
        credibility: feed.credibility,
        reliability: feed.reliability,
        sourceClass: feed.sourceClass,
        trustTier: feed.trustTier,
        provenance: feed.provenance,
        status: feed.status,
        availability: feed.availability,
        fetch: feed.fetch,
        adapterOwner: feed.donor,
      })),
    });

    expect(snapshot).toEqual({
      resolution_mode: "no_argument_runtime",
      mvp_default_public_source_ids: [...MVP_DEFAULT_PUBLIC_SOURCE_IDS],
      donor_fallback_default_ids: [...DEFAULT_DONOR_FEED_IDS],
      probationary_runtime_source_ids: ["mit-technology-review"],
      resolved_runtime_source_ids: [
        "openclaw-the-verge",
        "openclaw-ars-technica",
        "foreign-affairs",
        "the-diplomat",
        "npr-world",
        "foreign-policy",
        "guardian-world",
        "hacker-news-best",
        "horizon-reuters-world",
        "horizon-reuters-business",
        "mit-technology-review",
      ],
      resolved_default_donor_source_ids: [...DEFAULT_DONOR_FEED_IDS],
      resolved_probationary_source_ids: ["mit-technology-review"],
      resolved_other_source_ids: [],
    });
  });

  it("does not activate other onboarded sources through the probationary path", () => {
    const probationaryRuntimeSourceIds = new Set(PROBATIONARY_RUNTIME_FEED_IDS);

    for (const sourceId of guardedBatchOneSourceIds) {
      expect(probationaryRuntimeSourceIds.has(sourceId)).toBe(false);
    }
    expect(probationaryRuntimeSourceIds.has("bbc")).toBe(false);
    expect(probationaryRuntimeSourceIds.has("cnbc")).toBe(false);
  });
});
