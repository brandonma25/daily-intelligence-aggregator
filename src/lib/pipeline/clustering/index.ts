import type { NormalizedArticle } from "@/lib/models/normalized-article";
import type { SignalCluster } from "@/lib/models/signal-cluster";
import { extractKeywords, jaccardSimilarity, stableId, tokenize } from "@/lib/pipeline/shared/text";

function articleKeywords(article: NormalizedArticle) {
  return extractKeywords(`${article.title} ${article.content}`, 10);
}

function articleSimilarity(left: NormalizedArticle, right: NormalizedArticle) {
  const titleSimilarity = jaccardSimilarity(tokenize(left.title), tokenize(right.title));
  const keywordSimilarity = jaccardSimilarity(articleKeywords(left), articleKeywords(right));
  return Math.max(titleSimilarity, keywordSimilarity);
}

export function clusterNormalizedArticles(articles: NormalizedArticle[]): SignalCluster[] {
  const clusters: SignalCluster[] = [];
  const sorted = articles
    .slice()
    .sort(
      (left, right) =>
        new Date(right.published_at).getTime() - new Date(left.published_at).getTime(),
    );

  sorted.forEach((article) => {
    const match = clusters.find((cluster) => {
      const keywordOverlap = jaccardSimilarity(
        articleKeywords(article),
        cluster.topic_keywords,
      );
      const representativeSimilarity = articleSimilarity(article, cluster.representative_article);

      return keywordOverlap >= 0.28 || representativeSimilarity >= 0.48;
    });

    if (!match) {
      clusters.push({
        cluster_id: stableId(article.title, article.url),
        articles: [article],
        representative_article: article,
        topic_keywords: articleKeywords(article),
        cluster_size: 1,
      });
      return;
    }

    match.articles.push(article);
    match.cluster_size = match.articles.length;
    match.topic_keywords = extractKeywords(
      match.articles.map((entry) => `${entry.title} ${entry.content}`).join(" "),
      10,
    );

    const currentRepresentativeTime = new Date(match.representative_article.published_at).getTime();
    const articleTime = new Date(article.published_at).getTime();
    if (articleTime > currentRepresentativeTime) {
      match.representative_article = article;
    }
  });

  return clusters.sort((left, right) => {
    const sizeDelta = right.cluster_size - left.cluster_size;
    if (sizeDelta !== 0) {
      return sizeDelta;
    }

    return (
      new Date(right.representative_article.published_at).getTime() -
      new Date(left.representative_article.published_at).getTime()
    );
  });
}
