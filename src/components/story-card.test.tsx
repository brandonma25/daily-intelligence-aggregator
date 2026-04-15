import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StoryCard } from "@/components/story-card";
import type { BriefingItem } from "@/lib/types";

function createItem(overrides: Partial<BriefingItem>): BriefingItem {
  return {
    id: overrides.id ?? "item-1",
    topicId: overrides.topicId ?? "topic-1",
    topicName: overrides.topicName ?? "Finance",
    title: overrides.title ?? "Fed signals rates will stay elevated",
    whatHappened: overrides.whatHappened ?? "Markets are repricing after the latest Fed signal.",
    keyPoints: overrides.keyPoints ?? ["Point one", "Point two", "Point three"],
    whyItMatters: overrides.whyItMatters ?? "It matters because markets are repricing.",
    sources: overrides.sources ?? [{ title: "Reuters", url: "https://example.com/story" }],
    estimatedMinutes: overrides.estimatedMinutes ?? 4,
    read: overrides.read ?? false,
    priority: overrides.priority ?? "top",
    matchedKeywords: overrides.matchedKeywords ?? ["fed"],
    sourceCount: overrides.sourceCount ?? 1,
    timeline: overrides.timeline,
    rankingSignals: overrides.rankingSignals ?? [],
    eventIntelligence: overrides.eventIntelligence,
  };
}

describe("StoryCard timeline", () => {
  it("renders grouped timeline entries", () => {
    render(
      <StoryCard
        item={createItem({
          timeline: [
            {
              dateKey: "2026-04-10",
              dateLabel: "Apr 10",
              entries: [
                {
                  title: "First update",
                  summary: "Initial report",
                  source: "Reuters",
                },
                {
                  title: "Second update",
                  summary: "Follow-up report",
                  source: "Bloomberg",
                },
              ],
            },
          ],
        })}
      />,
    );

    expect(screen.getByText("Timeline")).toBeInTheDocument();
    expect(screen.getByText("Apr 10")).toBeInTheDocument();
    expect(screen.getByText("First update")).toBeInTheDocument();
    expect(screen.getByText("Second update")).toBeInTheDocument();
  });

  it("renders the developing-story state for a single timeline article", () => {
    render(
      <StoryCard
        item={createItem({
          timeline: [
            {
              dateKey: "2026-04-10",
              dateLabel: "Apr 10",
              entries: [
                {
                  title: "Only update",
                  summary: "Initial report",
                  source: "Reuters",
                },
              ],
            },
          ],
        })}
      />,
    );

    expect(screen.getByText(/Developing story/i)).toBeInTheDocument();
  });

  it("renders the no-timeline state when data is missing", () => {
    render(<StoryCard item={createItem({ timeline: [] })} />);

    expect(screen.getByText("No timeline available yet")).toBeInTheDocument();
  });
});
