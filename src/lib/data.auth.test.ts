import { beforeEach, describe, expect, it, vi } from "vitest";

import { getDashboardPageState, getViewerAccount } from "@/lib/data";
import { safeGetUser } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
  safeGetUser: vi.fn(),
}));

describe("auth-driven SSR viewer detection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(safeGetUser).mockReset();
  });

  it("returns a signed-in viewer account when safeGetUser resolves a user", async () => {
    vi.mocked(safeGetUser).mockResolvedValue({
      supabase: null,
      sessionCookiePresent: true,
      user: {
        id: "user-1",
        email: "analyst@example.com",
        user_metadata: {
          full_name: "Alex Analyst",
        },
      },
    });

    const viewer = await getViewerAccount();

    expect(viewer).toEqual({
      id: "user-1",
      email: "analyst@example.com",
      displayName: "Alex Analyst",
      initials: "AA",
    });
  });

  it("uses one auth lookup for combined dashboard page state", async () => {
    vi.mocked(safeGetUser).mockResolvedValue({
      supabase: null,
      sessionCookiePresent: false,
      user: null,
    });

    const pageState = await getDashboardPageState("/");

    expect(safeGetUser).toHaveBeenCalledTimes(1);
    expect(safeGetUser).toHaveBeenCalledWith("/");
    expect(pageState.viewer).toBeNull();
    expect(pageState.data.mode).toBe("public");
  });
});
