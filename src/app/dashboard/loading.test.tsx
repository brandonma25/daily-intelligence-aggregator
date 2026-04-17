import type { ReactNode } from "react";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Loading from "@/app/dashboard/loading";

vi.mock("@/components/app-shell", () => ({
  AppShell: ({ children }: { children: ReactNode }) => <div data-testid="app-shell">{children}</div>,
}));

describe("dashboard loading route", () => {
  it("renders a route-level dashboard loading shell", () => {
    render(<Loading />);

    expect(screen.getByTestId("app-shell")).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Loading dashboard" })).toBeInTheDocument();
    expect(screen.getByText("Loading today's dashboard")).toBeInTheDocument();
    expect(screen.getByText("Top events today")).toBeInTheDocument();
    expect(screen.getByText("Coverage map")).toBeInTheDocument();
    expect(screen.getByText("Compact event view by topic")).toBeInTheDocument();
  });
});
