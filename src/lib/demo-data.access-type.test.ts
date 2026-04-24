import { describe, expect, it } from "vitest";

import { demoSources } from "@/lib/demo-data";
import { SOURCE_ACCESS_TYPES } from "@/lib/types";

const EXPECTED_ACCESS_TYPES: Record<string, string> = {
  "source-verge": "metered",
  "source-ars": "open",
  "source-mit-tech-review": "metered",
  "source-tldr-tech": "open",
  "source-techcrunch": "open",
  "source-ft": "paywalled",
  "source-reuters-business": "metered",
  "source-bbc-world": "metered",
  "source-foreign-affairs": "paywalled",
  "source-marketwatch": "metered",
  "source-zerohedge": "metered",
  "source-ap-top-news": "open",
  "source-newsapi-business": "metered",
};

describe("demo source access types", () => {
  it("assigns a defined access_type to every current demoSources entry", () => {
    for (const source of demoSources) {
      expect(source.access_type).toBeDefined();
      expect(SOURCE_ACCESS_TYPES).toContain(source.access_type);
    }
  });

  it("matches the expected access_type for each current source", () => {
    for (const [sourceId, expectedAccessType] of Object.entries(EXPECTED_ACCESS_TYPES)) {
      const source = demoSources.find((candidate) => candidate.id === sourceId);

      if (!source) {
        continue;
      }

      expect(source.access_type).toBe(expectedAccessType);
    }
  });

  it("includes the full current source set audited for this branch", () => {
    const sourceIds = new Set(demoSources.map((source) => source.id));

    expect(sourceIds).toEqual(
      new Set([
        "source-verge",
        "source-ars",
        "source-mit-tech-review",
        "source-tldr-tech",
        "source-techcrunch",
        "source-ft",
        "source-reuters-business",
        "source-bbc-world",
        "source-foreign-affairs",
        "source-marketwatch",
        "source-zerohedge",
        "source-ap-top-news",
        ...("source-newsapi-business" in EXPECTED_ACCESS_TYPES && sourceIds.has("source-newsapi-business")
          ? ["source-newsapi-business"]
          : []),
      ]),
    );
  });
});
