import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { ReadingWindowAnchor } from "@/components/dashboard/reading-window-anchor";

const storage = new Map<string, string>();

describe("ReadingWindowAnchor", () => {
  beforeEach(() => {
    storage.clear();
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
        clear: () => {
          storage.clear();
        },
      },
      configurable: true,
    });
  });

  it("shows first-briefing context when there is no prior metric", () => {
    render(
      <ReadingWindowAnchor
        briefingDate="2026-04-15T09:00:00.000Z"
        totalMinutes={18}
        previousMetric={null}
      />,
    );

    expect(screen.getByText("18 min")).toBeInTheDocument();
    expect(screen.getByText("18 min reading time today")).toBeInTheDocument();
    expect(screen.getByText("First briefing")).toBeInTheDocument();
    expect(screen.getByText("Normal day")).toBeInTheDocument();
  });

  it("shows delta vs yesterday when a previous metric exists", () => {
    render(
      <ReadingWindowAnchor
        briefingDate="2026-04-15T09:00:00.000Z"
        totalMinutes={26}
        previousMetric={{ date: "2026-04-14", totalMinutes: 20 }}
      />,
    );

    expect(screen.getByText("+6 min vs yesterday")).toBeInTheDocument();
    expect(screen.getByText("Heavy day")).toBeInTheDocument();
  });

  it("falls back to browser storage when server history is unavailable", async () => {
    window.localStorage.setItem(
      "daily-intelligence-reading-window",
      JSON.stringify({ date: "2026-04-14", totalMinutes: 11 }),
    );

    render(
      <ReadingWindowAnchor
        briefingDate="2026-04-15T09:00:00.000Z"
        totalMinutes={18}
        previousMetric={null}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("+7 min vs yesterday")).toBeInTheDocument();
    });
  });
});
