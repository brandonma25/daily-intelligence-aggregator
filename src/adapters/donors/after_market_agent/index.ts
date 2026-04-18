import type { DonorFeed } from "@/adapters/donors/types";

export const afterMarketAgentFeeds: DonorFeed[] = [
  {
    donor: "after_market_agent",
    source: "MarketWatch",
    feedUrl: "https://feeds.content.dowjones.io/public/rss/mw_topstories",
    homepageUrl: "https://www.marketwatch.com",
    topic: "Finance",
    credibility: 78,
  },
];
