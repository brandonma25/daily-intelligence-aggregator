import type { ImportanceClassification } from "@/lib/importance-classifier";

export type SignalLabel = "High Signal" | "Medium Signal" | "Low Signal";

export type ImportanceScoreResult = ImportanceClassification & {
  score: number;
  signalLabel: SignalLabel;
};

export function computeImportanceScore(
  classification: ImportanceClassification,
): ImportanceScoreResult {
  const score =
    classification.entityWeight +
    classification.eventTypeWeight +
    classification.sourceWeight +
    classification.recencyWeight;

  return {
    ...classification,
    score,
    signalLabel: getSignalLabel(score),
  };
}

export function getSignalLabel(score: number | null | undefined): SignalLabel {
  const resolvedScore = score ?? 0;
  if (resolvedScore >= 13) return "High Signal";
  if (resolvedScore >= 8) return "Medium Signal";
  return "Low Signal";
}

export function getImportanceLabel(score: number | null | undefined) {
  const resolvedScore = score ?? 0;
  if (resolvedScore >= 13) return "Critical" as const;
  if (resolvedScore >= 8) return "High" as const;
  return "Watch" as const;
}

export function compareImportanceScores(
  left: { importanceScore?: number; publishedAt?: string },
  right: { importanceScore?: number; publishedAt?: string },
) {
  const scoreDelta = (right.importanceScore ?? 0) - (left.importanceScore ?? 0);
  if (scoreDelta !== 0) {
    return scoreDelta;
  }

  return getTimestamp(right.publishedAt) - getTimestamp(left.publishedAt);
}

function getTimestamp(value: string | undefined) {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}
