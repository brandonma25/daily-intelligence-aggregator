import { describe, expect, it } from "vitest";

import {
  assertControlledPipelineCanExecute,
  buildControlledPipelineReport,
  resolveControlledPipelineConfig,
  type ControlledPipelineConfig,
} from "@/lib/pipeline/controlled-execution";
import type { DailyBriefing } from "@/lib/types";

function buildConfig(overrides: Partial<ControlledPipelineConfig> = {}): ControlledPipelineConfig {
  return {
    mode: "dry_run",
    briefingDateOverride: null,
    testRunId: null,
    targetEnvironment: "local",
    allowProductionPipelineTest: false,
    cronDisabledConfirmed: false,
    artifactDir: ".pipeline-runs",
    ...overrides,
  };
}

function buildBriefing(): DailyBriefing {
  return {
    id: "briefing-test",
    briefingDate: "2026-04-27T12:00:00.000Z",
    title: "Daily Executive Briefing",
    intro: "Controlled test briefing.",
    readingWindow: "10 minutes",
    items: [],
  };
}

function buildItem(index: number, whyItMatters: string) {
  return {
    id: `candidate-${index}`,
    topicId: "topic-tech",
    topicName: "Tech",
    title: `Candidate ${index}`,
    whatHappened: `Candidate ${index} summary`,
    keyPoints: [`Candidate ${index} point`],
    whyItMatters,
    aiWhyItMatters: whyItMatters,
    sources: [{ title: "Source", url: `https://example.com/${index}` }],
    sourceCount: 1,
    estimatedMinutes: 4,
    read: false,
    priority: "normal" as const,
    matchedKeywords: ["tech"],
    importanceScore: 70 - index,
    rankingSignals: [`Ranking signal ${index}`],
  };
}

describe("controlled pipeline execution config", () => {
  it("resolves dry_run as a write-safe run mode", () => {
    const config = resolveControlledPipelineConfig({
      PIPELINE_RUN_MODE: "dry_run",
    } as NodeJS.ProcessEnv);

    expect(config.mode).toBe("dry_run");
    expect(config.targetEnvironment).toBe("local");
    expect(() => assertControlledPipelineCanExecute(config)).not.toThrow();
  });

  it("refuses production draft_only runs without explicit safety guards", () => {
    const config = buildConfig({
      mode: "draft_only",
      briefingDateOverride: "2026-04-27",
      testRunId: "controlled-test",
      targetEnvironment: "production",
    });

    expect(() => assertControlledPipelineCanExecute(config)).toThrow(/ALLOW_PRODUCTION_PIPELINE_TEST/);
  });

  it("requires a briefing date, test run id, and cron-disabled confirmation for production draft_only", () => {
    const missingDate = buildConfig({
      mode: "draft_only",
      testRunId: "controlled-test",
      targetEnvironment: "production",
      allowProductionPipelineTest: true,
      cronDisabledConfirmed: true,
    });
    const missingRunId = buildConfig({
      mode: "draft_only",
      briefingDateOverride: "2026-04-27",
      targetEnvironment: "production",
      allowProductionPipelineTest: true,
      cronDisabledConfirmed: true,
    });
    const missingCronConfirmation = buildConfig({
      mode: "draft_only",
      briefingDateOverride: "2026-04-27",
      testRunId: "controlled-test",
      targetEnvironment: "production",
      allowProductionPipelineTest: true,
      cronDisabledConfirmed: false,
    });

    expect(() => assertControlledPipelineCanExecute(missingDate)).toThrow(/BRIEFING_DATE_OVERRIDE/);
    expect(() => assertControlledPipelineCanExecute(missingRunId)).toThrow(/PIPELINE_TEST_RUN_ID/);
    expect(() => assertControlledPipelineCanExecute(missingCronConfirmation)).toThrow(/PIPELINE_CRON_DISABLED_CONFIRMED/);
  });

  it("allows production draft_only only when every safety guard is present", () => {
    const config = buildConfig({
      mode: "draft_only",
      briefingDateOverride: "2026-04-27",
      testRunId: "controlled-test",
      targetEnvironment: "production",
      allowProductionPipelineTest: true,
      cronDisabledConfirmed: true,
    });

    expect(() => assertControlledPipelineCanExecute(config)).not.toThrow();
  });

  it("does not allow normal mode to accept test-run overrides", () => {
    const config = buildConfig({
      mode: "normal",
      briefingDateOverride: "2026-04-27",
      testRunId: "controlled-test",
    });

    expect(() => assertControlledPipelineCanExecute(config)).toThrow(/BRIEFING_DATE_OVERRIDE/);
  });
});

describe("controlled pipeline report", () => {
  it("reports validation status and failure reasons for proposed generated signals", () => {
    const valid =
      "Anthropic's growth is now structurally tied to Google and Amazon's infrastructure, not independent of it. At scale, that's a dependency, not just a partnership.";
    const invalid = "This changes how investors price rates, demand, or risk in rates and equities over";
    const publicRankedItems = [
      buildItem(1, invalid),
      buildItem(2, valid),
      buildItem(3, valid),
      buildItem(4, valid),
      buildItem(5, valid),
      buildItem(6, invalid),
    ];
    const report = buildControlledPipelineReport({
      mode: "dry_run",
      testRunId: "report-test",
      briefing: {
        ...buildBriefing(),
        items: publicRankedItems.slice(0, 5),
      },
      publicRankedItems,
      pipelineRun: {
        run_id: "pipeline-test",
        num_clusters: 6,
      } as never,
    });

    expect(report.mode).toBe("dry_run");
    expect(report.runId).toBe("pipeline-test");
    expect(report.candidateCount).toBe(6);
    expect(report.proposedTopFive).toHaveLength(5);
    expect(report.proposedDepthRows).toHaveLength(1);
    expect(report.proposedTopFive[0]).toMatchObject({
      validationStatus: "requires_human_rewrite",
      validationFailures: expect.arrayContaining(["incomplete_sentence", "template_placeholder_language"]),
    });
    expect(report.proposedTopFive[1]).toMatchObject({
      validationStatus: "passed",
      validationFailures: [],
      validationDetails: [],
    });
    expect(report.proposedDepthRows[0].validationStatus).toBe("requires_human_rewrite");
  });
});
