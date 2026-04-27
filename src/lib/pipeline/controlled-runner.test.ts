import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ControlledPipelineConfig } from "@/lib/pipeline/controlled-execution";

const generateDailyBriefing = vi.fn();
const persistSignalPostsForBriefing = vi.fn();

vi.mock("@/lib/data", () => ({
  generateDailyBriefing,
}));

vi.mock("@/lib/signals-editorial", () => ({
  persistSignalPostsForBriefing,
}));

function buildConfig(overrides: Partial<ControlledPipelineConfig> = {}): ControlledPipelineConfig {
  return {
    mode: "dry_run",
    briefingDateOverride: null,
    testRunId: "controlled-test",
    targetEnvironment: "local",
    allowProductionPipelineTest: false,
    cronDisabledConfirmed: false,
    artifactDir: ".pipeline-runs",
    ...overrides,
  };
}

function buildItem(index: number) {
  const whyItMatters =
    index === 1
      ? "This changes how investors price rates, demand, or risk in rates and equities over"
      : "Anthropic's growth is now structurally tied to Google and Amazon's infrastructure, not independent of it. At scale, that's a dependency, not just a partnership.";

  return {
    id: `item-${index}`,
    topicId: "topic-tech",
    topicName: "Tech",
    title: `Generated signal ${index}`,
    whatHappened: `Generated summary ${index}`,
    keyPoints: [`Point ${index}`],
    whyItMatters,
    aiWhyItMatters: whyItMatters,
    sources: [{ title: "Source", url: `https://example.com/${index}` }],
    sourceCount: 1,
    estimatedMinutes: 4,
    read: false,
    priority: "normal" as const,
    matchedKeywords: ["tech"],
    importanceScore: 80 - index,
    rankingSignals: [`Ranking signal ${index}`],
  };
}

describe("runControlledPipeline", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    const items = Array.from({ length: 6 }, (_, index) => buildItem(index + 1));
    generateDailyBriefing.mockResolvedValue({
      briefing: {
        id: "briefing-test",
        briefingDate: "2026-04-27T12:00:00.000Z",
        title: "Daily Executive Briefing",
        intro: "Controlled test briefing.",
        readingWindow: "20 minutes",
        items: items.slice(0, 5),
      },
      publicRankedItems: items,
      pipelineRun: {
        run_id: "pipeline-test",
        num_clusters: 6,
      },
    });
    persistSignalPostsForBriefing.mockResolvedValue({
      ok: true,
      briefingDate: "2026-04-28",
      insertedCount: 5,
      insertedPostIds: ["row-1", "row-2", "row-3", "row-4", "row-5"],
      mode: "draft_only",
      message: "Persisted a new daily Top 5 snapshot for editorial review.",
    });
  });

  it("dry_run generates a validation report without writing signal_posts", async () => {
    const { runControlledPipeline } = await import("@/lib/pipeline/controlled-runner");
    const report = await runControlledPipeline(buildConfig({ mode: "dry_run" }));

    expect(generateDailyBriefing).toHaveBeenCalledWith(
      undefined,
      undefined,
      { persistPipelineCandidates: false },
    );
    expect(persistSignalPostsForBriefing).not.toHaveBeenCalled();
    expect(report.persistence).toBeNull();
    expect(report.proposedTopFive[0]).toMatchObject({
      validationStatus: "requires_human_rewrite",
      validationFailures: expect.arrayContaining(["template_placeholder_language"]),
    });
  });

  it("draft_only writes only review candidates for the override briefing date", async () => {
    const { runControlledPipeline } = await import("@/lib/pipeline/controlled-runner");
    const report = await runControlledPipeline(buildConfig({
      mode: "draft_only",
      briefingDateOverride: "2026-04-28",
      testRunId: "draft-test",
    }));

    expect(persistSignalPostsForBriefing).toHaveBeenCalledWith({
      briefingDate: "2026-04-28",
      items: expect.arrayContaining([
        expect.objectContaining({ id: "item-1" }),
      ]),
      mode: "draft_only",
    });
    expect(report.generatedBriefingDate).toBe("2026-04-28");
    expect(report.persistence).toMatchObject({
      ok: true,
      insertedCount: 5,
      insertedPostIds: ["row-1", "row-2", "row-3", "row-4", "row-5"],
      mode: "draft_only",
    });
  });

  it("refuses normal mode from the controlled test runner", async () => {
    const { runControlledPipeline } = await import("@/lib/pipeline/controlled-runner");

    await expect(runControlledPipeline(buildConfig({ mode: "normal", testRunId: null }))).rejects.toThrow(
      /limited to dry_run and draft_only/i,
    );
  });
});
