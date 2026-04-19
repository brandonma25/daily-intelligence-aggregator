import {
  DEFAULT_DONOR_FEED_IDS,
  PROBATIONARY_RUNTIME_FEED_IDS,
} from "@/adapters/donors";
import { MVP_DEFAULT_PUBLIC_SOURCE_IDS } from "@/lib/demo-data";
import type { SourceDefinition } from "@/lib/integration/subsystem-contracts";

export type RuntimeSourceResolutionMode = "no_argument_runtime" | "supplied_sources";

export type RuntimeSourceResolutionSnapshot = {
  resolution_mode: RuntimeSourceResolutionMode;
  mvp_default_public_source_ids: string[];
  donor_fallback_default_ids: string[];
  probationary_runtime_source_ids: string[];
  resolved_runtime_source_ids: string[];
  resolved_default_donor_source_ids: string[];
  resolved_probationary_source_ids: string[];
  resolved_other_source_ids: string[];
};

export function buildRuntimeSourceResolutionSnapshot(input: {
  resolutionMode: RuntimeSourceResolutionMode;
  resolvedSources: SourceDefinition[];
}): RuntimeSourceResolutionSnapshot {
  const donorDefaultIds = [...DEFAULT_DONOR_FEED_IDS];
  const probationaryRuntimeIds = [...PROBATIONARY_RUNTIME_FEED_IDS];
  const resolvedRuntimeSourceIds = input.resolvedSources.map((source) => source.sourceId);
  const donorDefaultIdSet = new Set<string>(donorDefaultIds);
  const probationaryRuntimeIdSet = new Set<string>(probationaryRuntimeIds);

  return {
    resolution_mode: input.resolutionMode,
    mvp_default_public_source_ids: [...MVP_DEFAULT_PUBLIC_SOURCE_IDS],
    donor_fallback_default_ids: donorDefaultIds,
    probationary_runtime_source_ids: probationaryRuntimeIds,
    resolved_runtime_source_ids: resolvedRuntimeSourceIds,
    resolved_default_donor_source_ids: resolvedRuntimeSourceIds.filter((sourceId) => donorDefaultIdSet.has(sourceId)),
    resolved_probationary_source_ids: resolvedRuntimeSourceIds.filter((sourceId) => probationaryRuntimeIdSet.has(sourceId)),
    resolved_other_source_ids: resolvedRuntimeSourceIds.filter(
      (sourceId) => !donorDefaultIdSet.has(sourceId) && !probationaryRuntimeIdSet.has(sourceId),
    ),
  };
}
