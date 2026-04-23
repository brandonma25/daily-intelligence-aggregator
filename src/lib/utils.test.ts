import { describe, expect, it } from "vitest";

import { formatHomeBriefingDateLabel } from "@/lib/utils";

describe("formatHomeBriefingDateLabel", () => {
  it("labels same-day briefings as Today", () => {
    expect(
      formatHomeBriefingDateLabel(
        "2026-04-22T09:00:00.000Z",
        new Date("2026-04-22T12:00:00.000Z"),
      ),
    ).toBe("Today • Wednesday, April 22");
  });

  it("labels fallback briefings with their actual briefing date", () => {
    expect(
      formatHomeBriefingDateLabel(
        "2026-04-21T09:00:00.000Z",
        new Date("2026-04-22T12:00:00.000Z"),
      ),
    ).toBe("Tuesday, April 21, 2026");
  });
});
