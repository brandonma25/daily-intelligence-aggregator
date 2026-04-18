import type { DonorFeed } from "@/adapters/donors/types";

export const fnsFeeds: DonorFeed[] = [
  {
    donor: "fns",
    source: "Associated Press",
    feedUrl: "https://apnews.com/hub/ap-top-news?output=xml",
    homepageUrl: "https://apnews.com",
    topic: "World",
    credibility: 88,
  },
];
