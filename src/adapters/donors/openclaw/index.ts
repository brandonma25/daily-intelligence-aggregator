import type { DonorFeed } from "@/adapters/donors/types";

export const openclawFeeds: DonorFeed[] = [
  {
    donor: "openclaw",
    source: "The Verge",
    feedUrl: "https://www.theverge.com/rss/index.xml",
    homepageUrl: "https://www.theverge.com",
    topic: "Tech",
    credibility: 74,
  },
  {
    donor: "openclaw",
    source: "Ars Technica",
    feedUrl: "https://feeds.arstechnica.com/arstechnica/index",
    homepageUrl: "https://arstechnica.com",
    topic: "Tech",
    credibility: 81,
  },
];
