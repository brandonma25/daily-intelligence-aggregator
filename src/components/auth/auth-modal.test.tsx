import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AuthModal from "@/components/auth/auth-modal";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const signInWithOAuth = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  isSupabaseConfigured: true,
  getSupabasePublicEnvDiagnostics: () => ({
    isConfigured: true,
    missingNames: [],
    keySource: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  }),
}));

describe("AuthModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createSupabaseBrowserClient).mockReturnValue({
      auth: {
        signInWithOAuth,
      },
    });

    window.history.replaceState({}, "", "http://localhost:3000/");
  });

  it("starts Google OAuth with the expected provider and callback URL", async () => {
    signInWithOAuth.mockResolvedValue({
      data: { url: "https://accounts.google.com/mock-oauth" },
      error: null,
    });

    render(<AuthModal open onClose={() => undefined} />);

    fireEvent.click(screen.getByRole("button", { name: /continue with google/i }));

    await waitFor(() => {
      expect(signInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: {
          redirectTo: "http://localhost:3000/auth/callback",
        },
      });
    });
  });

  it("does not surface a local error when Supabase returns a mismatched provider callback URL", async () => {
    signInWithOAuth.mockResolvedValue({
      data: {
        url: "https://example.supabase.co/auth/v1/authorize?redirect_to=https%3A%2F%2Fapp.example.com%2Fauth%2Fcallback",
      },
      error: null,
    });

    render(<AuthModal open onClose={() => undefined} />);

    fireEvent.click(screen.getByRole("button", { name: /continue with google/i }));

    await waitFor(() => {
      expect(signInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: {
          redirectTo: "http://localhost:3000/auth/callback",
        },
      });
    });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
