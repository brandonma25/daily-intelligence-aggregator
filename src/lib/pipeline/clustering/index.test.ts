import { describe, expect, it } from "vitest";

import type { RawItem } from "@/lib/models/raw-item";
import { clusterNormalizedArticles } from "@/lib/pipeline/clustering";
import { normalizeRawItems } from "@/lib/pipeline/normalization";

function clusterRawItems(items: RawItem[]) {
  return clusterNormalizedArticles(normalizeRawItems(items));
}

describe("clusterNormalizedArticles", () => {
  it("clusters near-identical event coverage together", () => {
    const clusters = clusterRawItems([
      {
        id: "a1",
        source: "Reuters World",
        title: "Chip export controls tighten as U.S. expands AI hardware restrictions",
        url: "https://example.com/a1",
        published_at: "2026-04-18T07:10:00.000Z",
        raw_content: "U.S. officials widened export controls on advanced AI chips, prompting suppliers and cloud providers to reassess shipments.",
      },
      {
        id: "a2",
        source: "Ars Technica",
        title: "AI chip suppliers adjust plans after fresh export restrictions",
        url: "https://example.com/a2",
        published_at: "2026-04-18T07:35:00.000Z",
        raw_content: "Chipmakers and hyperscalers are adjusting procurement plans after a tighter export regime for advanced accelerators.",
      },
    ]);

    expect(clusters).toHaveLength(1);
    expect(clusters[0]?.cluster_size).toBe(2);
    expect(clusters[0]?.cluster_debug.merge_decisions.some((decision) => decision.decision === "merged")).toBe(true);
  });

  it("does not merge clearly different stories on the same broad topic", () => {
    const clusters = clusterRawItems([
      {
        id: "b1",
        source: "Reuters Business",
        title: "Fed officials signal rates may stay higher as inflation cools unevenly",
        url: "https://example.com/b1",
        published_at: "2026-04-18T06:20:00.000Z",
        raw_content: "Federal Reserve officials said rates may need to stay restrictive longer because inflation is easing unevenly.",
      },
      {
        id: "b2",
        source: "MarketWatch",
        title: "Trade review puts EV battery supply chain costs back in focus",
        url: "https://example.com/b2",
        published_at: "2026-04-18T06:40:00.000Z",
        raw_content: "Automotive investors are watching a tariff review that could raise costs for EV batteries and imported components.",
      },
    ]);

    expect(clusters).toHaveLength(2);
    expect(clusters.every((cluster) => cluster.cluster_size === 1)).toBe(true);
  });

  it("does not merge same-entity but different events automatically", () => {
    const clusters = clusterRawItems([
      {
        id: "c1",
        source: "Reuters World",
        title: "Apple unveils a lower-cost Vision headset for enterprise pilots",
        url: "https://example.com/c1",
        published_at: "2026-04-18T08:00:00.000Z",
        raw_content: "Apple introduced a lower-cost Vision headset for enterprise pilots and warehouse training workflows.",
      },
      {
        id: "c2",
        source: "Associated Press",
        title: "Apple faces a new antitrust hearing over App Store payment rules",
        url: "https://example.com/c2",
        published_at: "2026-04-18T08:45:00.000Z",
        raw_content: "Apple executives are set to appear at a new antitrust hearing focused on App Store payment restrictions.",
      },
    ]);

    expect(clusters).toHaveLength(2);
    const preventedReasons = clusters.flatMap((cluster) =>
      cluster.cluster_debug.merge_decisions
        .filter((decision) => decision.decision === "prevented")
        .flatMap((decision) => decision.reasons),
    );

    expect(preventedReasons.some((reason) => reason.includes("same entity") || reason.includes("generic"))).toBe(true);
  });

  it("selects a stable representative article with an inspectable reason", () => {
    const items: RawItem[] = [
      {
        id: "d1",
        source: "Reuters World",
        title: "OpenAI delays GPT-6 release after an internal safety review",
        url: "https://example.com/d1",
        published_at: "2026-04-18T08:00:00.000Z",
        raw_content: "OpenAI delayed the GPT-6 launch after internal safety review checkpoints expanded.",
      },
      {
        id: "d2",
        source: "The Verge",
        title: "Safety review pushes back OpenAI GPT-6 launch timeline",
        url: "https://example.com/d2",
        published_at: "2026-04-18T08:15:00.000Z",
        raw_content: "OpenAI pushed back the GPT-6 launch timeline while safety teams finished broader review work.",
      },
      {
        id: "d3",
        source: "Ars Technica",
        title: "OpenAI says GPT-6 launch is delayed by expanded safety checks",
        url: "https://example.com/d3",
        published_at: "2026-04-18T08:20:00.000Z",
        raw_content: "Expanded safety checks have delayed the GPT-6 launch, according to OpenAI leadership.",
      },
    ];

    const firstRun = clusterRawItems(items);
    const secondRun = clusterRawItems(items);

    expect(firstRun).toHaveLength(1);
    expect(firstRun[0]?.representative_article.id).toBe(secondRun[0]?.representative_article.id);
    expect(firstRun[0]?.cluster_debug.representative_selection_reason).toContain("Selected article");
    expect(firstRun[0]?.cluster_debug.representative_scores.length).toBe(3);
  });
});
