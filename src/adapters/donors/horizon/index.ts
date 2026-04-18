import type { DonorFeed } from "@/adapters/donors/types";

export const horizonFeeds: DonorFeed[] = [
  {
    donor: "horizon",
    source: "Reuters World",
    feedUrl: "https://feeds.reuters.com/Reuters/worldNews",
    homepageUrl: "https://www.reuters.com/world/",
    topic: "World",
    credibility: 90,
  },
  {
    donor: "horizon",
    source: "Reuters Business",
    feedUrl: "https://feeds.reuters.com/reuters/businessNews",
    homepageUrl: "https://www.reuters.com/business/",
    topic: "Finance",
    credibility: 90,
  },
];
