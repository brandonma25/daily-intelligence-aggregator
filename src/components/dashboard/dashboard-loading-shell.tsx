import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/utils";

const topicPlaceholders = ["Geopolitics", "Business", "Technology"];

export function DashboardLoadingShell() {
  return (
    <AppShell currentPath="/dashboard" mode="public" loadingState>
      <div
        className="space-y-5 py-2"
        role="status"
        aria-live="polite"
        aria-label="Loading dashboard"
      >
        <Panel className="overflow-hidden border-[rgba(19,26,34,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,255,255,0.72))] p-5 md:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-3">
              <div className="h-7 w-36 rounded-full border border-[var(--line)] bg-white/75" aria-hidden="true" />
              <div className="space-y-2">
                <h1 className="display-font text-2xl leading-tight tracking-tight text-[var(--foreground)] md:text-3xl">
                  Loading today&apos;s dashboard
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">
                  The latest briefing is loading into the full dashboard layout.
                </p>
              </div>
            </div>
            <div className="shrink-0" aria-hidden="true">
              <div className="h-11 w-44 rounded-full border border-[var(--line)] bg-white/72" />
            </div>
          </div>
        </Panel>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
          <Panel className="p-5">
            <SectionKicker>Dashboard overview</SectionKicker>
            <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
              Briefing workspace is taking shape
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              Core summary panels appear first so the page feels stable while the ranked briefing loads.
            </p>
          </Panel>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {Array.from({ length: 3 }).map((_, index) => (
              <MetricSkeleton key={index} />
            ))}
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <Panel className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <SectionKicker>Priority scan</SectionKicker>
                <h2 className="mt-1.5 text-xl font-semibold text-[var(--foreground)]">
                  Top events today
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Confirmed event clusters load into this primary scan first.
                </p>
              </div>
              <div className="h-8 w-24 rounded-full border border-[var(--line)] bg-white/72" aria-hidden="true" />
            </div>
            <div className="mt-5 grid gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <EventCardSkeleton key={index} />
              ))}
            </div>
          </Panel>

          <div className="xl:sticky xl:top-4 xl:self-start">
            <Panel className="p-5">
              <SectionKicker>Coverage map</SectionKicker>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Topic-by-topic posture for the current briefing.
              </p>
              <div className="mt-4 space-y-3">
                {topicPlaceholders.map((topic) => (
                  <div
                    key={topic}
                    className="flex items-center justify-between gap-3 rounded-[18px] border border-[var(--line)] bg-white/60 px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-2.5 w-2.5 rounded-full bg-[rgba(41,79,134,0.45)]" aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--foreground)]">{topic}</p>
                        <div className="mt-1 h-3 w-28 rounded-full bg-[rgba(19,26,34,0.08)]" aria-hidden="true" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2" aria-hidden="true">
                      <div className="h-6 w-20 rounded-full border border-[var(--line)] bg-white/75" />
                      <div className="h-6 w-16 rounded-full border border-[var(--line)] bg-white/75" />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </section>

        <section className="space-y-6">
          <div>
            <SectionKicker>Topic briefings</SectionKicker>
            <h2 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
              Compact event view by topic
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Topic sections keep their final footprint while briefing cards stream in.
            </p>
          </div>
          {topicPlaceholders.map((topic) => (
            <Panel key={topic} className="scroll-mt-6 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-[rgba(41,79,134,0.45)]" aria-hidden="true" />
                  <div>
                    <h2 className="display-font text-2xl text-[var(--foreground)]">{topic}</h2>
                    <div className="mt-1 h-3 w-48 rounded-full bg-[rgba(19,26,34,0.08)]" aria-hidden="true" />
                  </div>
                </div>
                <div className="flex max-w-full flex-wrap gap-2" aria-hidden="true">
                  <div className="h-6 w-32 rounded-full border border-[var(--line)] bg-white/75" />
                  <div className="h-6 w-24 rounded-full border border-[var(--line)] bg-white/75" />
                </div>
              </div>
              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                <TopicCardSkeleton />
                <TopicCardSkeleton />
              </div>
            </Panel>
          ))}
        </section>
      </div>
    </AppShell>
  );
}

function SectionKicker({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
      {children}
    </p>
  );
}

function MetricSkeleton() {
  return (
    <Panel className="p-5">
      <div className="space-y-3" aria-hidden="true">
        <div className="h-3 w-20 rounded-full bg-[rgba(19,26,34,0.08)]" />
        <div className="h-10 w-16 rounded-[18px] bg-[rgba(19,26,34,0.08)]" />
        <div className="h-3 w-24 rounded-full bg-[rgba(19,26,34,0.06)]" />
      </div>
    </Panel>
  );
}

function EventCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[22px] border border-[var(--line)] bg-white/65 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap gap-2" aria-hidden="true">
            <div className="h-6 w-20 rounded-full border border-[var(--line)] bg-white/75" />
            <div className="h-6 w-24 rounded-full border border-[var(--line)] bg-white/75" />
            <div className="h-6 w-[4.5rem] rounded-full border border-[var(--line)] bg-white/75" />
          </div>
          <div className="space-y-2" aria-hidden="true">
            <div className="h-7 w-full max-w-[28rem] rounded-[16px] bg-[rgba(19,26,34,0.08)]" />
            <div className="h-4 w-full rounded-full bg-[rgba(19,26,34,0.06)]" />
            <div className="h-4 w-4/5 rounded-full bg-[rgba(19,26,34,0.06)]" />
          </div>
        </div>
        <div className="h-10 w-28 rounded-full border border-[var(--line)] bg-white/75" aria-hidden="true" />
      </div>

      <SkeletonPanel className="mt-4">
        <div className="space-y-2" aria-hidden="true">
          <div className="h-3 w-24 rounded-full bg-[rgba(19,26,34,0.08)]" />
          <div className="h-4 w-full rounded-full bg-[rgba(19,26,34,0.08)]" />
          <div className="h-4 w-2/3 rounded-full bg-[rgba(19,26,34,0.06)]" />
        </div>
      </SkeletonPanel>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[16px] border border-[rgba(19,26,34,0.08)] bg-white/70 px-3 py-3"
            aria-hidden="true"
          >
            <div className="h-3 w-16 rounded-full bg-[rgba(19,26,34,0.08)]" />
            <div className="mt-2 h-4 w-24 rounded-full bg-[rgba(19,26,34,0.06)]" />
          </div>
        ))}
      </div>

      <SkeletonPanel className="mt-4 bg-[rgba(41,79,134,0.05)]">
        <div className="space-y-2" aria-hidden="true">
          <div className="h-3 w-20 rounded-full bg-[rgba(41,79,134,0.2)]" />
          <div className="h-4 w-full rounded-full bg-[rgba(19,26,34,0.08)]" />
          <div className="h-4 w-5/6 rounded-full bg-[rgba(19,26,34,0.06)]" />
        </div>
      </SkeletonPanel>
    </div>
  );
}

function TopicCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[22px] border border-[var(--line)] bg-white/65 p-5">
      <div className="space-y-3" aria-hidden="true">
        <div className="flex flex-wrap gap-2">
          <div className="h-6 w-20 rounded-full border border-[var(--line)] bg-white/75" />
          <div className="h-6 w-24 rounded-full border border-[var(--line)] bg-white/75" />
        </div>
        <div className="h-6 w-4/5 rounded-[16px] bg-[rgba(19,26,34,0.08)]" />
        <div className="h-4 w-full rounded-full bg-[rgba(19,26,34,0.06)]" />
      </div>
      <SkeletonPanel className="mt-4">
        <div className="space-y-2" aria-hidden="true">
          <div className="h-3 w-20 rounded-full bg-[rgba(19,26,34,0.08)]" />
          <div className="h-4 w-full rounded-full bg-[rgba(19,26,34,0.08)]" />
        </div>
      </SkeletonPanel>
    </div>
  );
}

function SkeletonPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[18px] border border-[rgba(19,26,34,0.08)] bg-[rgba(255,255,255,0.72)] px-4 py-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
