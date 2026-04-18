import type { NormalizedArticle } from "@/lib/models/normalized-article";

export interface SignalCluster {
  cluster_id: string;
  articles: NormalizedArticle[];
  representative_article: NormalizedArticle;
  topic_keywords: string[];
  cluster_size: number;
}
