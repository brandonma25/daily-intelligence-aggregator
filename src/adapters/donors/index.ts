import { afterMarketAgentFeeds } from "@/adapters/donors/after_market_agent";
import { fnsFeeds } from "@/adapters/donors/fns";
import { horizonFeeds } from "@/adapters/donors/horizon";
import { openclawFeeds } from "@/adapters/donors/openclaw";
import type { DonorFeed } from "@/adapters/donors/types";

export function getDefaultDonorFeeds(): DonorFeed[] {
  return [
    ...openclawFeeds,
    ...afterMarketAgentFeeds,
    ...fnsFeeds,
    ...horizonFeeds,
  ].slice(0, 5);
}

export type { DonorFeed };
