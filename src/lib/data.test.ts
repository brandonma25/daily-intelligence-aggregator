import { beforeEach, describe, expect, it, vi } from "vitest";

const safeGetUser = vi.fn();
const createSupabaseServerClient = vi.fn();
const getHomepageSignalSnapshot = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  safeGetUser,
  createSupabaseServerClient,
}));

vi.mock("@/lib/signals-editorial", () => ({
  getHomepageSignalSnapshot,
}));

function createHomepageSignalPost(overrides: Partial<{
  id: string;
  briefingDate: string | null;
  rank: number;
  title: string;
  sourceName: string;
  sourceUrl: string;
  summary: string;
  tags: string[];
  signalScore: number | null;
  selectionReason: string;
  aiWhyItMatters: string;
  editedWhyItMatters: string | null;
  publishedWhyItMatters: string | null;
  editedWhyItMattersStructured: unknown | null;
  publishedWhyItMattersStructured: unknown | null;
  editorialStatus: "draft" | "needs_review" | "approved" | "published";
  editedBy: string | null;
  editedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  publishedAt: string | null;
  isLive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  persisted: boolean;
}> = {}) {
  return {
    id: overrides.id ?? `signal-${overrides.rank ?? 1}`,
    briefingDate: overrides.briefingDate ?? "2026-04-25",
    rank: overrides.rank ?? 1,
    title: overrides.title ?? `Stored signal ${overrides.rank ?? 1}`,
    sourceName: overrides.sourceName ?? "Source",
    sourceUrl: overrides.sourceUrl ?? "https://example.com/source",
    summary: overrides.summary ?? "Stored summary",
    tags: overrides.tags ?? ["tech"],
    signalScore: overrides.signalScore ?? 84,
    selectionReason: overrides.selectionReason ?? "Stored ranking signal",
    aiWhyItMatters: overrides.aiWhyItMatters ?? "Stored AI why it matters",
    editedWhyItMatters: overrides.editedWhyItMatters ?? null,
    publishedWhyItMatters: overrides.publishedWhyItMatters ?? null,
    editedWhyItMattersStructured: overrides.editedWhyItMattersStructured ?? null,
    publishedWhyItMattersStructured: overrides.publishedWhyItMattersStructured ?? null,
    editorialStatus: overrides.editorialStatus ?? "approved",
    editedBy: overrides.editedBy ?? null,
    editedAt: overrides.editedAt ?? null,
    approvedBy: overrides.approvedBy ?? null,
    approvedAt: overrides.approvedAt ?? null,
    publishedAt: overrides.publishedAt ?? null,
    isLive: overrides.isLive ?? false,
    createdAt: overrides.createdAt ?? null,
    updatedAt: overrides.updatedAt ?? null,
    persisted: overrides.persisted ?? true,
  };
}

async function loadDataModule() {
  vi.resetModules();
  return import("@/lib/data");
}

describe("homepage read model", () => {
  beforeEach(() => {
    safeGetUser.mockReset();
    createSupabaseServerClient.mockReset();
    getHomepageSignalSnapshot.mockReset();
    createSupabaseServerClient.mockResolvedValue(null);
    safeGetUser.mockResolvedValue({
      supabase: null,
      user: null,
      sessionCookiePresent: false,
    });
  });

  it("prefers the latest stored signal snapshot over demo briefing copy", async () => {
    getHomepageSignalSnapshot.mockResolvedValue({
      source: "latest_snapshot",
      briefingDate: "2026-04-25",
      posts: [
        createHomepageSignalPost({
          id: "finance-1",
          rank: 1,
          title: "Stored finance signal",
          tags: ["finance", "markets"],
          summary: "Stored finance summary",
          editedWhyItMatters: "Stored finance editorial note",
        }),
        createHomepageSignalPost({
          id: "tech-1",
          rank: 2,
          title: "Stored tech signal",
          tags: ["tech", "software"],
          summary: "Stored tech summary",
          editedWhyItMatters: "Stored tech editorial note",
        }),
      ],
    });

    const { getHomepagePageState } = await loadDataModule();
    const state = await getHomepagePageState("/");

    expect(state.data.briefing.intro).toMatch(/latest stored Top 5 snapshot/i);
    expect(state.data.briefing.items.map((item) => item.title)).toEqual([
      "Stored finance signal",
      "Stored tech signal",
    ]);
    expect(
      state.data.briefing.items.some((item) => /static sample copy|public finance briefing now surfaces/i.test(item.title)),
    ).toBe(false);
  });

  it("uses clearly labeled category-specific placeholders when no stored snapshot exists", async () => {
    getHomepageSignalSnapshot.mockResolvedValue({
      source: "none",
      briefingDate: null,
      posts: [],
    });

    const { getHomepagePageState } = await loadDataModule();
    const { buildHomepageViewModel } = await import("@/lib/homepage-model");
    const state = await getHomepagePageState("/");
    const viewModel = buildHomepageViewModel(state.data);

    expect(state.data.briefing.intro).toMatch(/clearly labeled category placeholders/i);
    expect(
      state.data.briefing.items.some((item) => /static sample copy|live business feeds|live headlines/i.test(item.title)),
    ).toBe(false);
    expect(viewModel.debug.categoryCounts.tech).toBeGreaterThan(0);
    expect(viewModel.debug.categoryCounts.finance).toBeGreaterThan(0);
    expect(viewModel.debug.categoryCounts.politics).toBeGreaterThan(0);
  });
});
