export type DonorFeed = {
  donor: "openclaw" | "after_market_agent" | "fns" | "horizon";
  source: string;
  feedUrl: string;
  homepageUrl: string;
  topic: "Tech" | "Finance" | "World";
  credibility: number;
};
