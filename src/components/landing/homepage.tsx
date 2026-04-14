"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, ExternalLink } from "lucide-react";

import AuthModal from "@/components/auth/auth-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import type { BriefingItem, DashboardData, ViewerAccount } from "@/lib/types";
import { cn, formatBriefingDate } from "@/lib/utils";

type LandingHomepageProps = {
  data: DashboardData;
  viewer: ViewerAccount | null;
};

type CategoryKey = "Tech" | "Finance" | "Politics";

const CATEGORY_CONFIG: Array<{
  key: CategoryKey;
  label: string;
  description: string;
  keywords: string[];
}> = [
  {
    key: "Tech",
    label: "Tech",
    description: "AI, platforms, chips, infrastructure, and software shifts worth tracking.",
    keywords: ["tech", "ai", "chip", "chips", "nvidia", "software", "cloud", "model", "data center"],
  },
  {
    key: "Finance",
    label: "Finance",
    description: "Markets, companies, macro moves, and business developments with decision impact.",
    keywords: ["finance", "market", "markets", "fed", "stocks", "earnings", "economy", "business", "inflation"],
  },
  {
    key: "Politics",
    label: "Politics",
    description: "Government, regulation, elections, and policy changes shaping the operating environment.",
    keywords: ["politic", "policy", "government", "regulation", "election", "congress", "senate", "white house"],
  },
];

export default function LandingHomepage({ data, viewer }: LandingHomepageProps) {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const signedIn = Boolean(viewer);
  const items = data.briefing.items;

  const {
    featured,
    topEvents,
    categorySections,
    trending,
  } = useMemo(() => organizeHomepageContent(items), [items]);

  return (
    <>
      <main className="mx-auto min-h-screen w-full max-w-[1320px] px-5 pb-16 pt-5 sm:px-6 lg:px-8 lg:pb-24 lg:pt-6">
        <HomepageNav
          signedIn={signedIn}
          viewer={viewer}
          onSignIn={() => setAuthModalOpen(true)}
        />

        <div className="space-y-10 lg:space-y-14">
          <HeroIntelligenceBlock
            mode={data.mode}
            featured={featured}
            onPrimaryAction={() => setAuthModalOpen(true)}
            signedIn={signedIn}
          />

          <TopEventsSection items={topEvents} />

          <section className="space-y-6 lg:space-y-8">
            {categorySections.map((section) => (
              <CategorySection
                key={section.label}
                label={section.label}
                description={section.description}
                items={section.items}
              />
            ))}
          </section>

          <TrendingSection items={trending} />

          <DelayedCtaSection signedIn={signedIn} onOpenAuth={() => setAuthModalOpen(true)} />
        </div>
      </main>

      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}

function HomepageNav({
  signedIn,
  viewer,
  onSignIn,
}: {
  signedIn: boolean;
  viewer: ViewerAccount | null;
  onSignIn: () => void;
}) {
  return (
    <header className="mb-8 rounded-[28px] border border-[var(--line)] bg-[rgba(255,255,255,0.76)] px-5 py-4 backdrop-blur-xl shadow-[0_18px_60px_rgba(24,30,37,0.06)] lg:mb-10 lg:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="min-w-0">
            <p className="display-font text-[1.35rem] leading-none text-[var(--foreground)] lg:text-[1.55rem]">
              Daily Intelligence
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
              Briefing product
            </p>
          </Link>
        </div>

        <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-[var(--muted)]">
          <a href="#top-events" className="transition-colors hover:text-[var(--foreground)]">Top Events</a>
          <a href="#tech" className="transition-colors hover:text-[var(--foreground)]">Tech</a>
          <a href="#finance" className="transition-colors hover:text-[var(--foreground)]">Finance</a>
          <a href="#politics" className="transition-colors hover:text-[var(--foreground)]">Politics</a>
        </nav>

        <div className="flex items-center justify-between gap-3 lg:justify-end">
          {signedIn && viewer ? (
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-[var(--foreground)]">{viewer.displayName}</p>
              <p className="text-xs text-[var(--muted)]">Signed in</p>
            </div>
          ) : null}
          {signedIn ? (
            <Link href="/dashboard">
              <Button>Open dashboard</Button>
            </Link>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              className="text-sm font-semibold text-[var(--foreground)] transition-colors hover:text-[var(--accent)]"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function HeroIntelligenceBlock({
  mode,
  featured,
  onPrimaryAction,
  signedIn,
}: {
  mode: DashboardData["mode"];
  featured: BriefingItem | null;
  onPrimaryAction: () => void;
  signedIn: boolean;
}) {
  return (
    <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:gap-6">
      <Panel className="relative overflow-hidden px-6 py-8 lg:px-8 lg:py-10">
        <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(135deg,rgba(31,79,70,0.14),transparent_70%)]" />
        <div className="relative max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={mode === "live" ? "text-[var(--accent)]" : ""}>
              {mode === "live" ? "Live intelligence" : mode === "public" ? "Public briefing" : "Demo briefing"}
            </Badge>
            <Badge>{formatBriefingDate(new Date().toISOString())}</Badge>
          </div>
          <h1 className="display-font mt-5 text-4xl leading-tight text-[var(--foreground)] sm:text-5xl lg:text-[3.75rem]">
            The daily briefing for people who need context, not noise.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-[var(--muted)] sm:text-lg">
            Daily Intelligence Aggregator turns fragmented reporting into a calmer, ranked view of the stories worth understanding first.
          </p>
          <p className="mt-4 border-l-2 border-[rgba(31,79,70,0.25)] pl-4 text-sm leading-7 text-[var(--foreground)] sm:text-[0.95rem]">
            Why it matters: see the top developments, the context behind them, and the stories worth paying attention to before the day gets noisy.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-[var(--muted)]">
            <span>Structured by importance</span>
            <span className="h-1 w-1 rounded-full bg-[var(--muted)]" />
            <span>Built for fast executive scanning</span>
            <span className="h-1 w-1 rounded-full bg-[var(--muted)]" />
            <span>Designed for context over clutter</span>
          </div>
          {!signedIn ? (
            <div className="mt-8 text-sm font-medium text-[var(--muted)]">
              Start by reading the briefing below. Sign in only when you want your own saved feed.
            </div>
          ) : null}
        </div>
      </Panel>

      <FeaturedStoryCard item={featured} onOpenAuth={onPrimaryAction} signedIn={signedIn} />
    </section>
  );
}

function FeaturedStoryCard({
  item,
  onOpenAuth,
  signedIn,
}: {
  item: BriefingItem | null;
  onOpenAuth: () => void;
  signedIn: boolean;
}) {
  const primarySource = item?.sources.find((source) => isValidStoryUrl(source.url));

  return (
    <Panel className="flex h-full flex-col justify-between px-6 py-6 lg:px-7 lg:py-7">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          Featured intelligence block
        </p>
        {item ? (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge>{item.topicName}</Badge>
              {item.matchedKeywords?.length ? <Badge className="text-[var(--accent)]">Matched on {item.matchedKeywords[0]}</Badge> : null}
            </div>
            {primarySource ? (
              <a
                href={primarySource.url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-start gap-2 text-2xl font-semibold leading-tight text-[var(--foreground)] underline-offset-4 hover:underline"
              >
                <span>{item.title}</span>
                <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-[var(--muted)]" />
              </a>
            ) : (
              <h2 className="mt-4 text-2xl font-semibold leading-tight text-[var(--foreground)]">{item.title}</h2>
            )}
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
              {item.whatHappened}
            </p>
            <p className="mt-4 text-sm font-medium text-[var(--foreground)]">
              {item.whyItMatters}
            </p>
          </>
        ) : (
          <div className="mt-5 rounded-[22px] border border-[var(--line)] bg-white/55 p-5 text-sm leading-7 text-[var(--muted)]">
            Briefing content will appear here once feeds refresh and stories are ranked.
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between gap-4 border-t border-[var(--line)] pt-5">
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">Today&apos;s briefing flow</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Hero story first, then the next most important developments.</p>
        </div>
        {signedIn ? (
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
            Open today&apos;s briefing
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
    </Panel>
  );
}

function TopEventsSection({ items }: { items: BriefingItem[] }) {
  return (
    <section id="top-events" className="space-y-4 lg:space-y-5">
      <SectionHeader
        eyebrow="Top Events Today"
        title="What deserves attention first"
        description="A tighter scan of the developments most likely to shape decisions today."
      />
      {items.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <TopEventCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <Panel className="p-5 text-sm leading-7 text-[var(--muted)]">
          More top events will appear here as the briefing fills out.
        </Panel>
      )}
    </section>
  );
}

function TopEventCard({ item }: { item: BriefingItem }) {
  const primarySource = item.sources.find((source) => isValidStoryUrl(source.url));

  return (
    <Panel className="flex h-full flex-col justify-between p-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{item.topicName}</Badge>
          {item.matchedKeywords?.length ? <Badge className="text-[var(--accent)]">{item.matchedKeywords.join(", ")}</Badge> : null}
        </div>
        {primarySource ? (
          <a
            href={primarySource.url}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-start gap-2 text-lg font-semibold leading-snug text-[var(--foreground)] underline-offset-4 hover:underline"
          >
            <span>{item.title}</span>
            <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--muted)]" />
          </a>
        ) : (
          <h3 className="mt-4 text-lg font-semibold leading-snug text-[var(--foreground)]">{item.title}</h3>
        )}
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{item.whatHappened}</p>
      </div>
      <div className="mt-5 border-t border-[var(--line)] pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Why it matters</p>
        <p className="mt-2 text-sm leading-7 text-[var(--foreground)]">{item.whyItMatters}</p>
      </div>
    </Panel>
  );
}

function CategorySection({
  label,
  description,
  items,
}: {
  label: string;
  description: string;
  items: BriefingItem[];
}) {
  return (
    <section id={label.toLowerCase()} className="space-y-4">
      <SectionHeader eyebrow={label} title={label} description={description} />
      {items.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <CompactStoryCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <Panel className="p-5 text-sm leading-7 text-[var(--muted)]">
          No stories are grouped here yet. The section stays ready so the homepage remains easy to scan as coverage expands.
        </Panel>
      )}
    </section>
  );
}

function CompactStoryCard({ item }: { item: BriefingItem }) {
  const primarySource = item.sources.find((source) => isValidStoryUrl(source.url));

  return (
    <Panel className="p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{item.topicName}</Badge>
        {item.matchedKeywords?.length ? <Badge className="text-[var(--accent)]">Matched on {item.matchedKeywords[0]}</Badge> : null}
      </div>
      {primarySource ? (
        <a
          href={primarySource.url}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-start gap-2 text-base font-semibold leading-snug text-[var(--foreground)] underline-offset-4 hover:underline"
        >
          <span>{item.title}</span>
          <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--muted)]" />
        </a>
      ) : (
        <h3 className="mt-4 text-base font-semibold leading-snug text-[var(--foreground)]">{item.title}</h3>
      )}
      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{item.whatHappened}</p>
    </Panel>
  );
}

function TrendingSection({ items }: { items: BriefingItem[] }) {
  return (
    <section className="space-y-4">
      <SectionHeader
        eyebrow="Trending / Important"
        title="Other developments worth keeping in view"
        description="A compact list for breadth once you have the main picture."
      />
      {items.length ? (
        <Panel className="divide-y divide-[var(--line)] overflow-hidden p-0">
          {items.map((item, index) => {
            const primarySource = item.sources.find((source) => isValidStoryUrl(source.url));
            return (
              <div key={item.id} className={cn("grid gap-3 px-5 py-4 lg:grid-cols-[180px_1fr_220px] lg:items-start", index === 0 && "bg-[rgba(255,255,255,0.12)]")}>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{item.topicName}</p>
                  {item.matchedKeywords?.length ? (
                    <p className="mt-2 text-sm font-medium text-[var(--accent)]">Matched on: {item.matchedKeywords.join(", ")}</p>
                  ) : null}
                </div>
                <div>
                  {primarySource ? (
                    <a
                      href={primarySource.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-start gap-2 text-base font-semibold leading-snug text-[var(--foreground)] underline-offset-4 hover:underline"
                    >
                      <span>{item.title}</span>
                      <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--muted)]" />
                    </a>
                  ) : (
                    <h3 className="text-base font-semibold leading-snug text-[var(--foreground)]">{item.title}</h3>
                  )}
                  <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{item.whatHappened}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Why it matters</p>
                  <p className="mt-2 text-sm leading-7 text-[var(--foreground)]">{item.whyItMatters}</p>
                </div>
              </div>
            );
          })}
        </Panel>
      ) : (
        <Panel className="p-5 text-sm leading-7 text-[var(--muted)]">
          Once more stories are available, lower-priority items will collect here in a compact scan.
        </Panel>
      )}
    </section>
  );
}

function DelayedCtaSection({
  signedIn,
  onOpenAuth,
}: {
  signedIn: boolean;
  onOpenAuth: () => void;
}) {
  return (
    <Panel className="px-6 py-7 lg:px-8 lg:py-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Get the full product flow
          </p>
          <h2 className="display-font mt-3 text-3xl text-[var(--foreground)] sm:text-[2.4rem]">
            Get your daily intelligence briefing
          </h2>
          <p className="mt-3 text-base leading-8 text-[var(--muted)]">
            Track the most important events with context and signal, not just headlines.
          </p>
        </div>
        {signedIn ? (
          <Link href="/dashboard">
            <Button className="px-6">Open your dashboard</Button>
          </Link>
        ) : (
          <Button className="px-6" onClick={onOpenAuth}>
            Get your daily intelligence briefing
          </Button>
        )}
      </div>
    </Panel>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{description}</p>
    </div>
  );
}

function organizeHomepageContent(items: BriefingItem[]) {
  const featured = items[0] ?? null;
  const topEvents = items.slice(1, 5);
  const reservedIds = new Set<string>([...(featured ? [featured.id] : []), ...topEvents.map((item) => item.id)]);

  const categorySections = CATEGORY_CONFIG.map((category) => {
    const preferred = items.filter((item) => !reservedIds.has(item.id) && itemMatchesCategory(item, category));
    preferred.forEach((item) => reservedIds.add(item.id));

    return {
      label: category.label,
      description: category.description,
      items: preferred.slice(0, 3),
    };
  });

  const trending = items.filter((item) => !reservedIds.has(item.id)).slice(0, 6);

  return {
    featured,
    topEvents,
    categorySections,
    trending,
  };
}

function itemMatchesCategory(
  item: BriefingItem,
  category: (typeof CATEGORY_CONFIG)[number],
) {
  const haystack = `${item.topicName} ${item.title} ${item.whatHappened} ${item.whyItMatters}`.toLowerCase();
  return category.keywords.some((keyword) => haystack.includes(keyword));
}

function isValidStoryUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
