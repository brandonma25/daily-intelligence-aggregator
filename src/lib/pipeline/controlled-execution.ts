import type { ClusterFirstPipelineResult } from "@/lib/pipeline";
import type { SignalSnapshotPersistenceResult } from "@/lib/signals-editorial";
import type { BriefingItem, DailyBriefing } from "@/lib/types";
import { validateWhyItMatters } from "@/lib/why-it-matters-quality-gate";

export type PipelineRunMode = "normal" | "dry_run" | "draft_only";
export type PipelineTargetEnvironment = "local" | "preview" | "staging" | "production";

export type ControlledPipelineConfig = {
  mode: PipelineRunMode;
  briefingDateOverride: string | null;
  testRunId: string | null;
  targetEnvironment: PipelineTargetEnvironment;
  allowProductionPipelineTest: boolean;
  cronDisabledConfirmed: boolean;
  artifactDir: string;
};

export type ControlledPipelineSignalReport = {
  id: string;
  rank: number;
  title: string;
  sourceName: string | null;
  sourceUrl: string | null;
  whyItMatters: string;
  validationStatus: "passed" | "requires_human_rewrite";
  validationFailures: string[];
  validationDetails: string[];
};

export type ControlledPipelineReport = {
  mode: PipelineRunMode;
  testRunId: string | null;
  runId: string;
  generatedBriefingDate: string;
  candidateCount: number;
  clusterCount: number;
  signalCount: number;
  proposedTopFive: ControlledPipelineSignalReport[];
  proposedDepthRows: ControlledPipelineSignalReport[];
  persistence: SignalSnapshotPersistenceResult | null;
};

const VALID_RUN_MODES = new Set<PipelineRunMode>(["normal", "dry_run", "draft_only"]);
const VALID_TARGET_ENVIRONMENTS = new Set<PipelineTargetEnvironment>([
  "local",
  "preview",
  "staging",
  "production",
]);

function normalizeEnv(value: string | undefined) {
  return value?.trim() ?? "";
}

function parseBooleanEnv(value: string | undefined) {
  return /^(1|true|yes|on)$/i.test(normalizeEnv(value));
}

function parseRunMode(value: string | undefined): PipelineRunMode {
  const normalized = normalizeEnv(value) || "normal";

  if (VALID_RUN_MODES.has(normalized as PipelineRunMode)) {
    return normalized as PipelineRunMode;
  }

  throw new Error(
    `Invalid PIPELINE_RUN_MODE "${normalized}". Expected one of: normal, dry_run, draft_only.`,
  );
}

function parseTargetEnvironment(env: NodeJS.ProcessEnv): PipelineTargetEnvironment {
  const explicitTarget = normalizeEnv(env.PIPELINE_TARGET_ENV);
  const vercelTarget = normalizeEnv(env.VERCEL_ENV);
  const nodeTarget = normalizeEnv(env.NODE_ENV);
  const normalized = (explicitTarget || vercelTarget || (nodeTarget === "production" ? "production" : "local"))
    .toLowerCase();

  if (VALID_TARGET_ENVIRONMENTS.has(normalized as PipelineTargetEnvironment)) {
    return normalized as PipelineTargetEnvironment;
  }

  throw new Error(
    `Invalid pipeline target environment "${normalized}". Expected one of: local, preview, staging, production.`,
  );
}

function parseBriefingDateOverride(value: string | undefined) {
  const normalized = normalizeEnv(value);

  if (!normalized) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new Error("BRIEFING_DATE_OVERRIDE must use YYYY-MM-DD format.");
  }

  return normalized;
}

export function resolveControlledPipelineConfig(env: NodeJS.ProcessEnv = process.env): ControlledPipelineConfig {
  return {
    mode: parseRunMode(env.PIPELINE_RUN_MODE),
    briefingDateOverride: parseBriefingDateOverride(env.BRIEFING_DATE_OVERRIDE),
    testRunId: normalizeEnv(env.PIPELINE_TEST_RUN_ID) || null,
    targetEnvironment: parseTargetEnvironment(env),
    allowProductionPipelineTest: parseBooleanEnv(env.ALLOW_PRODUCTION_PIPELINE_TEST),
    cronDisabledConfirmed: parseBooleanEnv(env.PIPELINE_CRON_DISABLED_CONFIRMED),
    artifactDir: normalizeEnv(env.PIPELINE_RUN_ARTIFACT_DIR) || ".pipeline-runs",
  };
}

export function assertControlledPipelineCanExecute(config: ControlledPipelineConfig) {
  if (config.mode === "normal" && config.briefingDateOverride) {
    throw new Error("BRIEFING_DATE_OVERRIDE is not allowed for normal pipeline runs.");
  }

  if (config.mode === "normal" && config.testRunId) {
    throw new Error("PIPELINE_TEST_RUN_ID is not allowed for normal pipeline runs.");
  }

  if (config.mode !== "draft_only") {
    return;
  }

  if (!config.briefingDateOverride) {
    throw new Error("draft_only mode requires BRIEFING_DATE_OVERRIDE=YYYY-MM-DD.");
  }

  if (!config.testRunId) {
    throw new Error("draft_only mode requires PIPELINE_TEST_RUN_ID.");
  }

  if (config.targetEnvironment !== "production") {
    return;
  }

  if (!config.allowProductionPipelineTest) {
    throw new Error("production draft_only mode requires ALLOW_PRODUCTION_PIPELINE_TEST=true.");
  }

  if (!config.cronDisabledConfirmed) {
    throw new Error("production draft_only mode requires PIPELINE_CRON_DISABLED_CONFIRMED=true.");
  }
}

function selectSignalText(item: BriefingItem) {
  return (item.aiWhyItMatters ?? item.whyItMatters ?? "").trim();
}

function mapSignalReport(item: BriefingItem, rank: number): ControlledPipelineSignalReport {
  const source = item.sources[0] ?? item.relatedArticles?.[0] ?? null;
  const whyItMatters = selectSignalText(item);
  const validation = validateWhyItMatters(whyItMatters);
  const sourceName = source
    ? "sourceName" in source && typeof source.sourceName === "string"
      ? source.sourceName
      : source.title
    : null;

  return {
    id: item.id,
    rank,
    title: item.title,
    sourceName: sourceName ?? null,
    sourceUrl: source?.url ?? null,
    whyItMatters,
    validationStatus: validation.passed ? "passed" : "requires_human_rewrite",
    validationFailures: validation.failures,
    validationDetails: validation.failureDetails,
  };
}

export function buildControlledPipelineReport(input: {
  mode: PipelineRunMode;
  testRunId?: string | null;
  briefing: DailyBriefing;
  publicRankedItems: BriefingItem[];
  pipelineRun: ClusterFirstPipelineResult["run"];
  persistence?: SignalSnapshotPersistenceResult | null;
}): ControlledPipelineReport {
  const candidates = input.publicRankedItems.length > 0
    ? input.publicRankedItems
    : input.briefing.items;

  return {
    mode: input.mode,
    testRunId: input.testRunId ?? null,
    runId: input.pipelineRun.run_id,
    generatedBriefingDate: input.briefing.briefingDate.slice(0, 10),
    candidateCount: candidates.length,
    clusterCount: input.pipelineRun.num_clusters,
    signalCount: input.briefing.items.length,
    proposedTopFive: candidates.slice(0, 5).map((item, index) => mapSignalReport(item, index + 1)),
    proposedDepthRows: candidates.slice(5, 20).map((item, index) => mapSignalReport(item, index + 6)),
    persistence: input.persistence ?? null,
  };
}
