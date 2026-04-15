"use client";

import { useEffect, useMemo, useState } from "react";

import { Panel } from "@/components/ui/panel";
import {
  buildDailyReadingMetric,
  formatReadingWindow,
  getReadingWindowContext,
} from "@/lib/reading-window";
import type { DailyReadingMetric } from "@/lib/types";

const STORAGE_KEY = "daily-intelligence-reading-window";

type ReadingWindowAnchorProps = {
  briefingDate: string;
  totalMinutes: number;
  previousMetric: DailyReadingMetric | null;
};

export function ReadingWindowAnchor({
  briefingDate,
  totalMinutes,
  previousMetric,
}: ReadingWindowAnchorProps) {
  const todayMetric = useMemo(
    () => buildDailyReadingMetric(briefingDate, totalMinutes),
    [briefingDate, totalMinutes],
  );
  const [storageMetric] = useState<DailyReadingMetric | null>(() => readStoredMetric());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todayMetric));
    } catch {}
  }, [todayMetric]);

  const clientPreviousMetric =
    previousMetric ?? (storageMetric && storageMetric.date !== todayMetric.date ? storageMetric : null);

  const context = getReadingWindowContext(todayMetric.totalMinutes, clientPreviousMetric);

  return (
    <Panel className="overflow-hidden border-[rgba(41,79,134,0.12)] bg-[linear-gradient(180deg,rgba(41,79,134,0.08),rgba(255,255,255,0.96))] p-6 shadow-[0_22px_70px_rgba(17,24,39,0.08)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#294f86]">
            Daily reading window
          </p>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-[var(--foreground)] sm:text-5xl">
            {todayMetric.totalMinutes} min
          </p>
          <p className="mt-2 text-base font-medium text-[var(--foreground)]">
            {formatReadingWindow(todayMetric.totalMinutes)}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px]">
          <SignalCard label="Context" value={context.comparisonLabel} suppressHydrationWarning />
          <SignalCard
            label="Interpretation"
            value={`${context.interpretation} day`}
            detail={describeReadingLoad(context.interpretation)}
          />
        </div>
      </div>
    </Panel>
  );
}

function readStoredMetric() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DailyReadingMetric) : null;
  } catch {
    return null;
  }
}

function SignalCard({
  label,
  value,
  detail,
  suppressHydrationWarning = false,
}: {
  label: string;
  value: string;
  detail?: string;
  suppressHydrationWarning?: boolean;
}) {
  return (
    <div className="rounded-[20px] border border-[rgba(19,26,34,0.08)] bg-white/78 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-[var(--foreground)]" suppressHydrationWarning={suppressHydrationWarning}>
        {value}
      </p>
      {detail ? <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{detail}</p> : null}
    </div>
  );
}

function describeReadingLoad(interpretation: "Light" | "Normal" | "Heavy") {
  switch (interpretation) {
    case "Light":
      return "Lower activity across the current briefing.";
    case "Heavy":
      return "High signal and higher coverage volume today.";
    default:
      return "A standard flow of ranked developments today.";
  }
}
